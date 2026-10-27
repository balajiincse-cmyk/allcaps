import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from './models/User.js';
import Project from './models/Project.js';

const { MONGODB_URI, JWT_SECRET, PORT = 5000, ADMIN_EMAILS = 'balajiincse@gmail.com' } = process.env;
const OWNER_EMAILS = ADMIN_EMAILS.split(',').map((email) => email.trim().toLowerCase()).filter(Boolean);
const isOwnerEmail = (email) => OWNER_EMAILS.includes(String(email).toLowerCase());
const USE_MEMORY_DB = process.argv.includes('--memory-db');

if ((!MONGODB_URI && !USE_MEMORY_DB) || !JWT_SECRET) {
  throw new Error('MONGODB_URI and JWT_SECRET must be set in .env');
}

const resolveMongoUri = async () => {
  if (!USE_MEMORY_DB) return MONGODB_URI;
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  const memoryServer = await MongoMemoryServer.create();
  console.log('Using in-memory MongoDB (data is lost when the server stops)');
  return memoryServer.getUri('personal-website');
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OPTIONAL_FIELDS = ['phone', 'organization', 'jobTitle', 'city', 'country'];
const PROFILE_TEXT_FIELDS = [...OPTIONAL_FIELDS, 'bio', 'whatsapp', 'instagram', 'linkedin', 'website'];
const MAX_TEXT_LENGTH = 2000;
const MAX_PHOTO_LENGTH = 2.5 * 1024 * 1024;
const MAX_COVER_LENGTH = 3 * 1024 * 1024;

const app = express();
app.use(express.json({ limit: '8mb' }));

const sendError = (res, status, code, message) => res.status(status).json({ code, message });

const issueToken = (user) => jwt.sign({ sub: user._id.toString() }, JWT_SECRET, { expiresIn: '7d' });

const toPublicUser = (user) => ({
  id: user._id.toString(),
  role: user.role,
  isOwner: isOwnerEmail(user.email),
  fullName: user.fullName,
  firstName: user.firstName,
  lastName: user.lastName,
  callingName: user.callingName,
  email: user.email,
  phone: user.phone,
  organization: user.organization,
  jobTitle: user.jobTitle,
  city: user.city,
  country: user.country,
  bio: user.bio,
  whatsapp: user.whatsapp,
  instagram: user.instagram,
  linkedin: user.linkedin,
  website: user.website,
  photo: user.photo,
  coverImage: user.coverImage,
  createdAt: user.createdAt,
});

const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.replace(/^Bearer /, '');
  if (!token) return sendError(res, 401, 'UNAUTHORIZED', 'Sign in required.');
  try {
    req.userId = jwt.verify(token, JWT_SECRET).sub;
    next();
  } catch {
    sendError(res, 401, 'UNAUTHORIZED', 'Session expired. Please sign in again.');
  }
};

const ensureOwnerRole = async (user) => {
  if (isOwnerEmail(user.email) && user.role !== 'admin') {
    user.role = 'admin';
    await user.save();
  }
  return user;
};

const requireAdmin = async (req, res, next) => {
  requireAuth(req, res, async () => {
    try {
      const user = await User.findById(req.userId);
      if (!user) return sendError(res, 401, 'UNAUTHORIZED', 'Profile no longer exists.');
      if (user.role !== 'admin') return sendError(res, 403, 'FORBIDDEN', 'Admin access required.');
      req.adminUser = user;
      next();
    } catch (error) {
      console.error(error);
      sendError(res, 500, 'SERVER_ERROR', 'Could not verify admin access.');
    }
  });
};

const isImageData = (value, maxLength) =>
  /^data:image\/(png|jpe?g|gif|webp);base64,/i.test(value) && value.length <= maxLength;

// Returns { updates } or { error } from a profile edit payload.
const buildProfileUpdates = (body) => {
  const firstName = String(body.firstName ?? '').trim();
  const lastName = String(body.lastName ?? '').trim();
  if (!firstName) return { error: 'First name is required.' };
  if (!lastName) return { error: 'Last name is required.' };

  const updates = {
    firstName,
    lastName,
    callingName: String(body.callingName ?? '').trim() || firstName,
    fullName: `${firstName} ${lastName}`,
  };
  for (const field of PROFILE_TEXT_FIELDS) {
    const value = String(body[field] ?? '').trim();
    if (value.length > MAX_TEXT_LENGTH) return { error: `${field} is too long.` };
    updates[field] = value;
  }

  const photo = String(body.photo ?? '');
  if (photo && !isImageData(photo, MAX_PHOTO_LENGTH)) {
    return { error: 'Profile photo must be a PNG, JPG, GIF, or WebP image under 1.5 MB.' };
  }
  updates.photo = photo;

  const coverImage = String(body.coverImage ?? '');
  if (coverImage && !isImageData(coverImage, MAX_COVER_LENGTH)) {
    return { error: 'Cover image must be a PNG, JPG, GIF, or WebP image under 2 MB.' };
  }
  updates.coverImage = coverImage;

  return { updates };
};

