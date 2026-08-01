/**
 * One-time cleanup script.
 * Deletes all Chat and Connection documents that have no userId field.
 * Run once: node scripts/cleanOrphanedData.js
 */
import mongoose from 'mongoose';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
require('dotenv').config({ path: join(__dirname, '..', '..', '.env') });

await mongoose.connect(process.env.MONGO_URI);
console.log('✅ Connected to MongoDB');

const chatResult = await mongoose.connection.collection('chats').deleteMany({ userId: { $exists: false } });
console.log(`🗑️  Deleted ${chatResult.deletedCount} orphaned chat record(s)`);

const connResult = await mongoose.connection.collection('connections').deleteMany({ userId: { $exists: false } });
console.log(`🗑️  Deleted ${connResult.deletedCount} orphaned connection record(s)`);

await mongoose.disconnect();
console.log('✅ Done. Database is clean.');
