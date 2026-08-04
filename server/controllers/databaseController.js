import { Connection } from '../models/Connection.js';
import { encrypt, decrypt } from '../utils/crypto.js';

// ── Sensitive fields that are encrypted at rest ────────────────────────────
const ENCRYPTED_FIELDS = ['host', 'user', 'password', 'database'];

/**
 * Encrypt all sensitive fields before writing to MongoDB.
 */
function encryptConn(plain) {
  const out = { ...plain };
  for (const field of ENCRYPTED_FIELDS) {
    if (out[field] !== undefined) out[field] = encrypt(String(out[field] ?? ''));
  }
  return out;
}

/**
 * Decrypt all sensitive fields after reading from MongoDB.
 */
function decryptConn(doc) {
  const out = { ...doc };
  for (const field of ENCRYPTED_FIELDS) {
    if (out[field] !== undefined) out[field] = decrypt(out[field]);
  }
  return out;
}

/**
 * Build a safe API response object:
 *  - Decrypts fields so the server can USE them internally.
 *  - Replaces the password with '••••••••' before sending to the frontend.
 *  - Keeps host/user/database readable (so the UI can show "user@host/db").
 */
function safeResponse(doc) {
  const decrypted = decryptConn(doc);
  return {
    ...decrypted,
    password: '••••••••',   // NEVER send the real password to the frontend
  };
}

// ── Controllers ────────────────────────────────────────────────────────────

export async function listDatabases(req, res) {
  try {
    const databases = await Connection.find({ userId: req.user.id }).sort({ createdAt: -1 });
    const mapped = databases.map(db => {
      try {
        return {
          ...safeResponse(db.toObject()),
          id: db._id,
          created_at: db.createdAt,
        };
      } catch (err) {
        // If decryption fails (e.g. key changed), return a masked record so it can be deleted
        return {
          ...db.toObject(),
          password: 'ERROR: DECRYPTION_FAILED',
          host: 'ERROR: DECRYPTION_FAILED',
          user: 'ERROR: DECRYPTION_FAILED',
          id: db._id,
          created_at: db.createdAt,
        };
      }
    });
    res.json(mapped);
  } catch (error) {
    console.error('listDatabases error:', error);
    res.status(500).json({ message: error.message || 'Failed to list databases' });
  }
}

export async function createDatabase(req, res) {
  const { name, host, port, user, password, database } = req.body;
  if (!host || !database) {
    return res.status(400).json({ message: 'host and database are required' });
  }

  try {
    const plain = {
      name:     name || database,
      host,
      port:     Number(port) || 3306,
      user:     user     || '',
      password: password || '',
      database,
    };

    // Encrypt sensitive fields before persisting
    const encryptedPayload = encryptConn(plain);

    const newConnection = await Connection.create({
      userId: req.user.id,
      ...encryptedPayload,
    });

    // Return a safe (masked) version to the frontend
    const entry = {
      ...safeResponse(newConnection.toObject()),
      id: newConnection._id,
      created_at: newConnection.createdAt,
    };

    res.status(201).json({ message: 'Connection profile saved securely', connection: entry });
  } catch (error) {
    console.error('createDatabase error:', error);
    res.status(500).json({ message: 'Failed to save connection profile' });
  }
}

export async function deleteDatabase(req, res) {
  const { id } = req.params;
  try {
    const result = await Connection.findOneAndDelete({ _id: id, userId: req.user.id });
    if (!result) return res.status(404).json({ message: 'Connection not found' });
    res.json({ message: 'Connection deleted' });
  } catch (error) {
    console.error('deleteDatabase error:', error);
    res.status(500).json({ message: 'Failed to delete connection' });
  }
}

export async function testConnection(req, res) {
  // The test payload comes from the frontend — the password is already masked '••••••••'
  // so we must fetch the real credentials from the DB first.
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ connected: false, message: 'Connection id is required for testing' });
  }

  try {
    const conn = await Connection.findOne({ _id: id, userId: req.user.id });
    if (!conn) return res.status(404).json({ connected: false, message: 'Connection not found' });

    // Decrypt to get real credentials for the test
    const plain = decryptConn(conn.toObject());

    const agentBase = (process.env.AGENT_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
    const response = await fetch(`${agentBase}/schema`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        connection: {
          host:     plain.host,
          port:     plain.port || 3306,
          user:     plain.user,
          password: plain.password,
          database: plain.database,
        },
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return res.json({ connected: true, message: `Connected! Found ${data.table_count} tables.` });
    }
    const err = await response.json().catch(() => ({}));
    return res.status(400).json({ connected: false, message: err.detail || 'Connection failed' });
  } catch (error) {
    console.error('testConnection error:', error);
    return res.status(400).json({ connected: false, message: 'Cannot reach agent service to test connection' });
  }
}

export async function refreshSchema(req, res) {
  // Same as test — fetch real credentials from DB, never trust the frontend password
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ message: 'Connection id is required', schema: [] });
  }

  try {
    const conn = await Connection.findOne({ _id: id, userId: req.user.id });
    if (!conn) return res.status(404).json({ message: 'Connection not found', schema: [] });

    const plain = decryptConn(conn.toObject());

    const agentBase = (process.env.AGENT_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
    const response = await fetch(`${agentBase}/schema`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connection: plain }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(400).json({ message: err.detail || 'Schema refresh failed', schema: [] });
    }

    const data = await response.json();
    const schema = Object.keys(data.schema || {}).map(name => ({ name, columns: data.schema[name] }));
    return res.json({ message: 'Schema refreshed', schema });
  } catch (error) {
    console.error('refreshSchema error:', error);
    return res.status(400).json({ message: 'Cannot reach agent service', schema: [] });
  }
}