app.post('/api/auth/signup', async (req, res) => {
  try {
    const body = req.body ?? {};
    const firstName = String(body.firstName ?? '').trim();
    const lastName = String(body.lastName ?? '').trim();
    const callingName = String(body.callingName ?? '').trim() || firstName;
    const fullName = `${firstName} ${lastName}`.trim();
    const email = String(body.email ?? '').trim().toLowerCase();
    const password = String(body.password ?? '');

    if (!firstName) return sendError(res, 400, 'INVALID_INPUT', 'First name is required.');
    if (!lastName) return sendError(res, 400, 'INVALID_INPUT', 'Last name is required.');
    if (!EMAIL_PATTERN.test(email)) return sendError(res, 400, 'INVALID_INPUT', 'Enter a valid email address.');
    if (password.length < 8) return sendError(res, 400, 'INVALID_INPUT', 'Password must be at least 8 characters.');

    const optional = Object.fromEntries(OPTIONAL_FIELDS.map((field) => [field, String(body[field] ?? '').trim()]));
    const missing = OPTIONAL_FIELDS.find((field) => !optional[field]);
    if (missing) return sendError(res, 400, 'INVALID_INPUT', `${missing} is required.`);

    if (await User.exists({ email })) {
      return sendError(res, 409, 'EMAIL_EXISTS', 'A profile with this email already exists. Please sign in.');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ ...optional, bio: String(body.bio ?? '').trim().slice(0, MAX_TEXT_LENGTH), fullName, firstName, lastName, callingName, email, passwordHash, role: isOwnerEmail(email) ? 'admin' : 'user' });

    res.status(201).json({ token: issueToken(user), user: toPublicUser(user) });
  } catch (error) {
    console.error(error);
    sendError(res, 500, 'SERVER_ERROR', 'Could not create profile. Please try again.');
  }
});

app.post('/api/auth/signin', async (req, res) => {
  try {
    const email = String(req.body?.email ?? '').trim().toLowerCase();
    const password = String(req.body?.password ?? '');

    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user) return sendError(res, 404, 'PROFILE_NOT_FOUND', 'No profile found for this email.');

    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) return sendError(res, 401, 'INVALID_CREDENTIALS', 'Incorrect password.');

    await ensureOwnerRole(user);
    res.json({ token: issueToken(user), user: toPublicUser(user) });
  } catch (error) {
    console.error(error);
    sendError(res, 500, 'SERVER_ERROR', 'Sign in failed. Please try again.');
  }
});

app.get('/api/auth/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return sendError(res, 401, 'UNAUTHORIZED', 'Profile no longer exists.');
    await ensureOwnerRole(user);
    res.json({ user: toPublicUser(user) });
  } catch (error) {
    console.error(error);
    sendError(res, 500, 'SERVER_ERROR', 'Could not load profile.');
  }
});

app.put('/api/auth/me', requireAuth, async (req, res) => {
  try {
    const { updates, error } = buildProfileUpdates(req.body ?? {});
    if (error) return sendError(res, 400, 'INVALID_INPUT', error);

    const user = await User.findByIdAndUpdate(req.userId, updates, { new: true });
    if (!user) return sendError(res, 401, 'UNAUTHORIZED', 'Profile no longer exists.');
    res.json({ user: toPublicUser(user) });
  } catch (error) {
    console.error(error);
    sendError(res, 500, 'SERVER_ERROR', 'Could not save profile.');
  }
});

const LIST_PROJECTION = '-photo -coverImage -passwordHash';

app.get('/api/admin/users', requireAdmin, async (req, res) => {
  try {
    const users = await User.find().select(LIST_PROJECTION).sort({ createdAt: -1 });
    res.json({ users: users.map(toPublicUser) });
  } catch (error) {
    console.error(error);
    sendError(res, 500, 'SERVER_ERROR', 'Could not load users.');
  }
});

const loadTargetUser = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    sendError(res, 400, 'INVALID_INPUT', 'Invalid user id.');
    return null;
  }
  const user = await User.findById(req.params.id);
  if (!user) sendError(res, 404, 'NOT_FOUND', 'User not found.');
  return user;
};

app.get('/api/admin/users/:id', requireAdmin, async (req, res) => {
  try {
    const user = await loadTargetUser(req, res);
    if (user) res.json({ user: toPublicUser(user) });
  } catch (error) {
    console.error(error);
    sendError(res, 500, 'SERVER_ERROR', 'Could not load user.');
  }
});

app.put('/api/admin/users/:id', requireAdmin, async (req, res) => {
  try {
    const user = await loadTargetUser(req, res);
    if (!user) return;

    const { updates, error } = buildProfileUpdates(req.body ?? {});
    if (error) return sendError(res, 400, 'INVALID_INPUT', error);

    const email = String(req.body?.email ?? user.email).trim().toLowerCase();
    if (!EMAIL_PATTERN.test(email)) return sendError(res, 400, 'INVALID_INPUT', 'Enter a valid email address.');
    if (email !== user.email) {
      if (isOwnerEmail(user.email)) {
        return sendError(res, 400, 'INVALID_INPUT', 'The owner account email cannot be changed.');
      }
      if (await User.exists({ email, _id: { $ne: user._id } })) {
        return sendError(res, 409, 'EMAIL_EXISTS', 'Another profile already uses this email.');
      }
      updates.email = email;
    }

    user.set(updates);
    await user.save();
    res.json({ user: toPublicUser(user) });
  } catch (error) {
    console.error(error);
    sendError(res, 500, 'SERVER_ERROR', 'Could not update user.');
  }
});

