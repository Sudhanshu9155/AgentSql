import express from 'express';
import { createChat, listHistory } from '../controllers/chatController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', requireAuth, createChat);
router.get('/history', requireAuth, listHistory);

export default router;
