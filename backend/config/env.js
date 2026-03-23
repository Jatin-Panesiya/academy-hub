import dotenv from 'dotenv';

dotenv.config();

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: Number(process.env.PORT ?? 3000),
  MONGODB_URI: process.env.MONGODB_URI ?? '',
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? '*',
  JWT_SECRET: process.env.JWT_SECRET ?? '',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '1d',
  BCRYPT_SALT_ROUNDS: Number(process.env.BCRYPT_SALT_ROUNDS ?? 10),
  ADMIN_CREATION_KEY: process.env.ADMIN_CREATION_KEY ?? '',
};

// Fail fast in production if MongoDB URI is missing.
if (env.NODE_ENV === 'production') {
  required('MONGODB_URI');
  required('JWT_SECRET');
}

