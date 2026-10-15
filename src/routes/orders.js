/**
 * ATELIER LUXE - ORDERS ROUTER (routes/orders.js)
 * REST Endpoints:
 *   GET  /api/orders            - List all orders (for session)
 *   GET  /api/orders/:orderId   - Get a single order by order ID
 *   POST /api/orders            - Place a new order
 *
 * Also handles:
 *   POST /api/promo/validate    - Validate a promo code
 */

const express = require('express');
const router = express.Router();
const { query, queryOne, run } = require('../db/database');

// Valid promo codes — in Phase 3 these would live in a database table
const PROMO_CODES = {
  'ATELIER15': { discount: 0.15, label: '15% Welcome Discount' },
  'LUXE20':    { discount: 0.20, label: '20% Exclusive Member Discount' },
  'FREESHIP':  { discount: 0.00, freeShipping: true, label: 'Complimentary Express Shipping' }
};

function getSessionId(req) {
  return req.headers['x-session-id'] || req.cookies?.session_id || 'guest-session';
}

function generateOrderId() {
  return `ATL-${Math.floor(100000 + Math.random() * 900000)}`;
}

function getEstimatedDelivery() {
  const date = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

// ─── GET /api/orders ──────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    // In a real app, filter by user ID. For demo, return all orders
    const rows = await query(
      'SELECT * FROM orders ORDER BY created_at DESC LIMIT 50', []
    );
    const orders = rows.map(r => ({
      ...r,
      items: JSON.parse(r.items || '[]'),
      shipping: JSON.parse(r.shipping || '{}')
    }));
    res.json({ success: true, count: orders.length, data: orders });
  } catch (err) {
    console.error('GET /api/orders error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch orders.' });
  }
});

// ─── GET /api/orders/:orderId ─────────────────────────────────────────────────
router.get('/:orderId', async (req, res) => {
  try {
    const row = await queryOne(
      'SELECT * FROM orders WHERE order_id = ?',
      [req.params.orderId]
    );
    if (!row) {
      return res.status(404).json({ success: false, error: 'Order not found.' });
    }
    res.json({
      success: true,
      data: {
        ...row,
        items: JSON.parse(row.items || '[]'),
        shipping: JSON.parse(row.shipping || '{}')
      }
    });
  } catch (err) {
    console.error('GET /api/orders/:orderId error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch order.' });
  }
});

// ─── POST /api/orders ─────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { items, subtotal, discount, shippingCost, tax, total, shipping, paymentMethod } = req.body;

    if (!items || !items.length || !total || !shipping) {
      return res.status(400).json({
        success: false,
        error: 'items, total, and shipping details are required.'
      });
    }

    const orderId = generateOrderId();
    const estimatedDelivery = getEstimatedDelivery();

    await run(`
      INSERT INTO orders (
        order_id, status, items, subtotal, discount, shipping_cost, tax, total,
        shipping, payment_method, estimated_delivery
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      orderId, 'Confirmed',
      JSON.stringify(items),
      subtotal || 0,
      discount || 0,
      shippingCost || 0,
      tax || 0,
      total,
      JSON.stringify(shipping),
      paymentMethod || 'Credit Card',
      estimatedDelivery
    ]);

    // Clear the session cart after successful order
    const sessionId = getSessionId(req);
    await run(
      "UPDATE cart_sessions SET items = '[]', promo_code = NULL WHERE session_id = ?",
      [sessionId]
    );

    res.status(201).json({
      success: true,
      data: {
        orderId,
        status: 'Confirmed',
        estimatedDelivery,
        items,
        subtotal, discount, shippingCost, tax, total,
        shipping,
        createdAt: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('POST /api/orders error:', err);
    res.status(500).json({ success: false, error: 'Failed to place order.' });
  }
});

// ─── POST /api/orders/promo/validate ─────────────────────────────────────────
// Note: This is mounted separately at /api/promo/validate in server.js
router.post('/promo/validate', (req, res) => {
  const { code } = req.body;
  const cleanCode = (code || '').trim().toUpperCase();
  const promo = PROMO_CODES[cleanCode];

  if (promo) {
    return res.json({ success: true, valid: true, code: cleanCode, ...promo });
  }
  res.json({ success: true, valid: false, message: 'Invalid or expired promotion code.' });
});

module.exports = router;
