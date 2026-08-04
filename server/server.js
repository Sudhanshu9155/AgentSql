// ─── Load .env FIRST — before any other module reads process.env ─────────────
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require   = createRequire(import.meta.url);
require('dotenv').config({ path: join(__dirname, '..', '.env') });
// ─────────────────────────────────────────────────────────────────────────────

import app from './app.js';

const port = process.env.PORT || 3001;

app.listen(port, () => {
  const atlasHost = (process.env.MONGO_URI || '').split('@')[1]?.split('/')[0] || 'Atlas';
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`📦 Database: MongoDB Atlas (${atlasHost})`);
  console.log(`🔐 Auth: JWT (${process.env.JWT_EXPIRES_IN || '8h'} expiry)`);
});

