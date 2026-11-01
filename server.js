import './config/loadEnv.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

const app = express();
const backendDirectory = fileURLToPath(new URL('.', import.meta.url));

app.use(cors({
  origin: process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json({ limit: '10kb' }));
app.use('/uploads', express.static(path.join(backendDirectory, 'uploads')));

app.get("/api/health", (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Backend is running successfully.',
    data: {
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    },
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/admin', adminRoutes);

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

app.use((error, req, res, next) => {
  let statusCode = Number.isInteger(error.statusCode) ? error.statusCode : 500;
  let message = statusCode === 500 ? 'An unexpected server error occurred.' : error.message;

  if (error.code === 11000) {
    statusCode = 409;
    message = 'An account with this email already exists.';
  } else if (error.name === 'ValidationError') {
    statusCode = 400;
    message = error.message;
  } else if (error.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Request body contains invalid JSON.';
  } else if (error.type === 'entity.too.large') {
    statusCode = 413;
    message = 'Request body is too large.';
  } else if (error.name === 'MulterError' && error.code === 'LIMIT_FILE_SIZE') {
    statusCode = 413;
    message = 'Product images must be 5 MB or smaller.';
  } else if (error.message?.startsWith('Upload a JPG')) {
    statusCode = 400;
    message = error.message;
  }

  if (statusCode === 500) {
    console.error(error);
  }

  return res.status(statusCode).json({
    success: false,
    message,
  });
});

const PORT = Number(process.env.PORT) || 5000;

const startServer = async () => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET could not be loaded or generated.');
  }

  console.log('JWT_SECRET loaded successfully.');
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}.`);
  });

  server.on('error', async (error) => {
    console.error(`Server failed to listen on port ${PORT}: ${error.message}`);
    await mongoose.disconnect();
    process.exitCode = 1;
  });
};

startServer().catch((error) => {
  console.error(`Server failed to start: ${error.message}`);
  process.exitCode = 1;
});