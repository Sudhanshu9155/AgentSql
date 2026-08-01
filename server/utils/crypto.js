/**
 * crypto.js — AES-256-GCM field-level encryption helpers
 *
 * Encrypted format stored in MongoDB:
 *   "<iv_hex>:<authTag_hex>:<ciphertext_hex>"
 *
 * - IV  : 12 random bytes (96-bit) — unique per encryption call
 * - Tag : 16-byte GCM authentication tag (integrity check)
 * - Key : 32-byte key read from ENCRYPTION_KEY env var
 *
 * Usage:
 *   import { encrypt, decrypt, isEncrypted } from '../utils/crypto.js';
 *   const stored  = encrypt('my-secret-password');
 *   const plain   = decrypt(stored);
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LEN    = 12;  // 96-bit IV — recommended for GCM
const TAG_LEN   = 16;  // 128-bit auth tag

// ── Key loading ────────────────────────────────────────────────────────────
function getKey() {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error(
      'ENCRYPTION_KEY must be set to exactly 64 hex characters (32 bytes). ' +
      'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }
  return Buffer.from(hex, 'hex');
}

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Returns true if the string looks like an encrypted value
 * (iv:tag:ciphertext, all hex segments).
 */
export function isEncrypted(value) {
  if (typeof value !== 'string') return false;
  const parts = value.split(':');
  return parts.length === 3 && parts.every(p => /^[0-9a-f]+$/i.test(p));
}

/**
 * Encrypt a plain-text string.
 * Returns a "<iv_hex>:<authTag_hex>:<ciphertext_hex>" string.
 * Returns '' if value is empty/null.
 */
export function encrypt(plaintext) {
  if (!plaintext) return '';

  const key    = getKey();
  const iv     = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LEN });

  const encrypted = Buffer.concat([
    cipher.update(String(plaintext), 'utf8'),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypt a value produced by encrypt().
 * Returns the original plain-text string.
 * Returns '' if value is empty/null.
 * Throws if the value is tampered with (auth tag mismatch).
 */
export function decrypt(ciphertext) {
  if (!ciphertext) return '';
  if (!isEncrypted(ciphertext)) return ciphertext; // already plain (legacy record)

  const [ivHex, tagHex, dataHex] = ciphertext.split(':');
  const key      = getKey();
  const iv       = Buffer.from(ivHex,  'hex');
  const tag      = Buffer.from(tagHex, 'hex');
  const data     = Buffer.from(dataHex,'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LEN });
  decipher.setAuthTag(tag);

  try {
    const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
    return decrypted.toString('utf8');
  } catch {
    throw new Error('Decryption failed — data may be corrupted or the key has changed.');
  }
}
