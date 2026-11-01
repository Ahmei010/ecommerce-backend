
import dotenv from 'dotenv';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Local environment file path
const envPath = fileURLToPath(
  new URL('../.env', import.meta.url)
);

// Load .env only in local development
if (process.env.NODE_ENV !== 'production') {
  if (existsSync(envPath)) {
    const result = dotenv.config({
      path: envPath,
    });

    if (result.error) {
      throw new Error(
        `Could not load environment file: ${result.error.message}`
      );
    }
  }
}

// JWT_SECRET must be configured manually
if (!process.env.JWT_SECRET?.trim()) {
  throw new Error(
    'JWT_SECRET is missing. Configure it in environment variables.'
  );
}

console.log('Environment variables loaded successfully.');
