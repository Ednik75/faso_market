const jwt = require('jsonwebtoken');
const crypto = require('crypto');

let secret = process.env.JWT_SECRET;
if (!secret || secret.length < 32) {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ FATAL: JWT_SECRET manquant ou trop court (32 caractères minimum) — définissez-le dans .env');
    process.exit(1);
  }
  // En développement uniquement : secret aléatoire par démarrage
  secret = crypto.randomBytes(48).toString('hex');
  console.warn('⚠️  JWT_SECRET absent ou faible : secret temporaire généré (les sessions expireront au redémarrage)');
}
const JWT_SECRET = secret;

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant' });
  }
  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Token invalide ou expiré' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    next();
  };
}

module.exports = { authMiddleware, requireRole, JWT_SECRET };
