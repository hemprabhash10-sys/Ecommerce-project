/**
 * ATELIER LUXE - CART ROUTER (routes/cart.js)
 * REST Endpoints:
 *   GET  /api/cart              - Get cart for session
 *   POST /api/cart              - Save/overwrite cart for session
 *   DELETE /api/cart            - Clear the cart for session
 */

const express = require('express');
const router = express.Router();
const { queryOne, run } = require('../db/database');

// Use session_id from header or cookie; default to 'guest' for demo
function getSessionId(req) {
  return req.headers['x-session-id'] || req.cookies?.session_id || 'guest-session';
}

// ─── GET /api/cart ───────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    const session = await queryOne(
      'SELECT items, promo_code FROM cart_sessions WHERE session_id = ?',
      [sessionId]
    );

    const items = session ? JSON.parse(session.items || '[]') : [];
    res.json({ success: true, data: { items, promoCode: session?.promo_code || null } });
  } catch (err) {
    console.error('GET /api/cart error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch cart.' });
  }
});

// ─── POST /api/cart ──────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    const { items = [], promoCode = null } = req.body;

    await run(`
      INSERT INTO cart_sessions (session_id, items, promo_code, updated_at)
      VALUES (?, ?, ?, datetime('now'))
      ON CONFLICT(session_id) DO UPDATE SET
        items = excluded.items,
        promo_code = excluded.promo_code,
        updated_at = datetime('now')
    `, [sessionId, JSON.stringify(items), promoCode]);

    res.json({ success: true, count: items.length });
  } catch (err) {
    console.error('POST /api/cart error:', err);
    res.status(500).json({ success: false, error: 'Failed to save cart.' });
  }
});

// ─── DELETE /api/cart ─────────────────────────────────────────────────────────
router.delete('/', async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    await run(
      "UPDATE cart_sessions SET items = '[]', promo_code = NULL, updated_at = datetime('now') WHERE session_id = ?",
      [sessionId]
    );
    res.json({ success: true, message: 'Cart cleared.' });
  } catch (err) {
    console.error('DELETE /api/cart error:', err);
    res.status(500).json({ success: false, error: 'Failed to clear cart.' });
  }
});

module.exports = router;
