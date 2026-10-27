import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    fullName: { type: String, required: true, trim: true },
    firstName: { type: String, trim: true, default: '' },
    lastName: { type: String, trim: true, default: '' },
    callingName: { type: String, trim: true, default: '' },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    phone: { type: String, trim: true, default: '' },
    organization: { type: String, trim: true, default: '' },
    jobTitle: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, default: '' },
    country: { type: String, trim: true, default: '' },
    bio: { type: String, trim: true, default: '' },
    whatsapp: { type: String, trim: true, default: '' },
    instagram: { type: String, trim: true, default: '' },
    linkedin: { type: String, trim: true, default: '' },
    website: { type: String, trim: true, default: '' },
    photo: { type: String, default: '' },
    coverImage: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
