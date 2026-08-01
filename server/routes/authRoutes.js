import express from 'express';
import { login, register, getMe, updateProfile, changePassword } from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/login', login);
router.post('/register', register);

// Protected routes
router.get('/me', requireAuth, getMe);
router.put('/me/profile',  requireAuth, updateProfile);
router.put('/me/password', requireAuth, changePassword);

export default router;
