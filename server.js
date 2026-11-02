
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

const backendDirectory = fileURLToPath(
  new URL('.', import.meta.url)
);

const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
const configuredFrontendOrigin = process.env.FRONTEND_URL || process.env.CLIENT_URL;

function getFrontendOrigin() {
  if (!configuredFrontendOrigin) {
    if (isProduction) {
      throw new Error('FRONTEND_URL must be configured in production.');
    }

    return 'http://localhost:5173';
  }

  let parsedOrigin;
  try {
    parsedOrigin = new URL(configuredFrontendOrigin);
  } catch {
    throw new Error('FRONTEND_URL must be a valid frontend origin.');
  }

  const isLoopback = ['localhost', '127.0.0.1', '[::1]'].includes(parsedOrigin.hostname);
  if (
    !['http:', 'https:'].includes(parsedOrigin.protocol) ||
    parsedOrigin.origin !== configuredFrontendOrigin ||
    (isProduction && isLoopback)
  ) {
    throw new Error('FRONTEND_URL must be an exact, non-local frontend origin in production.');
  }

  return configuredFrontendOrigin;
}

app.use(cors({
  origin: getFrontendOrigin(),
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json({ limit: '10kb' }));

// Local uploads only.
// Vercel does not serve files through express.static().
if (process.env.NODE_ENV !== 'production') {
  app.use(
    '/uploads',
    express.static(path.join(backendDirectory, 'uploads'))
  );
}

app.get('/', (req, res) => {
  return res.status(200).json({
    api: 'SHOP.CO E-commerce API',
    status: 'ok',
    message: 'API is running.',
    environment: process.env.NODE_ENV || (isProduction ? 'production' : 'development'),
  });
});

// MongoDB connection caching for Vercel
let dbConnectionPromise = null;

const ensureDBConnection = async () => {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (mongoose.connection.readyState === 2) {
    await mongoose.connection.asPromise();
    return;
  }

  if (!dbConnectionPromise) {
    dbConnectionPromise = connectDB().catch((error) => {
      dbConnectionPromise = null;
      throw error;
    });
  }

  await dbConnectionPromise;
};

async function healthCheck(req, res) {
  try {
    await ensureDBConnection();
    return res.status(200).json({
      success: true,
      message: 'Backend is running successfully.',
      data: { application: 'running', database: 'connected' },
    });
  } catch (error) {
    console.error(`Health check database connection failed: ${error.message}`);
    return res.status(503).json({
      success: false,
      message: 'Backend is running but the database is unavailable.',
      data: { application: 'running', database: 'disconnected' },
    });
  }
}

app.get('/health', healthCheck);
app.get('/api/health', healthCheck);

// Connect database before handling API requests
app.use(async (req, res, next) => {
  try {
    await ensureDBConnection();
    next();
  } catch (error) {
    next(error);
  }
});

// Existing API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/admin', adminRoutes);

// 404 Handler
app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global Error Handler
app.use((error, req, res, next) => {
  let statusCode = Number.isInteger(error.statusCode)
    ? error.statusCode
    : 500;

  let message =
    statusCode === 500
      ? 'An unexpected server error occurred.'
      : error.message;

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
  } else if (
    error.name === 'MulterError' &&
    error.code === 'LIMIT_FILE_SIZE'
  ) {
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

// Export Express app for Vercel
export default app;

// Start a local HTTP server when run directly; Vercel imports the app instead.
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const port = Number(process.env.PORT) || 5000;
  app.listen(port, () => {
    console.log(`Server running on port ${port}.`);
  });
}
