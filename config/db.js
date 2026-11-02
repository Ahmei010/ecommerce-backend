import mongoose from 'mongoose';

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error('MONGO_URI (or MONGODB_URI) is not set in backend/.env.');
  }

  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
  if (isProduction) {
    const hostname = new URL(mongoUri).hostname.toLowerCase();
    if (['localhost', '127.0.0.1', '[::1]'].includes(hostname)) {
      throw new Error('MONGO_URI must not point to localhost in production.');
    }
  }

  try {
    const conn = await mongoose.connect(mongoUri, { dbName: 'ecommerce' });
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    throw error;
  }
};

export default connectDB;