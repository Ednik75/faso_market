const express = require('express');
const { db } = require('../database/db');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/asyncHandler');
const { sendOrderReceiptEmail, sendDeliveryConfirmationEmail } = require('../utils/mailer');

const router = express.Router();

async function getOrderWithDetails(orderId) {
  const order = await db.get(`
    SELECT o.*, sh.name as shop_name, sh.address as shop_address,
      u.name as client_name, u.email as client_email
    FROM orders o
    JOIN shops sh ON sh.id = o.shop_id
    JOIN users u ON u.id = o.client_id
    WHERE o.id = ?
  `, [orderId]);
  if (!order) return null;
  const items = await db.all(`
    SELECT oi.*, p.name as product_name FROM order_items oi JOIN products p ON p.id = oi.product_id WHERE oi.order_id = ?
  `, [orderId]);
  return { order, items };
}

// POST /api/orders - place order (client)
router.post('/', authMiddleware, requireRole('client'), asyncHandler(async (req, res) => {
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

  const shop = await db.get('SELECT * FROM shops WHERE id = ? AND status = ?', [shop_id, 'active']);
  if (!shop) return res.status(404).json({ error: 'Boutique introuvable' });

  const validMethods = ['orange_money', 'moov_money', 'wave', 'cash_on_delivery'];
  const method = validMethods.includes(payment_method) ? payment_method : 'cash_on_delivery';

  let orderId;
  try {
    orderId = await db.transaction(async (tx) => {
      let total = 0;
      const resolvedItems = [];

      for (const item of items) {
        const qty = Number(item.quantity);
        if (!Number.isInteger(qty) || qty <= 0 || qty > 1000) {
          throw Object.assign(new Error('Quantité invalide'), { status: 400 });
        }
        const product = await tx.get('SELECT * FROM products WHERE id = ? AND shop_id = ? AND is_available = 1', [item.product_id, shop_id]);
        if (!product) {
          throw Object.assign(new Error(`Produit ${item.product_id} introuvable dans cette boutique`), { status: 400 });
        }
        const stock = await tx.get('SELECT quantity FROM stock WHERE product_id = ?', [product.id]);
        if (!stock || stock.quantity < qty) {
          throw Object.assign(new Error(`Stock insuffisant pour "${product.name}"`), { status: 400 });
        }
        total += product.price * qty;
        resolvedItems.push({ product, quantity: qty });
      }

      const orderResult = await tx.run(
        `INSERT INTO orders (client_id, shop_id, status, payment_method, total_amount, notes, delivery_address, delivery_latitude, delivery_longitude)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [req.user.id, shop_id, 'pending', method, total, notes || null, delivery_address || null, lat, lng]
      );
      const oid = orderResult.lastInsertRowid;

      for (const { product, quantity } of resolvedItems) {
        await tx.run('INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)', [
          oid, product.id, quantity, product.price,
        ]);
        // Décrément protégé : échoue si le stock est devenu insuffisant entre-temps
        const upd = await tx.run(
          'UPDATE stock SET quantity = quantity - ?, updated_at = CURRENT_TIMESTAMP WHERE product_id = ? AND quantity >= ?',
          [quantity, product.id, quantity]
        );
        if (upd.changes === 0) {
          throw Object.assign(new Error(`Stock insuffisant pour "${product.name}"`), { status: 400 });
        }
        await tx.run('INSERT INTO stock_movements (product_id, type, quantity, note) VALUES (?, ?, ?, ?)', [
          product.id, 'exit', quantity, `Commande #${oid}`,
        ]);
      }

      await tx.run('INSERT INTO payments (order_id, amount, method, status) VALUES (?, ?, ?, ?)', [
        oid, total, method, 'pending',
      ]);

      return oid;
    });
  } catch (err) {
    if (err.status === 400) return res.status(400).json({ error: err.message });
    throw err;
  }

  const details = await getOrderWithDetails(orderId);

  // Envoi du reçu par email (asynchrone, n'échoue jamais la commande)
  if (details && details.order.client_email) {
    sendOrderReceiptEmail(details.order.client_email, details.order.client_name, details.order, details.items);
  }

  res.status(201).json({ ...details.order, items: details.items });
}));

