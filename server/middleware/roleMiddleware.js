export function requireRole(roles = []) {
  return (req, res, next) => {
    const role = req.user?.role || 'user';
    if (roles.length && !roles.includes(role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
}
