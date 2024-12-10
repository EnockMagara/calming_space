import argon2 from 'argon2';
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: function() { return !this.spotifyId; }
  },
  role: {
    type: String,
    default: 'user'
  },
  spotifyId: {
    type: String,
    unique: true,
    sparse: true
  },
  accessToken: {
    type: String
  },
  refreshToken: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

userSchema.pre('save', async function (next) {
  const user = this;
  if (!user.isModified('password')) return next();
  try {
    user.password = await argon2.hash(user.password);
    return next();
  } catch (err) {
    return next(err);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return argon2.verify(this.password, candidatePassword);
};

export const User = mongoose.model('User', userSchema);
