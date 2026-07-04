const express = require('express');
const { db } = require('../database/db');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/asyncHandler');

const router = express.Router();

// GET /api/stats/overview
router.get('/overview', authMiddleware, requireRole('merchant'), asyncHandler(async (req, res) => {
  const shop = await db.get('SELECT id FROM shops WHERE owner_id = ?', [req.user.id]);
  if (!shop) return res.json({ total_orders: 0, total_revenue: 0, product_count: 0, low_stock_count: 0 });

  const orders = await db.get("SELECT COUNT(*) as count, COALESCE(SUM(total_amount),0) as revenue FROM orders WHERE shop_id = ? AND status != 'cancelled'", [shop.id]);
  const products = await db.get('SELECT COUNT(*) as count FROM products WHERE shop_id = ?', [shop.id]);
  const lowStock = await db.get(`
    SELECT COUNT(*) as count FROM products p JOIN stock s ON s.product_id=p.id
    WHERE p.shop_id = ? AND s.quantity <= s.low_stock_threshold
  `, [shop.id]);
  const pendingOrders = await db.get("SELECT COUNT(*) as count FROM orders WHERE shop_id=? AND status IN ('pending','confirmed')", [shop.id]);

  res.json({
    total_orders: orders.count,
    total_revenue: orders.revenue,
    product_count: products.count,
    low_stock_count: lowStock.count,
    pending_orders: pendingOrders.count,
  });
}));

// GET /api/stats/sales - daily revenue last 30 days
router.get('/sales', authMiddleware, requireRole('merchant'), asyncHandler(async (req, res) => {
  const shop = await db.get('SELECT id FROM shops WHERE owner_id = ?', [req.user.id]);
  if (!shop) return res.json([]);

  const sales = await db.all(`
    SELECT DATE(created_at) as date, COUNT(*) as orders, SUM(total_amount) as revenue
    FROM orders
    WHERE shop_id = ? AND status != 'cancelled'
      AND created_at >= DATE('now', '-30 days')
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `, [shop.id]);

  res.json(sales);
}));

// GET /api/stats/products - top selling products
router.get('/products', authMiddleware, requireRole('merchant'), asyncHandler(async (req, res) => {
  const shop = await db.get('SELECT id FROM shops WHERE owner_id = ?', [req.user.id]);
  if (!shop) return res.json([]);

  const top = await db.all(`
    SELECT p.id, p.name, p.category,
      SUM(oi.quantity) as units_sold,
      SUM(oi.quantity * oi.unit_price) as revenue
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    JOIN orders o ON o.id = oi.order_id
    WHERE p.shop_id = ? AND o.status != 'cancelled'
    GROUP BY p.id
    ORDER BY units_sold DESC
    LIMIT 10
  `, [shop.id]);

  res.json(top);
}));

module.exports = router;
