import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from './models/User.js';

const { MONGODB_URI, JWT_SECRET, PORT = 5000 } = process.env;
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

const app = express();
app.use(express.json({ limit: '4mb' }));

const sendError = (res, status, code, message) => res.status(status).json({ code, message });

const issueToken = (user) => jwt.sign({ sub: user._id.toString() }, JWT_SECRET, { expiresIn: '7d' });

const toPublicUser = (user) => ({
  id: user._id.toString(),
  fullName: user.fullName,
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

app.post('/api/auth/signup', async (req, res) => {
  try {
    const body = req.body ?? {};
    const fullName = String(body.fullName ?? '').trim();
    const email = String(body.email ?? '').trim().toLowerCase();
    const password = String(body.password ?? '');

    if (!fullName) return sendError(res, 400, 'INVALID_INPUT', 'Full name is required.');
    if (!EMAIL_PATTERN.test(email)) return sendError(res, 400, 'INVALID_INPUT', 'Enter a valid email address.');
    if (password.length < 8) return sendError(res, 400, 'INVALID_INPUT', 'Password must be at least 8 characters.');

    if (await User.exists({ email })) {
      return sendError(res, 409, 'EMAIL_EXISTS', 'A profile with this email already exists. Please sign in.');
    }

    const optional = Object.fromEntries(OPTIONAL_FIELDS.map((field) => [field, String(body[field] ?? '').trim()]));
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ ...optional, fullName, email, passwordHash });

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
    res.json({ user: toPublicUser(user) });
  } catch (error) {
    console.error(error);
    sendError(res, 500, 'SERVER_ERROR', 'Could not load profile.');
  }
});

app.put('/api/auth/me', requireAuth, async (req, res) => {
  try {
    const body = req.body ?? {};
    const fullName = String(body.fullName ?? '').trim();
    if (!fullName) return sendError(res, 400, 'INVALID_INPUT', 'Name is required.');

    const updates = { fullName };
    for (const field of PROFILE_TEXT_FIELDS) {
      const value = String(body[field] ?? '').trim();
      if (value.length > MAX_TEXT_LENGTH) {
        return sendError(res, 400, 'INVALID_INPUT', `${field} is too long.`);
      }
      updates[field] = value;
    }

    const photo = String(body.photo ?? '');
    if (photo && (!/^data:image\/(png|jpe?g|gif|webp);base64,/i.test(photo) || photo.length > MAX_PHOTO_LENGTH)) {
      return sendError(res, 400, 'INVALID_INPUT', 'Profile photo must be a PNG, JPG, GIF, or WebP image under 1.5 MB.');
    }
    updates.photo = photo;

    const user = await User.findByIdAndUpdate(req.userId, updates, { new: true });
    if (!user) return sendError(res, 401, 'UNAUTHORIZED', 'Profile no longer exists.');
    res.json({ user: toPublicUser(user) });
  } catch (error) {
    console.error(error);
    sendError(res, 500, 'SERVER_ERROR', 'Could not save profile.');
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
