const express = require('express');
const { db } = require('../database/db');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/asyncHandler');

const router = express.Router();

router.use(authMiddleware, requireRole('admin'));

// GET /api/admin/shops
router.get('/shops', asyncHandler(async (req, res) => {
  const { status } = req.query;
  let sql = `
    SELECT s.*, u.name as owner_name, u.email as owner_email, u.phone as owner_phone,
      COUNT(DISTINCT p.id) as product_count
    FROM shops s
    JOIN users u ON u.id = s.owner_id
    LEFT JOIN products p ON p.shop_id = s.id
  `;
  const params = [];
  if (status) { sql += ` WHERE s.status = ?`; params.push(status); }
  sql += ` GROUP BY s.id ORDER BY s.created_at DESC`;
  res.json(await db.all(sql, params));
}));

// PUT /api/admin/shops/:id/validate
router.put('/shops/:id/validate', asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['active', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Statut invalide (active ou rejected)' });
  }
  const shop = await db.get('SELECT id FROM shops WHERE id = ?', [req.params.id]);
  if (!shop) return res.status(404).json({ error: 'Boutique introuvable' });
  await db.run('UPDATE shops SET status = ? WHERE id = ?', [status, req.params.id]);
  res.json(await db.get('SELECT * FROM shops WHERE id = ?', [req.params.id]));
}));

// GET /api/admin/users
router.get('/users', asyncHandler(async (req, res) => {
  const users = await db.all('SELECT id, name, email, role, phone, created_at FROM users ORDER BY created_at DESC');
  res.json(users);
}));

// DELETE /api/admin/users/:id
router.delete('/users/:id', asyncHandler(async (req, res) => {
  const user = await db.get('SELECT * FROM users WHERE id = ?', [req.params.id]);
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
  if (user.role === 'admin') return res.status(400).json({ error: 'Impossible de supprimer un admin' });

  await db.transaction(async (tx) => {
    const uid = req.params.id;

    // Boutiques du marchand
    const shops = await tx.all('SELECT id FROM shops WHERE owner_id = ?', [uid]);
    const shopIds = shops.map(s => s.id);

    if (shopIds.length > 0) {
      const ph = shopIds.map(() => '?').join(',');
      // Commandes liées aux boutiques → payments + order_items (cascade) + orders
      const shopOrders = await tx.all(`SELECT id FROM orders WHERE shop_id IN (${ph})`, shopIds);
      const shopOrderIds = shopOrders.map(o => o.id);
      if (shopOrderIds.length > 0) {
        const oph = shopOrderIds.map(() => '?').join(',');
        await tx.run(`DELETE FROM payments WHERE order_id IN (${oph})`, shopOrderIds);
        await tx.run(`DELETE FROM orders WHERE id IN (${oph})`, shopOrderIds);
      }
      await tx.run(`DELETE FROM reviews WHERE shop_id IN (${ph})`, shopIds);
      // Supprimer les boutiques (cascade → products, stock, stock_movements)
      await tx.run(`DELETE FROM shops WHERE id IN (${ph})`, shopIds);
    }

    // Commandes passées par le client
    const clientOrders = await tx.all('SELECT id FROM orders WHERE client_id = ?', [uid]);
    const clientOrderIds = clientOrders.map(o => o.id);
    if (clientOrderIds.length > 0) {
      const oph = clientOrderIds.map(() => '?').join(',');
      await tx.run(`DELETE FROM payments WHERE order_id IN (${oph})`, clientOrderIds);
      await tx.run(`DELETE FROM orders WHERE id IN (${oph})`, clientOrderIds);
    }

    await tx.run('DELETE FROM reviews WHERE client_id = ?', [uid]);
    await tx.run('DELETE FROM users WHERE id = ?', [uid]);
  });

  res.json({ message: 'Utilisateur supprimé' });
}));

// GET /api/admin/stats
router.get('/stats', asyncHandler(async (req, res) => {
  const users = await db.get('SELECT COUNT(*) as count FROM users');
  const merchants = await db.get("SELECT COUNT(*) as count FROM users WHERE role='merchant'");
  const clients = await db.get("SELECT COUNT(*) as count FROM users WHERE role='client'");
  const shops = await db.get("SELECT COUNT(*) as count FROM shops WHERE status='active'");
  const pendingShops = await db.get("SELECT COUNT(*) as count FROM shops WHERE status='pending'");
  const orders = await db.get('SELECT COUNT(*) as count, COALESCE(SUM(total_amount),0) as revenue FROM orders');
  const products = await db.get('SELECT COUNT(*) as count FROM products');

  res.json({
    total_users: users.count,
    merchants: merchants.count,
    clients: clients.count,
    active_shops: shops.count,
    pending_shops: pendingShops.count,
    total_orders: orders.count,
    total_revenue: orders.revenue,
    total_products: products.count,
  });
}));

module.exports = router;
