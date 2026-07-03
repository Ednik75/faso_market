const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { OAuth2Client } = require('google-auth-library');
const { getDb } = require('../database/db');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');
const { sendPasswordResetEmail } = require('../utils/mailer');

const router = express.Router();

const BCRYPT_ROUNDS = 12;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

// Hash factice pour égaliser le temps de réponse quand l'email n'existe pas
const DUMMY_HASH = bcrypt.hashSync(crypto.randomBytes(16).toString('hex'), BCRYPT_ROUNDS);

function issueToken(user) {
  const payload = { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone || null };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
  return { token, user: payload };
}

function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ error: errors.array()[0].msg });
    return false;
  }
  return true;
}

const passwordRules = body('password')
  .isLength({ min: 8, max: 128 }).withMessage('Le mot de passe doit contenir au moins 8 caractères')
  .matches(/[a-zA-Z]/).withMessage('Le mot de passe doit contenir au moins une lettre')
  .matches(/[0-9]/).withMessage('Le mot de passe doit contenir au moins un chiffre');

/* ── Config publique (pour le frontend) ─────────────────────── */
router.get('/config', (req, res) => {
  res.json({ googleClientId: GOOGLE_CLIENT_ID || null });
});

/* ── Inscription ────────────────────────────────────────────── */
router.post(
  '/register',
  [
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Nom invalide (2 à 100 caractères)').escape(),
    body('email').trim().isEmail().withMessage('Adresse email invalide').normalizeEmail().isLength({ max: 254 }),
    passwordRules,
    body('role').isIn(['client', 'merchant']).withMessage('Rôle invalide'),
    body('phone').optional({ values: 'falsy' }).trim().matches(/^\+?[0-9 ]{8,20}$/).withMessage('Numéro de téléphone invalide'),
  ],
  (req, res) => {
    if (!handleValidation(req, res)) return;
    const { name, email, password, role, phone } = req.body;

    const db = getDb();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ error: 'Cet email est déjà utilisé' });
    }
    const password_hash = bcrypt.hashSync(password, BCRYPT_ROUNDS);
    const result = db.prepare(
      'INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)'
    ).run(name, email, password_hash, role, phone || null);

    const user = db.prepare('SELECT id, name, email, role, phone FROM users WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(issueToken(user));
  }
);

/* ── Connexion ──────────────────────────────────────────────── */
router.post(
  '/login',
  [
    body('email').trim().isEmail().withMessage('Email et mot de passe requis').normalizeEmail(),
    body('password').isString().notEmpty().withMessage('Email et mot de passe requis').isLength({ max: 128 }),
  ],
  (req, res) => {
    if (!handleValidation(req, res)) return;
    const { email, password } = req.body;

    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    // Comparaison systématique pour un temps de réponse constant
    const hashToCheck = user && user.password_hash ? user.password_hash : DUMMY_HASH;
    const valid = bcrypt.compareSync(password, hashToCheck);

    if (!user || !valid) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }
    if (!user.password_hash && user.google_id) {
      return res.status(401).json({ error: 'Ce compte utilise la connexion Google. Cliquez sur « Continuer avec Google ».' });
    }
    res.json(issueToken(user));
  }
);

/* ── Connexion Google ───────────────────────────────────────── */
router.post('/google', async (req, res) => {
  if (!googleClient) {
    return res.status(503).json({ error: 'La connexion Google n\'est pas configurée sur ce serveur' });
  }
  const { credential, role } = req.body;
  if (!credential || typeof credential !== 'string') {
    return res.status(400).json({ error: 'Jeton Google manquant' });
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID });
    payload = ticket.getPayload();
  } catch {
    return res.status(401).json({ error: 'Jeton Google invalide ou expiré' });
  }

  if (!payload?.email || payload.email_verified === false) {
    return res.status(401).json({ error: 'Email Google non vérifié' });
  }

  const db = getDb();
  const email = payload.email.toLowerCase();
  let user = db.prepare('SELECT * FROM users WHERE google_id = ? OR email = ?').get(payload.sub, email);

  if (user) {
    // Lier le compte Google si l'utilisateur existait déjà via email/mot de passe
    if (!user.google_id) {
      db.prepare('UPDATE users SET google_id = ? WHERE id = ?').run(payload.sub, user.id);
    }
  } else {
    const newRole = ['client', 'merchant'].includes(role) ? role : 'client';
    const result = db.prepare(
      'INSERT INTO users (name, email, password_hash, role, phone, google_id) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(payload.name || email.split('@')[0], email, '', newRole, null, payload.sub);
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
  }

  res.json(issueToken(user));
});

/* ── Mot de passe oublié ────────────────────────────────────── */
router.post(
  '/forgot-password',
  [body('email').trim().isEmail().withMessage('Adresse email invalide').normalizeEmail()],
  (req, res) => {
    if (!handleValidation(req, res)) return;
    const { email } = req.body;

    const db = getDb();
    const user = db.prepare('SELECT id, name, email, google_id, password_hash FROM users WHERE email = ?').get(email);

    // Réponse identique que l'email existe ou non (anti-énumération de comptes)
    const genericResponse = { message: 'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.' };

    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      db.prepare('DELETE FROM password_reset_tokens WHERE user_id = ?').run(user.id);
      db.prepare(
        "INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, DATETIME('now', '+1 hour'))"
      ).run(user.id, tokenHash);
      // Envoi asynchrone : ne bloque pas la réponse
      sendPasswordResetEmail(user.email, user.name, token);
    }

    res.json(genericResponse);
  }
);

/* ── Réinitialisation du mot de passe ───────────────────────── */
router.post(
  '/reset-password',
  [
    body('token').isString().isLength({ min: 64, max: 64 }).withMessage('Lien de réinitialisation invalide'),
    passwordRules,
  ],
  (req, res) => {
    if (!handleValidation(req, res)) return;
    const { token, password } = req.body;

    const db = getDb();
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const record = db.prepare(`
      SELECT * FROM password_reset_tokens
      WHERE token_hash = ? AND used_at IS NULL AND expires_at > DATETIME('now')
    `).get(tokenHash);

    if (!record) {
      return res.status(400).json({ error: 'Lien de réinitialisation invalide ou expiré. Refaites une demande.' });
    }

    const password_hash = bcrypt.hashSync(password, BCRYPT_ROUNDS);
    db.transaction(() => {
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(password_hash, record.user_id);
      db.prepare("UPDATE password_reset_tokens SET used_at = DATETIME('now') WHERE id = ?").run(record.id);
    })();

    res.json({ message: 'Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter.' });
  }
);

/* ── Profil courant ─────────────────────────────────────────── */
router.get('/me', authMiddleware, (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT id, name, email, role, phone, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
  res.json(user);
});

module.exports = router;
