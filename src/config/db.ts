import mongoose from 'mongoose';

// Ensure the mongoose connection is cached in a global variable for serverless environments
let cached: mongoose.Connection | null = null;

export const connectDB = async (uri?: string) => {
  if (cached) {
    console.log('Using cached MongoDB connection');
    return cached;
  }

  const mongoUri = uri || process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('Please define the MONGODB_URI environment variable');
  }

  try {
    const db = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    cached = db.connection;
    console.log('MongoDB connected successfully');
    return cached;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};
