const express = require('express');
const { getDb } = require('../database/db');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { sendOrderReceiptEmail, sendDeliveryConfirmationEmail } = require('../utils/mailer');

const router = express.Router();

function getOrderWithDetails(db, orderId) {
  const order = db.prepare(`
    SELECT o.*, sh.name as shop_name, sh.address as shop_address,
      u.name as client_name, u.email as client_email
    FROM orders o
    JOIN shops sh ON sh.id = o.shop_id
    JOIN users u ON u.id = o.client_id
    WHERE o.id = ?
  `).get(orderId);
  if (!order) return null;
  const items = db.prepare(`
    SELECT oi.*, p.name as product_name FROM order_items oi JOIN products p ON p.id = oi.product_id WHERE oi.order_id = ?
  `).all(orderId);
  return { order, items };
}

// POST /api/orders - place order (client)
router.post('/', authMiddleware, requireRole('client'), (req, res) => {
  const { shop_id, items, payment_method, notes, delivery_address, delivery_latitude, delivery_longitude } = req.body;
  if (!shop_id || !items || !Array.isArray(items) || items.length === 0 || items.length > 50) {
    return res.status(400).json({ error: 'shop_id et items requis' });
  }
  if (notes != null && (typeof notes !== 'string' || notes.length > 500)) {
    return res.status(400).json({ error: 'Notes invalides (500 caractères maximum)' });
  }
  if (delivery_address != null && (typeof delivery_address !== 'string' || delivery_address.length > 250)) {
    return res.status(400).json({ error: 'Adresse de livraison invalide (250 caractères maximum)' });
  }
  const hasLat = delivery_latitude != null && delivery_latitude !== '';
  const hasLng = delivery_longitude != null && delivery_longitude !== '';
  const lat = hasLat ? Number(delivery_latitude) : null;
  const lng = hasLng ? Number(delivery_longitude) : null;
  if (hasLat !== hasLng ||
      (lat != null && (!Number.isFinite(lat) || lat < -90 || lat > 90)) ||
      (lng != null && (!Number.isFinite(lng) || lng < -180 || lng > 180))) {
    return res.status(400).json({ error: 'Coordonnées GPS de livraison invalides' });
  }

  const db = getDb();
  const shop = db.prepare('SELECT * FROM shops WHERE id = ? AND status = ?').get(shop_id, 'active');
  if (!shop) return res.status(404).json({ error: 'Boutique introuvable' });

  const validMethods = ['orange_money', 'moov_money', 'wave', 'cash_on_delivery'];
  const method = validMethods.includes(payment_method) ? payment_method : 'cash_on_delivery';

  let orderId;
  try {
    orderId = db.transaction(() => {
      let total = 0;
      const resolvedItems = [];

      for (const item of items) {
        const qty = Number(item.quantity);
        if (!Number.isInteger(qty) || qty <= 0 || qty > 1000) {
          throw Object.assign(new Error('Quantité invalide'), { status: 400 });
        }
        const product = db.prepare('SELECT * FROM products WHERE id = ? AND shop_id = ? AND is_available = 1').get(item.product_id, shop_id);
        if (!product) {
          throw Object.assign(new Error(`Produit ${item.product_id} introuvable dans cette boutique`), { status: 400 });
        }
        const stock = db.prepare('SELECT quantity FROM stock WHERE product_id = ?').get(product.id);
        if (!stock || stock.quantity < qty) {
          throw Object.assign(new Error(`Stock insuffisant pour "${product.name}"`), { status: 400 });
        }
        total += product.price * qty;
        resolvedItems.push({ product, quantity: qty });
      }

      const orderResult = db.prepare(
        `INSERT INTO orders (client_id, shop_id, status, payment_method, total_amount, notes, delivery_address, delivery_latitude, delivery_longitude)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(req.user.id, shop_id, 'pending', method, total, notes || null, delivery_address || null, lat, lng);
      const oid = orderResult.lastInsertRowid;

      for (const { product, quantity } of resolvedItems) {
        db.prepare('INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)').run(
          oid, product.id, quantity, product.price
        );
        // Décrément protégé : échoue si le stock est devenu insuffisant entre-temps
        const upd = db.prepare(
          'UPDATE stock SET quantity = quantity - ?, updated_at = CURRENT_TIMESTAMP WHERE product_id = ? AND quantity >= ?'
        ).run(quantity, product.id, quantity);
        if (upd.changes === 0) {
          throw Object.assign(new Error(`Stock insuffisant pour "${product.name}"`), { status: 400 });
        }
        db.prepare('INSERT INTO stock_movements (product_id, type, quantity, note) VALUES (?, ?, ?, ?)').run(
          product.id, 'exit', quantity, `Commande #${oid}`
        );
      }

      db.prepare('INSERT INTO payments (order_id, amount, method, status) VALUES (?, ?, ?, ?)').run(
        oid, total, method, 'pending'
      );

      return oid;
    })();
  } catch (err) {
    if (err.status === 400) return res.status(400).json({ error: err.message });
    throw err;
  }

  const details = getOrderWithDetails(db, orderId);

  // Envoi du reçu par email (asynchrone, n'échoue jamais la commande)
  if (details && details.order.client_email) {
    sendOrderReceiptEmail(details.order.client_email, details.order.client_name, details.order, details.items);
  }

  res.status(201).json({ ...details.order, items: details.items });
});

