import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import jwt from 'jsonwebtoken';

// Load .env early — jwt.js is the first module that needs JWT_SECRET
const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
require('dotenv').config({ path: join(__dirname, '..', '..', '.env') });

const SECRET = process.env.JWT_SECRET;

if (!SECRET) {
  console.error('❌ FATAL: JWT_SECRET is not set in .env');
  process.exit(1);
}

export function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '8h' });
}

export function verifyToken(token) {
  return jwt.verify(token, SECRET);
}
