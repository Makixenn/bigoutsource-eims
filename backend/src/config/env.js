import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: resolve(__dirname, '../../.env'), quiet: true });
dotenv.config({ path: resolve(__dirname, '../../../.env'), quiet: true });

const nodeEnv = process.env.NODE_ENV || 'development';
const useLocalSeedAdmin = nodeEnv !== 'production';

const jwtSecret = process.env.JWT_SECRET;

const required = [
  ['JWT_SECRET', jwtSecret],
];

for (const [key, value] of required) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const env = {
  nodeEnv,
  port: Number(process.env.PORT || 5001),
  jwtSecret,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000,https://bigoutsource-eims.vercel.app',
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:3000,https://bigoutsource-eims.vercel.app')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  seedSuperAdmin: {
    email: process.env.SEED_SUPER_ADMIN_EMAIL || process.env.ADMIN_EMAIL || (useLocalSeedAdmin ? 'kamote@gmail.com' : ''),
    password: process.env.SEED_SUPER_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || (useLocalSeedAdmin ? 'kamote123' : ''),
    fullName: process.env.SEED_SUPER_ADMIN_FULL_NAME || (useLocalSeedAdmin ? 'Local Super Admin' : 'System Administrator'),
    department: process.env.SEED_SUPER_ADMIN_DEPARTMENT || 'Administration',
    site: process.env.SEED_SUPER_ADMIN_SITE || 'HQ',
  },
};
