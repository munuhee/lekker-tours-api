import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(
      `Missing required environment variable ${name}. Copy .env.example to .env and fill it in.`
    );
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT ?? 4000),

  databaseUrl: required(
    'DATABASE_URL',
    'postgresql://postgres:postgres@127.0.0.1:5432/lekker_tours?schema=public'
  ),
  webOrigin: required('WEB_ORIGIN', 'http://localhost:3000'),

  // This service's own publicly reachable origin. It is baked into uploaded
  // image URLs, which are stored on content documents and rendered by the
  // public site — so in production it must be the deployed hostname, not
  // localhost, or every uploaded image breaks.
  publicApiUrl: (
    process.env.PUBLIC_API_URL ?? `http://localhost:${Number(process.env.PORT ?? 4000)}`
  ).replace(/\/+$/, ''),

  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',

  revalidateSecret: process.env.REVALIDATE_SECRET ?? '',

  admin: {
    email: process.env.ADMIN_EMAIL ?? 'admin@lekkertours.com',
    password: process.env.ADMIN_PASSWORD ?? '',
    name: process.env.ADMIN_NAME ?? 'Administrator',
  },
};

// Refuse to boot in production with the shipped development secret.
if (env.isProduction && env.jwtSecret.startsWith('dev-only')) {
  throw new Error('JWT_SECRET is still the development placeholder. Set a real secret in production.');
}
