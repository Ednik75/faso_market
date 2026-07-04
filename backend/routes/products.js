const express = require('express');
const { db } = require('../database/db');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/asyncHandler');

const router = express.Router();

// GET /api/products - search products
router.get('/', asyncHandler(async (req, res) => {
  const { search, category, shop_id, min_price, max_price } = req.query;

  let sql = `
    SELECT p.*, s.quantity as stock_quantity, s.low_stock_threshold,
      sh.name as shop_name, sh.id as shop_id, sh.address as shop_address,
      sh.latitude, sh.longitude, sh.status as shop_status
    FROM products p
    JOIN shops sh ON sh.id = p.shop_id
    LEFT JOIN stock s ON s.product_id = p.id
    WHERE p.is_available = 1 AND sh.status = 'active'
  `;
  const params = [];

  if (search) {
    sql += ` AND (p.name LIKE ? OR p.description LIKE ? OR p.category LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (category) { sql += ` AND p.category = ?`; params.push(category); }
  if (shop_id) { sql += ` AND p.shop_id = ?`; params.push(shop_id); }
  if (min_price) { sql += ` AND p.price >= ?`; params.push(parseFloat(min_price)); }
  if (max_price) { sql += ` AND p.price <= ?`; params.push(parseFloat(max_price)); }

  sql += ` ORDER BY p.created_at DESC`;

  res.json(await db.all(sql, params));
}));

// GET /api/products/merchant/mine - all products of merchant's shop
router.get('/merchant/mine', authMiddleware, requireRole('merchant'), asyncHandler(async (req, res) => {
  const shop = await db.get('SELECT id FROM shops WHERE owner_id = ?', [req.user.id]);
  if (!shop) return res.status(404).json({ error: 'Boutique introuvable' });

  const products = await db.all(`
    SELECT p.*, s.quantity as stock_quantity, s.low_stock_threshold
    FROM products p
    LEFT JOIN stock s ON s.product_id = p.id
    WHERE p.shop_id = ?
    ORDER BY p.created_at DESC
  `, [shop.id]);

  res.json(products);
}));

// GET /api/products/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const product = await db.get(`
    SELECT p.*, s.quantity as stock_quantity, s.low_stock_threshold,
      sh.name as shop_name, sh.id as shop_id, sh.address as shop_address
    FROM products p
    JOIN shops sh ON sh.id = p.shop_id
    LEFT JOIN stock s ON s.product_id = p.id
    WHERE p.id = ?
  `, [req.params.id]);

  if (!product) return res.status(404).json({ error: 'Produit introuvable' });
  res.json(product);
}));

// POST /api/products - create product (merchant)
router.post('/', authMiddleware, requireRole('merchant'), asyncHandler(async (req, res) => {
  const { name, description, price, category, image_url } = req.body;
  if (!name || price == null) return res.status(400).json({ error: 'Nom et prix requis' });
  const priceNum = parseFloat(price);
  if (!Number.isFinite(priceNum) || priceNum < 0 || priceNum > 100000000) {
    return res.status(400).json({ error: 'Prix invalide' });
  }
  if (String(name).length > 200) return res.status(400).json({ error: 'Nom trop long' });

  const shop = await db.get('SELECT id FROM shops WHERE owner_id = ?', [req.user.id]);
  if (!shop) return res.status(400).json({ error: 'Créez une boutique avant d\'ajouter des produits' });

  const result = await db.run(
    'INSERT INTO products (shop_id, name, description, price, category, image_url) VALUES (?, ?, ?, ?, ?, ?)',
    [shop.id, name, description || null, priceNum, category || 'Général', image_url || null]
  );

  await db.run('INSERT INTO stock (product_id, quantity, low_stock_threshold) VALUES (?, 0, 5)', [result.lastInsertRowid]);

  const product = await db.get(`
    SELECT p.*, s.quantity as stock_quantity, s.low_stock_threshold
    FROM products p LEFT JOIN stock s ON s.product_id = p.id WHERE p.id = ?
  `, [result.lastInsertRowid]);

  res.status(201).json(product);
}));

// PUT /api/products/:id
router.put('/:id', authMiddleware, requireRole('merchant'), asyncHandler(async (req, res) => {
  const product = await db.get('SELECT p.*, sh.owner_id FROM products p JOIN shops sh ON sh.id=p.shop_id WHERE p.id=?', [req.params.id]);
  if (!product) return res.status(404).json({ error: 'Produit introuvable' });
  if (product.owner_id !== req.user.id) return res.status(403).json({ error: 'Accès refusé' });

  const { name, description, price, category, image_url, is_available } = req.body;
  if (price != null) {
    const p = parseFloat(price);
    if (!Number.isFinite(p) || p < 0 || p > 100000000) {
      return res.status(400).json({ error: 'Prix invalide' });
    }
  }
  await db.run(`
    UPDATE products SET name=?, description=?, price=?, category=?, image_url=?, is_available=? WHERE id=?
  `, [
    name ?? product.name,
    description ?? product.description,
    price != null ? parseFloat(price) : product.price,
    category ?? product.category,
    image_url ?? product.image_url,
    is_available != null ? (is_available ? 1 : 0) : product.is_available,
    req.params.id,
  ]);

  const updated = await db.get(`
    SELECT p.*, s.quantity as stock_quantity, s.low_stock_threshold
    FROM products p LEFT JOIN stock s ON s.product_id = p.id WHERE p.id = ?
  `, [req.params.id]);

  res.json(updated);
}));

// DELETE /api/products/:id
router.delete('/:id', authMiddleware, requireRole('merchant'), asyncHandler(async (req, res) => {
  const product = await db.get('SELECT p.*, sh.owner_id FROM products p JOIN shops sh ON sh.id=p.shop_id WHERE p.id=?', [req.params.id]);
  if (!product) return res.status(404).json({ error: 'Produit introuvable' });
  if (product.owner_id !== req.user.id) return res.status(403).json({ error: 'Accès refusé' });

  await db.run('DELETE FROM products WHERE id = ?', [req.params.id]);
  res.json({ message: 'Produit supprimé' });
}));

// GET /api/products/categories/list
router.get('/categories/list', asyncHandler(async (req, res) => {
  const cats = await db.all('SELECT DISTINCT category FROM products ORDER BY category');
  res.json(cats.map((c) => c.category));
}));

module.exports = router;
