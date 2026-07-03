const express = require('express');
const { getDb } = require('../database/db');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/reviews/shop/:shopId
router.get('/shop/:shopId', (req, res) => {
  const db = getDb();
  const reviews = db.prepare(`
    SELECT r.*, u.name as client_name
    FROM reviews r JOIN users u ON u.id = r.client_id
    WHERE r.shop_id = ?
    ORDER BY r.created_at DESC
  `).all(req.params.shopId);
  res.json(reviews);
});

// POST /api/reviews
router.post('/', authMiddleware, requireRole('client'), (req, res) => {
  const { shop_id, rating, comment } = req.body;
  if (!shop_id || !rating) return res.status(400).json({ error: 'shop_id et rating requis' });
  if (rating < 1 || rating > 5) return res.status(400).json({ error: 'La note doit être entre 1 et 5' });

  const db = getDb();
  const shop = db.prepare('SELECT id FROM shops WHERE id = ?').get(shop_id);
  if (!shop) return res.status(404).json({ error: 'Boutique introuvable' });

  const hasOrdered = db.prepare(
    "SELECT id FROM orders WHERE client_id = ? AND shop_id = ? AND status = 'delivered' LIMIT 1"
  ).get(req.user.id, shop_id);

  const existing = db.prepare('SELECT id FROM reviews WHERE client_id = ? AND shop_id = ?').get(req.user.id, shop_id);
  if (existing) {
    db.prepare('UPDATE reviews SET rating=?, comment=? WHERE id=?').run(parseInt(rating), comment || null, existing.id);
    return res.json(db.prepare('SELECT r.*, u.name as client_name FROM reviews r JOIN users u ON u.id=r.client_id WHERE r.id=?').get(existing.id));
  }

  const result = db.prepare(
    'INSERT INTO reviews (client_id, shop_id, rating, comment) VALUES (?, ?, ?, ?)'
  ).run(req.user.id, shop_id, parseInt(rating), comment || null);

  const review = db.prepare(
    'SELECT r.*, u.name as client_name FROM reviews r JOIN users u ON u.id=r.client_id WHERE r.id=?'
  ).get(result.lastInsertRowid);

  res.status(201).json(review);
});

// DELETE /api/reviews/:id
router.delete('/:id', authMiddleware, (req, res) => {
  const db = getDb();
  const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(req.params.id);
  if (!review) return res.status(404).json({ error: 'Avis introuvable' });

  if (req.user.role !== 'admin' && review.client_id !== req.user.id) {
    return res.status(403).json({ error: 'Accès refusé' });
  }

  db.prepare('DELETE FROM reviews WHERE id = ?').run(req.params.id);
  res.json({ message: 'Avis supprimé' });
});

module.exports = router;
