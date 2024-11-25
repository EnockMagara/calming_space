// Import necessary modules
import mongoose from 'mongoose';

// Define Message Schema
const messageSchema = new mongoose.Schema({
  text: {
    type: String,       // Data type is String
    required: true,     // Field is required
    trim: true          // Trim whitespace
  },
  user: {
    type: mongoose.Schema.Types.ObjectId, // Reference to User model
    ref: 'User',                          // Reference to the User collection
    required: true                        // Field is required
  },
  approved: {
    type: Boolean,      // Approval status
    default: false      // Default not approved
  },
  createdAt: {
    type: Date,         // Data type is Date
    default: Date.now   // Default value is current date
  }
});

// Export Message model
export const Message = mongoose.model('Message', messageSchema);
