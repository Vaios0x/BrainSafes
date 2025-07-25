const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    res.status(401).json({ error: 'Token inválido' });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user?.roles?.includes(role)) {
      return res.status(403).json({ error: 'No autorizado' });
    }
    next();
  };
}

module.exports = { auth, requireRole }; 