require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const { initDb } = require('./database/db');

const app = express();
const PORT = process.env.PORT || 5000;

/* ── Sécurité ───────────────────────────────────────────────── */
app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // autorise l'affichage des images /uploads depuis le frontend
  // CSP désactivée : le frontend servi par l'API charge Google Fonts, Google Sign-In, OpenStreetMap…
  contentSecurityPolicy: false,
}));

// CORS : origines autorisées uniquement (+ URL publique fournie par l'hébergeur, ex: Render)
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:3000,http://localhost:4173')
  .split(',').map((o) => o.trim());
if (process.env.RENDER_EXTERNAL_URL) allowedOrigins.push(process.env.RENDER_EXTERNAL_URL.replace(/\/$/, ''));
if (process.env.PUBLIC_URL) allowedOrigins.push(process.env.PUBLIC_URL.replace(/\/$/, ''));
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('Origine non autorisée par CORS'));
  },
  credentials: true,
}));

// Limite globale : 300 requêtes / 15 min / IP
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requêtes, réessayez dans quelques minutes' },
}));

// Limite stricte sur l'authentification : 20 tentatives / 15 min / IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { error: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/auth/reset-password', authLimiter);

// Taille maximale des payloads JSON
app.use(express.json({ limit: '100kb' }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* ── Routes ─────────────────────────────────────────────────── */
app.use('/api/auth', require('./routes/auth'));
app.use('/api/shops', require('./routes/shops'));
app.use('/api/products', require('./routes/products'));
app.use('/api/stock', require('./routes/stock'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/upload', require('./routes/upload'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', app: 'Market BF API', version: '1.1.0' }));

// Frontend de production : si un build est présent dans public/, l'API le sert
// (déploiement "tout-en-un" : une seule URL pour le site et l'API)
const publicDir = path.join(__dirname, 'public');
if (fs.existsSync(path.join(publicDir, 'index.html'))) {
  app.use(express.static(publicDir, { maxAge: '1d', index: 'index.html' }));
  // Toute route non-API renvoie l'app React (React Router gère le reste)
  app.get(/^\/(?!api\/|uploads\/).*/, (req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
  });
}

// 404
app.use((req, res) => res.status(404).json({ error: 'Route non trouvée' }));

// Error handler — ne divulgue jamais les détails internes
app.use((err, req, res, next) => {
  if (err.message === 'Origine non autorisée par CORS') {
    return res.status(403).json({ error: 'Origine non autorisée' });
  }
  console.error(err.stack);
  res.status(500).json({ error: 'Erreur interne du serveur' });
});

// Init DB (Turso si TURSO_DATABASE_URL est défini, sinon fichier local) puis démarrage
initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`\n🚀 Market BF API démarrée sur http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health\n`);
    });
  })
  .catch((err) => {
    console.error('❌ Impossible d\'initialiser la base de données :', err.message);
    process.exit(1);
  });
