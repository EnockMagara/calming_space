import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  console.log('Attempting to connect to MongoDB...');
  const startTime = Date.now();
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB connected in ${Date.now() - startTime}ms`);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  } catch (error) {
    console.error('MongoDB disconnection error:', error);
  }
};

export { connectDB, disconnectDB };