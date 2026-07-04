const express = require('express');
const { db } = require('../database/db');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/asyncHandler');

const router = express.Router();

// GET /api/stock/product/:productId
router.get('/product/:productId', authMiddleware, requireRole('merchant'), asyncHandler(async (req, res) => {
  const stock = await db.get(`
    SELECT s.*, p.name as product_name, p.shop_id
    FROM stock s JOIN products p ON p.id = s.product_id
    WHERE s.product_id = ?
  `, [req.params.productId]);

  if (!stock) return res.status(404).json({ error: 'Stock introuvable' });

  const shop = await db.get('SELECT owner_id FROM shops WHERE id = ?', [stock.shop_id]);
  if (!shop || shop.owner_id !== req.user.id) return res.status(403).json({ error: 'Accès refusé' });

  res.json(stock);
}));

// PUT /api/stock/product/:productId
router.put('/product/:productId', authMiddleware, requireRole('merchant'), asyncHandler(async (req, res) => {
  const { quantity, low_stock_threshold } = req.body;

  const product = await db.get('SELECT p.id, sh.owner_id FROM products p JOIN shops sh ON sh.id=p.shop_id WHERE p.id=?', [req.params.productId]);
  if (!product) return res.status(404).json({ error: 'Produit introuvable' });
  if (product.owner_id !== req.user.id) return res.status(403).json({ error: 'Accès refusé' });

  const qty = quantity != null ? parseInt(quantity, 10) : null;
  const threshold = low_stock_threshold != null ? parseInt(low_stock_threshold, 10) : null;
  if ((qty != null && (!Number.isInteger(qty) || qty < 0)) ||
      (threshold != null && (!Number.isInteger(threshold) || threshold < 0))) {
    return res.status(400).json({ error: 'Valeurs de stock invalides' });
  }

  await db.run(`
    UPDATE stock SET
      quantity = COALESCE(?, quantity),
      low_stock_threshold = COALESCE(?, low_stock_threshold),
      updated_at = CURRENT_TIMESTAMP
    WHERE product_id=?
  `, [qty, threshold, req.params.productId]);

  res.json(await db.get('SELECT * FROM stock WHERE product_id = ?', [req.params.productId]));
}));

// POST /api/stock/movement
router.post('/movement', authMiddleware, requireRole('merchant'), asyncHandler(async (req, res) => {
  const { product_id, type, quantity, note } = req.body;
  if (!product_id || !type || !quantity) {
    return res.status(400).json({ error: 'product_id, type et quantity requis' });
  }
  if (!['entry', 'exit'].includes(type)) {
    return res.status(400).json({ error: 'type doit être entry ou exit' });
  }
  const qty = parseInt(quantity);
  if (qty <= 0) return res.status(400).json({ error: 'Quantité doit être positive' });

  const product = await db.get('SELECT p.id, sh.owner_id FROM products p JOIN shops sh ON sh.id=p.shop_id WHERE p.id=?', [product_id]);
  if (!product) return res.status(404).json({ error: 'Produit introuvable' });
  if (product.owner_id !== req.user.id) return res.status(403).json({ error: 'Accès refusé' });

  const stock = await db.get('SELECT * FROM stock WHERE product_id = ?', [product_id]);
  if (!stock) return res.status(404).json({ error: 'Stock non initialisé' });

  if (type === 'exit' && stock.quantity < qty) {
    return res.status(400).json({ error: 'Stock insuffisant' });
  }

  const newQty = type === 'entry' ? stock.quantity + qty : stock.quantity - qty;

  await db.batch([
    { sql: 'INSERT INTO stock_movements (product_id, type, quantity, note) VALUES (?, ?, ?, ?)', args: [product_id, type, qty, note || null] },
    { sql: 'UPDATE stock SET quantity=?, updated_at=CURRENT_TIMESTAMP WHERE product_id=?', args: [newQty, product_id] },
  ]);

  res.json({ message: 'Mouvement enregistré', new_quantity: newQty });
}));

// GET /api/stock/movements/:productId
router.get('/movements/:productId', authMiddleware, requireRole('merchant'), asyncHandler(async (req, res) => {
  const product = await db.get('SELECT p.id, sh.owner_id FROM products p JOIN shops sh ON sh.id=p.shop_id WHERE p.id=?', [req.params.productId]);
  if (!product) return res.status(404).json({ error: 'Produit introuvable' });
  if (product.owner_id !== req.user.id) return res.status(403).json({ error: 'Accès refusé' });

  const movements = await db.all(
    'SELECT * FROM stock_movements WHERE product_id = ? ORDER BY created_at DESC LIMIT 50',
    [req.params.productId]
  );

  res.json(movements);
}));

// GET /api/stock/alerts - products below threshold
router.get('/alerts', authMiddleware, requireRole('merchant'), asyncHandler(async (req, res) => {
  const shop = await db.get('SELECT id FROM shops WHERE owner_id = ?', [req.user.id]);
  if (!shop) return res.status(404).json({ error: 'Boutique introuvable' });

  const alerts = await db.all(`
    SELECT p.id, p.name, p.category, s.quantity, s.low_stock_threshold
    FROM products p
    JOIN stock s ON s.product_id = p.id
    WHERE p.shop_id = ? AND s.quantity <= s.low_stock_threshold
    ORDER BY s.quantity ASC
  `, [shop.id]);

  res.json(alerts);
}));

module.exports = router;
