const express = require('express');
const { db } = require('../database/db');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/asyncHandler');

const router = express.Router();

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// GET /api/shops - list active shops
router.get('/', asyncHandler(async (req, res) => {
  const { search, category, lat, lng, radius } = req.query;

  let sql = `
    SELECT s.*, u.name as owner_name,
      COALESCE(AVG(r.rating), 0) as avg_rating,
      COUNT(DISTINCT r.id) as review_count,
      COUNT(DISTINCT p.id) as product_count
    FROM shops s
    JOIN users u ON s.owner_id = u.id
    LEFT JOIN reviews r ON r.shop_id = s.id
    LEFT JOIN products p ON p.shop_id = s.id
    WHERE s.status = 'active'
  `;
  const params = [];

  if (search) {
    sql += ` AND (s.name LIKE ? OR s.description LIKE ? OR s.category LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (category) {
    sql += ` AND s.category = ?`;
    params.push(category);
  }

  sql += ` GROUP BY s.id ORDER BY s.created_at DESC`;

  let shops = await db.all(sql, params);

  if (lat && lng && radius) {
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const maxRadius = parseFloat(radius) || 10;
    shops = shops
      .map((s) => ({ ...s, distance: haversine(userLat, userLng, s.latitude, s.longitude) }))
      .filter((s) => s.distance <= maxRadius)
      .sort((a, b) => a.distance - b.distance);
  }

  res.json(shops);
}));

// GET /api/shops/merchant/mine - merchant's own shop
router.get('/merchant/mine', authMiddleware, requireRole('merchant'), asyncHandler(async (req, res) => {
  const shop = await db.get('SELECT * FROM shops WHERE owner_id = ? ORDER BY id DESC LIMIT 1', [req.user.id]);
  if (!shop) return res.status(404).json({ error: 'Aucune boutique trouvée' });
  res.json(shop);
}));

// GET /api/shops/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const shop = await db.get(`
    SELECT s.*, u.name as owner_name,
      COALESCE(AVG(r.rating), 0) as avg_rating,
      COUNT(DISTINCT r.id) as review_count
    FROM shops s
    JOIN users u ON s.owner_id = u.id
    LEFT JOIN reviews r ON r.shop_id = s.id
    WHERE s.id = ?
    GROUP BY s.id
  `, [req.params.id]);

  if (!shop) return res.status(404).json({ error: 'Boutique introuvable' });

  const products = await db.all(`
    SELECT p.*, s.quantity, s.low_stock_threshold
    FROM products p
    LEFT JOIN stock s ON s.product_id = p.id
    WHERE p.shop_id = ? AND p.is_available = 1
    ORDER BY p.created_at DESC
  `, [req.params.id]);

  res.json({ ...shop, products });
}));

// POST /api/shops - create shop (merchant)
router.post('/', authMiddleware, requireRole('merchant'), asyncHandler(async (req, res) => {
  const { name, description, address, latitude, longitude, category } = req.body;
  if (!name || String(name).length > 200) return res.status(400).json({ error: 'Le nom de la boutique est requis (200 caractères max)' });
  if ((latitude != null && (isNaN(latitude) || latitude < -90 || latitude > 90)) ||
      (longitude != null && (isNaN(longitude) || longitude < -180 || longitude > 180))) {
    return res.status(400).json({ error: 'Coordonnées GPS invalides' });
  }

  const existing = await db.get('SELECT id FROM shops WHERE owner_id = ?', [req.user.id]);
  if (existing) return res.status(409).json({ error: 'Vous avez déjà une boutique' });

  const result = await db.run(
    'INSERT INTO shops (owner_id, name, description, address, latitude, longitude, category) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [req.user.id, name, description || null, address || null,
      latitude || 12.3647, longitude || -1.5337, category || 'Général']
  );

  res.status(201).json(await db.get('SELECT * FROM shops WHERE id = ?', [result.lastInsertRowid]));
}));

// PUT /api/shops/:id - update shop (owner)
router.put('/:id', authMiddleware, requireRole('merchant', 'admin'), asyncHandler(async (req, res) => {
  const shop = await db.get('SELECT * FROM shops WHERE id = ?', [req.params.id]);
  if (!shop) return res.status(404).json({ error: 'Boutique introuvable' });
  if (req.user.role !== 'admin' && shop.owner_id !== req.user.id) {
    return res.status(403).json({ error: 'Accès refusé' });
  }

  const { name, description, address, latitude, longitude, category } = req.body;
  await db.run(`
    UPDATE shops SET name=?, description=?, address=?, latitude=?, longitude=?, category=?
    WHERE id=?
  `, [
    name || shop.name,
    description ?? shop.description,
    address ?? shop.address,
    latitude ?? shop.latitude,
    longitude ?? shop.longitude,
    category || shop.category,
    req.params.id,
  ]);

  res.json(await db.get('SELECT * FROM shops WHERE id = ?', [req.params.id]));
}));

// GET /api/shops/categories/list
router.get('/categories/list', asyncHandler(async (req, res) => {
  const cats = await db.all("SELECT DISTINCT category FROM shops WHERE status='active' ORDER BY category");
  res.json(cats.map((c) => c.category));
}));

module.exports = router;