// GET /api/orders
router.get('/', authMiddleware, (req, res) => {
  const db = getDb();
  const { status } = req.query;
  let sql, params;

  if (req.user.role === 'client') {
    sql = `
      SELECT o.*, sh.name as shop_name, sh.address as shop_address
      FROM orders o JOIN shops sh ON sh.id = o.shop_id
      WHERE o.client_id = ?
    `;
    params = [req.user.id];
  } else if (req.user.role === 'merchant') {
    const shop = db.prepare('SELECT id FROM shops WHERE owner_id = ?').get(req.user.id);
    if (!shop) return res.json([]);
    sql = `
      SELECT o.*, u.name as client_name, u.phone as client_phone
      FROM orders o JOIN users u ON u.id = o.client_id
      WHERE o.shop_id = ?
    `;
    params = [shop.id];
  } else {
    sql = `SELECT o.*, u.name as client_name, sh.name as shop_name FROM orders o JOIN users u ON u.id=o.client_id JOIN shops sh ON sh.id=o.shop_id WHERE 1=1`;
    params = [];
  }

  if (status) { sql += ` AND o.status = ?`; params.push(status); }
  sql += ` ORDER BY o.created_at DESC`;

  const orders = db.prepare(sql).all(...params);

  const withItems = orders.map((order) => ({
    ...order,
    items: db.prepare(`
      SELECT oi.*, p.name as product_name FROM order_items oi JOIN products p ON p.id=oi.product_id WHERE oi.order_id=?
    `).all(order.id),
  }));

  res.json(withItems);
});

// GET /api/orders/:id
router.get('/:id', authMiddleware, (req, res) => {
  const db = getDb();
  const order = db.prepare(`
    SELECT o.*, sh.name as shop_name, sh.address as shop_address,
      u.name as client_name, u.phone as client_phone
    FROM orders o
    JOIN shops sh ON sh.id = o.shop_id
    JOIN users u ON u.id = o.client_id
    WHERE o.id = ?
  `).get(req.params.id);

  if (!order) return res.status(404).json({ error: 'Commande introuvable' });

  if (req.user.role === 'client' && order.client_id !== req.user.id) {
    return res.status(403).json({ error: 'Accès refusé' });
  }

  if (req.user.role === 'merchant') {
    const shop = db.prepare('SELECT id FROM shops WHERE owner_id = ?').get(req.user.id);
    if (!shop || order.shop_id !== shop.id) return res.status(403).json({ error: 'Accès refusé' });
  }

  const items = db.prepare(`
    SELECT oi.*, p.name as product_name, p.image_url FROM order_items oi JOIN products p ON p.id=oi.product_id WHERE oi.order_id=?
  `).all(req.params.id);

  const payment = db.prepare('SELECT * FROM payments WHERE order_id = ?').get(req.params.id);

  res.json({ ...order, items, payment });
});

// PUT /api/orders/:id/status
router.put('/:id/status', authMiddleware, requireRole('merchant', 'admin'), (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'confirmed', 'ready', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Statut invalide' });
  }

  const db = getDb();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Commande introuvable' });

  if (req.user.role === 'merchant') {
    const shop = db.prepare('SELECT id FROM shops WHERE owner_id = ?').get(req.user.id);
    if (!shop || order.shop_id !== shop.id) return res.status(403).json({ error: 'Accès refusé' });
  }

  const wasDelivered = order.status === 'delivered';

  db.transaction(() => {
    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
    if (status === 'delivered') {
      db.prepare("UPDATE payments SET status = 'completed' WHERE order_id = ?").run(req.params.id);
    }
    // Annulation : restitution du stock
    if (status === 'cancelled' && order.status !== 'cancelled') {
      const items = db.prepare('SELECT product_id, quantity FROM order_items WHERE order_id = ?').all(req.params.id);
      for (const it of items) {
        db.prepare('UPDATE stock SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP WHERE product_id = ?').run(it.quantity, it.product_id);
        db.prepare('INSERT INTO stock_movements (product_id, type, quantity, note) VALUES (?, ?, ?, ?)').run(
          it.product_id, 'entry', it.quantity, `Annulation commande #${req.params.id}`
        );
      }
      db.prepare("UPDATE payments SET status = 'failed' WHERE order_id = ? AND status = 'pending'").run(req.params.id);
    }
  })();

  // Email de confirmation de livraison (une seule fois)
  if (status === 'delivered' && !wasDelivered) {
    const details = getOrderWithDetails(db, req.params.id);
    if (details && details.order.client_email) {
      sendDeliveryConfirmationEmail(details.order.client_email, details.order.client_name, details.order, details.items);
    }
  }

  res.json(db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id));
});

module.exports = router;
