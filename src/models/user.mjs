// Import necessary modules
import mongoose from 'mongoose';

// Define User Schema
const userSchema = new mongoose.Schema({
  username: {
    type: String,       // Data type is String
    required: true,     // Field is required
    unique: true,       // Must be unique
    trim: true          // Trim whitespace
  },
  password: {
    type: String,       // Data type is String
    required: true      // Field is required
  },
  role: {
    type: String,       // Data type is String
    default: 'user'    // Default role is 'user'
  },
  createdAt: {
    type: Date,         // Data type is Date
    default: Date.now   // Default value is current date
  }
});

// Export User model
export const User = mongoose.model('User', userSchema);
