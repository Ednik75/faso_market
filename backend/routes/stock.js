const express = require('express');
const { getDb } = require('../database/db');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/stock/product/:productId
router.get('/product/:productId', authMiddleware, requireRole('merchant'), (req, res) => {
  const db = getDb();
  const stock = db.prepare(`
    SELECT s.*, p.name as product_name, p.shop_id
    FROM stock s JOIN products p ON p.id = s.product_id
    WHERE s.product_id = ?
  `).get(req.params.productId);

  if (!stock) return res.status(404).json({ error: 'Stock introuvable' });

  const shop = db.prepare('SELECT owner_id FROM shops WHERE id = ?').get(stock.shop_id);
  if (!shop || shop.owner_id !== req.user.id) return res.status(403).json({ error: 'Accès refusé' });

  res.json(stock);
});

// PUT /api/stock/product/:productId
router.put('/product/:productId', authMiddleware, requireRole('merchant'), (req, res) => {
  const { quantity, low_stock_threshold } = req.body;
  const db = getDb();

  const product = db.prepare('SELECT p.id, sh.owner_id FROM products p JOIN shops sh ON sh.id=p.shop_id WHERE p.id=?').get(req.params.productId);
  if (!product) return res.status(404).json({ error: 'Produit introuvable' });
  if (product.owner_id !== req.user.id) return res.status(403).json({ error: 'Accès refusé' });

  const qty = quantity != null ? parseInt(quantity, 10) : null;
  const threshold = low_stock_threshold != null ? parseInt(low_stock_threshold, 10) : null;
  if ((qty != null && (!Number.isInteger(qty) || qty < 0)) ||
      (threshold != null && (!Number.isInteger(threshold) || threshold < 0))) {
    return res.status(400).json({ error: 'Valeurs de stock invalides' });
  }

  db.prepare(`
    UPDATE stock SET
      quantity = COALESCE(?, quantity),
      low_stock_threshold = COALESCE(?, low_stock_threshold),
      updated_at = CURRENT_TIMESTAMP
    WHERE product_id=?
  `).run(qty, threshold, req.params.productId);

  res.json(db.prepare('SELECT * FROM stock WHERE product_id = ?').get(req.params.productId));
});

// POST /api/stock/movement
router.post('/movement', authMiddleware, requireRole('merchant'), (req, res) => {
  const { product_id, type, quantity, note } = req.body;
  if (!product_id || !type || !quantity) {
    return res.status(400).json({ error: 'product_id, type et quantity requis' });
  }
  if (!['entry', 'exit'].includes(type)) {
    return res.status(400).json({ error: 'type doit être entry ou exit' });
  }
  const qty = parseInt(quantity);
  if (qty <= 0) return res.status(400).json({ error: 'Quantité doit être positive' });

  const db = getDb();
  const product = db.prepare('SELECT p.id, sh.owner_id FROM products p JOIN shops sh ON sh.id=p.shop_id WHERE p.id=?').get(product_id);
  if (!product) return res.status(404).json({ error: 'Produit introuvable' });
  if (product.owner_id !== req.user.id) return res.status(403).json({ error: 'Accès refusé' });

  const stock = db.prepare('SELECT * FROM stock WHERE product_id = ?').get(product_id);
  if (!stock) return res.status(404).json({ error: 'Stock non initialisé' });

  if (type === 'exit' && stock.quantity < qty) {
    return res.status(400).json({ error: 'Stock insuffisant' });
  }

  const newQty = type === 'entry' ? stock.quantity + qty : stock.quantity - qty;

  db.prepare('INSERT INTO stock_movements (product_id, type, quantity, note) VALUES (?, ?, ?, ?)').run(product_id, type, qty, note || null);
  db.prepare('UPDATE stock SET quantity=?, updated_at=CURRENT_TIMESTAMP WHERE product_id=?').run(newQty, product_id);

  res.json({ message: 'Mouvement enregistré', new_quantity: newQty });
});

// GET /api/stock/movements/:productId
router.get('/movements/:productId', authMiddleware, requireRole('merchant'), (req, res) => {
  const db = getDb();
  const product = db.prepare('SELECT p.id, sh.owner_id FROM products p JOIN shops sh ON sh.id=p.shop_id WHERE p.id=?').get(req.params.productId);
  if (!product) return res.status(404).json({ error: 'Produit introuvable' });
  if (product.owner_id !== req.user.id) return res.status(403).json({ error: 'Accès refusé' });

  const movements = db.prepare(
    'SELECT * FROM stock_movements WHERE product_id = ? ORDER BY created_at DESC LIMIT 50'
  ).all(req.params.productId);

  res.json(movements);
});

// GET /api/stock/alerts - products below threshold
router.get('/alerts', authMiddleware, requireRole('merchant'), (req, res) => {
  const db = getDb();
  const shop = db.prepare('SELECT id FROM shops WHERE owner_id = ?').get(req.user.id);
  if (!shop) return res.status(404).json({ error: 'Boutique introuvable' });

  const alerts = db.prepare(`
    SELECT p.id, p.name, p.category, s.quantity, s.low_stock_threshold
    FROM products p
    JOIN stock s ON s.product_id = p.id
    WHERE p.shop_id = ? AND s.quantity <= s.low_stock_threshold
    ORDER BY s.quantity ASC
  `).all(shop.id);

  res.json(alerts);
});

module.exports = router;
