import mongoose from 'mongoose';

// Define Music Metadata Schema
const musicSchema = new mongoose.Schema({
  filename: {
    type: String,       // Name of the file
    required: true,     // Field is required
    unique: true,       // Must be unique
    trim: true          // Trim whitespace
  },
  type: {
    type: String,       // Type of music
    enum: ['ambient', 'rain', 'ocean', 'forest', 'music'], // Allowed types
    required: true      // Field is required
  },
  uploadedAt: {
    type: Date,         // Date of upload
    default: Date.now   // Default value is current date
  },
  description: {
    type: String,       // Optional description
    trim: true          // Trim whitespace
  }
});

// Export Music model
export const Music = mongoose.model('Music', musicSchema);