// GET /api/orders
router.get('/', authMiddleware, asyncHandler(async (req, res) => {
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
    const shop = await db.get('SELECT id FROM shops WHERE owner_id = ?', [req.user.id]);
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

  const orders = await db.all(sql, params);

  const withItems = [];
  for (const order of orders) {
    withItems.push({
      ...order,
      items: await db.all(`
        SELECT oi.*, p.name as product_name FROM order_items oi JOIN products p ON p.id=oi.product_id WHERE oi.order_id=?
      `, [order.id]),
    });
  }

  res.json(withItems);
}));

// GET /api/orders/:id
router.get('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const order = await db.get(`
    SELECT o.*, sh.name as shop_name, sh.address as shop_address,
      u.name as client_name, u.phone as client_phone
    FROM orders o
    JOIN shops sh ON sh.id = o.shop_id
    JOIN users u ON u.id = o.client_id
    WHERE o.id = ?
  `, [req.params.id]);

  if (!order) return res.status(404).json({ error: 'Commande introuvable' });

  if (req.user.role === 'client' && order.client_id !== req.user.id) {
    return res.status(403).json({ error: 'Accès refusé' });
  }

  if (req.user.role === 'merchant') {
    const shop = await db.get('SELECT id FROM shops WHERE owner_id = ?', [req.user.id]);
    if (!shop || order.shop_id !== shop.id) return res.status(403).json({ error: 'Accès refusé' });
  }

  const items = await db.all(`
    SELECT oi.*, p.name as product_name, p.image_url FROM order_items oi JOIN products p ON p.id=oi.product_id WHERE oi.order_id=?
  `, [req.params.id]);

  const payment = await db.get('SELECT * FROM payments WHERE order_id = ?', [req.params.id]);

  res.json({ ...order, items, payment });
}));

// PUT /api/orders/:id/status
router.put('/:id/status', authMiddleware, requireRole('merchant', 'admin'), asyncHandler(async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'confirmed', 'ready', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Statut invalide' });
  }

  const order = await db.get('SELECT * FROM orders WHERE id = ?', [req.params.id]);
  if (!order) return res.status(404).json({ error: 'Commande introuvable' });

  if (req.user.role === 'merchant') {
    const shop = await db.get('SELECT id FROM shops WHERE owner_id = ?', [req.user.id]);
    if (!shop || order.shop_id !== shop.id) return res.status(403).json({ error: 'Accès refusé' });
  }

  const wasDelivered = order.status === 'delivered';

  await db.transaction(async (tx) => {
    await tx.run('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
    if (status === 'delivered') {
      await tx.run("UPDATE payments SET status = 'completed' WHERE order_id = ?", [req.params.id]);
    }
    // Annulation : restitution du stock
    if (status === 'cancelled' && order.status !== 'cancelled') {
      const items = await tx.all('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [req.params.id]);
      for (const it of items) {
        await tx.run('UPDATE stock SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP WHERE product_id = ?', [it.quantity, it.product_id]);
        await tx.run('INSERT INTO stock_movements (product_id, type, quantity, note) VALUES (?, ?, ?, ?)', [
          it.product_id, 'entry', it.quantity, `Annulation commande #${req.params.id}`,
        ]);
      }
      await tx.run("UPDATE payments SET status = 'failed' WHERE order_id = ? AND status = 'pending'", [req.params.id]);
    }
  });

  // Email de confirmation de livraison (une seule fois)
  if (status === 'delivered' && !wasDelivered) {
    const details = await getOrderWithDetails(req.params.id);
    if (details && details.order.client_email) {
      sendDeliveryConfirmationEmail(details.order.client_email, details.order.client_name, details.order, details.items);
    }
  }

  res.json(await db.get('SELECT * FROM orders WHERE id = ?', [req.params.id]));
}));

module.exports = router;
