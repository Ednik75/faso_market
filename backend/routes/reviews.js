const express = require('express');
const { db } = require('../database/db');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/asyncHandler');

const router = express.Router();

// GET /api/reviews/shop/:shopId
router.get('/shop/:shopId', asyncHandler(async (req, res) => {
  const reviews = await db.all(`
    SELECT r.*, u.name as client_name
    FROM reviews r JOIN users u ON u.id = r.client_id
    WHERE r.shop_id = ?
    ORDER BY r.created_at DESC
  `, [req.params.shopId]);
  res.json(reviews);
}));

// POST /api/reviews
router.post('/', authMiddleware, requireRole('client'), asyncHandler(async (req, res) => {
  const { shop_id, rating, comment } = req.body;
  if (!shop_id || !rating) return res.status(400).json({ error: 'shop_id et rating requis' });
  if (rating < 1 || rating > 5) return res.status(400).json({ error: 'La note doit être entre 1 et 5' });

  const shop = await db.get('SELECT id FROM shops WHERE id = ?', [shop_id]);
  if (!shop) return res.status(404).json({ error: 'Boutique introuvable' });

  const existing = await db.get('SELECT id FROM reviews WHERE client_id = ? AND shop_id = ?', [req.user.id, shop_id]);
  if (existing) {
    await db.run('UPDATE reviews SET rating=?, comment=? WHERE id=?', [parseInt(rating), comment || null, existing.id]);
    return res.json(await db.get('SELECT r.*, u.name as client_name FROM reviews r JOIN users u ON u.id=r.client_id WHERE r.id=?', [existing.id]));
  }

  const result = await db.run(
    'INSERT INTO reviews (client_id, shop_id, rating, comment) VALUES (?, ?, ?, ?)',
    [req.user.id, shop_id, parseInt(rating), comment || null]
  );

  const review = await db.get(
    'SELECT r.*, u.name as client_name FROM reviews r JOIN users u ON u.id=r.client_id WHERE r.id=?',
    [result.lastInsertRowid]
  );

  res.status(201).json(review);
}));

// DELETE /api/reviews/:id
router.delete('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const review = await db.get('SELECT * FROM reviews WHERE id = ?', [req.params.id]);
  if (!review) return res.status(404).json({ error: 'Avis introuvable' });

  if (req.user.role !== 'admin' && review.client_id !== req.user.id) {
    return res.status(403).json({ error: 'Accès refusé' });
  }

  await db.run('DELETE FROM reviews WHERE id = ?', [req.params.id]);
  res.json({ message: 'Avis supprimé' });
}));

module.exports = router;