app.put('/api/admin/users/:id/role', requireAdmin, async (req, res) => {
  try {
    const role = req.body?.role;
    if (!['user', 'admin'].includes(role)) return sendError(res, 400, 'INVALID_INPUT', 'Role must be user or admin.');

    const user = await loadTargetUser(req, res);
    if (!user) return;
    if (role === 'user') {
      if (user.id === req.adminUser.id) return sendError(res, 400, 'INVALID_INPUT', 'You cannot remove your own admin access.');
      if (isOwnerEmail(user.email)) return sendError(res, 400, 'INVALID_INPUT', 'Owner admin access cannot be removed.');
    }

    user.role = role;
    await user.save();
    res.json({ user: toPublicUser(user) });
  } catch (error) {
    console.error(error);
    sendError(res, 500, 'SERVER_ERROR', 'Could not change role.');
  }
});

app.delete('/api/admin/users/:id', requireAdmin, async (req, res) => {
  try {
    const user = await loadTargetUser(req, res);
    if (!user) return;
    if (user.id === req.adminUser.id) return sendError(res, 400, 'INVALID_INPUT', 'You cannot delete your own account here.');
    if (isOwnerEmail(user.email)) return sendError(res, 400, 'INVALID_INPUT', 'The owner account cannot be deleted.');

    await user.deleteOne();
    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    sendError(res, 500, 'SERVER_ERROR', 'Could not delete user.');
  }
});

app.get('/api/projects', requireAuth, async (req, res) => {
  try {
    if (!await User.exists({ _id: req.userId })) {
      return sendError(res, 401, 'UNAUTHORIZED', 'Profile no longer exists.');
    }
    const projects = await Project.find().sort({ createdAt: 1 });
    res.json({ projects });
  } catch (error) {
    console.error(error);
    sendError(res, 500, 'SERVER_ERROR', 'Could not load projects.');
  }
});

const validateProject = (req, res, next) => {
    const { title, description, features, images = [] } = req.body ?? {};
    if (typeof title !== 'string' || !title.trim() || title.trim().length > 200) {
      return sendError(res, 400, 'INVALID_INPUT', 'Project title is required and must be at most 200 characters.');
    }
    if (typeof description !== 'string' || !description.trim() || description.trim().length > 10000) {
      return sendError(res, 400, 'INVALID_INPUT', 'Project description is required and must be at most 10,000 characters.');
    }
    if (!Array.isArray(features) || !features.length || features.length > 50 ||
      features.some((feature) => typeof feature !== 'string' || !feature.trim() || feature.trim().length > 500)) {
      return sendError(res, 400, 'INVALID_INPUT', 'Provide 1 to 50 features, at most 500 characters each.');
    }
    if (!Array.isArray(images) || images.length > 4 || images.some((image) =>
      typeof image !== 'string' || !/^data:image\/(png|jpeg|gif|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(image) ||
      Buffer.byteLength(image.split(',')[1], 'base64') > 1024 * 1024)) {
      return sendError(res, 400, 'INVALID_INPUT', 'Upload up to 4 PNG, JPG, GIF, or WebP images, at most 1 MB each.');
    }
    req.projectDetails = {
      title: title.trim(),
      description: description.trim(),
      features: features.map((feature) => feature.trim()),
      images,
    };
    next();
};

app.post('/api/projects', requireAdmin, validateProject, async (req, res) => {
  try {
    const project = await Project.create({ ...req.projectDetails, createdBy: req.userId });
    res.status(201).json({ project });
  } catch (error) {
    console.error(error);
    sendError(res, 500, 'SERVER_ERROR', 'Could not create project.');
  }
});

app.put('/api/projects/:id', requireAdmin, validateProject, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return sendError(res, 400, 'INVALID_INPUT', 'Invalid project id.');
    }
    const project = await Project.findByIdAndUpdate(req.params.id, req.projectDetails, {
      new: true, runValidators: true,
    });
    if (!project) return sendError(res, 404, 'NOT_FOUND', 'Project not found.');
    res.json({ project });
  } catch (error) {
    console.error(error);
    sendError(res, 500, 'SERVER_ERROR', 'Could not update project.');
  }
});

app.delete('/api/projects/:id', requireAdmin, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return sendError(res, 400, 'INVALID_INPUT', 'Invalid project id.');
    }
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return sendError(res, 404, 'NOT_FOUND', 'Project not found.');
    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    sendError(res, 500, 'SERVER_ERROR', 'Could not delete project.');
  }
});

const distDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get(/^\/(?!api\/).*/, (req, res) => res.sendFile(path.join(distDir, 'index.html')));
}

resolveMongoUri()
  .then((uri) => mongoose.connect(uri))
  .then(() => {
    app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
  })
  .catch((error) => {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  });
