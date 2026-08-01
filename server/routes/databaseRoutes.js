import express from 'express';
import { createDatabase, listDatabases, refreshSchema, testConnection, deleteDatabase } from '../controllers/databaseController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', requireAuth, listDatabases);
router.post('/', requireAuth, createDatabase);
router.post('/test', requireAuth, testConnection);
router.post('/refresh-schema', requireAuth, refreshSchema);
router.delete('/:id', requireAuth, deleteDatabase);

export default router;
