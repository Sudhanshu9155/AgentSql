import { verifyToken } from '../auth/jwt.js';

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const token = authHeader.split(' ')[1];
    req.user = verifyToken(token);
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}
