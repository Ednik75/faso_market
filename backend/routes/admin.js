const express = require('express');
const { getDb } = require('../database/db');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware, requireRole('admin'));

// GET /api/admin/shops
router.get('/shops', (req, res) => {
  const db = getDb();
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
  res.json(db.prepare(sql).all(...params));
});

// PUT /api/admin/shops/:id/validate
router.put('/shops/:id/validate', (req, res) => {
  const { status } = req.body;
  if (!['active', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Statut invalide (active ou rejected)' });
  }
  const db = getDb();
  const shop = db.prepare('SELECT id FROM shops WHERE id = ?').get(req.params.id);
  if (!shop) return res.status(404).json({ error: 'Boutique introuvable' });
  db.prepare('UPDATE shops SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json(db.prepare('SELECT * FROM shops WHERE id = ?').get(req.params.id));
});

// GET /api/admin/users
router.get('/users', (req, res) => {
  const db = getDb();
  const users = db.prepare('SELECT id, name, email, role, phone, created_at FROM users ORDER BY created_at DESC').all();
  res.json(users);
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
  if (user.role === 'admin') return res.status(400).json({ error: 'Impossible de supprimer un admin' });

  db.transaction(() => {
    const uid = req.params.id;

    // Boutiques du marchand
    const shops = db.prepare('SELECT id FROM shops WHERE owner_id = ?').all(uid);
    const shopIds = shops.map(s => s.id);

    if (shopIds.length > 0) {
      const ph = shopIds.map(() => '?').join(',');
      // Commandes liées aux boutiques → payments + order_items (cascade) + orders
      const shopOrders = db.prepare(`SELECT id FROM orders WHERE shop_id IN (${ph})`).all(...shopIds);
      const shopOrderIds = shopOrders.map(o => o.id);
      if (shopOrderIds.length > 0) {
        const oph = shopOrderIds.map(() => '?').join(',');
        db.prepare(`DELETE FROM payments WHERE order_id IN (${oph})`).run(...shopOrderIds);
        db.prepare(`DELETE FROM orders WHERE id IN (${oph})`).run(...shopOrderIds);
      }
      db.prepare(`DELETE FROM reviews WHERE shop_id IN (${ph})`).run(...shopIds);
      // Supprimer les boutiques (cascade → products, stock, stock_movements)
      db.prepare(`DELETE FROM shops WHERE id IN (${ph})`).run(...shopIds);
    }

    // Commandes passées par le client
    const clientOrders = db.prepare('SELECT id FROM orders WHERE client_id = ?').all(uid);
    const clientOrderIds = clientOrders.map(o => o.id);
    if (clientOrderIds.length > 0) {
      const oph = clientOrderIds.map(() => '?').join(',');
      db.prepare(`DELETE FROM payments WHERE order_id IN (${oph})`).run(...clientOrderIds);
      db.prepare(`DELETE FROM orders WHERE id IN (${oph})`).run(...clientOrderIds);
    }

    db.prepare('DELETE FROM reviews WHERE client_id = ?').run(uid);
    db.prepare('DELETE FROM users WHERE id = ?').run(uid);
  })();

  res.json({ message: 'Utilisateur supprimé' });
});

// GET /api/admin/stats
router.get('/stats', (req, res) => {
  const db = getDb();
  const users = db.prepare('SELECT COUNT(*) as count FROM users').get();
  const merchants = db.prepare("SELECT COUNT(*) as count FROM users WHERE role='merchant'").get();
  const clients = db.prepare("SELECT COUNT(*) as count FROM users WHERE role='client'").get();
  const shops = db.prepare("SELECT COUNT(*) as count FROM shops WHERE status='active'").get();
  const pendingShops = db.prepare("SELECT COUNT(*) as count FROM shops WHERE status='pending'").get();
  const orders = db.prepare('SELECT COUNT(*) as count, COALESCE(SUM(total_amount),0) as revenue FROM orders').get();
  const products = db.prepare('SELECT COUNT(*) as count FROM products').get();

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
});

module.exports = router;
