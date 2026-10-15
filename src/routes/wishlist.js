/**
 * ATELIER LUXE - WISHLIST ROUTER (routes/wishlist.js)
 * REST Endpoints:
 *   GET    /api/wishlist          - Get all wishlisted product IDs for session
 *   POST   /api/wishlist/:id      - Add a product to the wishlist
 *   DELETE /api/wishlist/:id      - Remove a product from the wishlist
 */

const express = require('express');
const router = express.Router();
const { query, queryOne, run } = require('../db/database');

function getSessionId(req) {
  return req.headers['x-session-id'] || req.cookies?.session_id || 'guest-session';
}

// ─── GET /api/wishlist ────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    const rows = await query(
      'SELECT product_id FROM wishlist WHERE session_id = ? ORDER BY added_at DESC',
      [sessionId]
    );
    res.json({ success: true, data: rows.map(r => r.product_id) });
  } catch (err) {
    console.error('GET /api/wishlist error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch wishlist.' });
  }
});

// ─── POST /api/wishlist/:id ───────────────────────────────────────────────────
router.post('/:id', async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    const productId = req.params.id;

    const existing = await queryOne(
      'SELECT product_id FROM wishlist WHERE session_id = ? AND product_id = ?',
      [sessionId, productId]
    );

    if (existing) {
      // Already wishlisted — toggle off
      await run(
        'DELETE FROM wishlist WHERE session_id = ? AND product_id = ?',
        [sessionId, productId]
      );
      const remaining = await query('SELECT product_id FROM wishlist WHERE session_id = ?', [sessionId]);
      return res.json({ success: true, isSaved: false, total: remaining.length });
    }

    // Add to wishlist
    await run(
      "INSERT INTO wishlist (session_id, product_id) VALUES (?, ?)",
      [sessionId, productId]
    );
    const all = await query('SELECT product_id FROM wishlist WHERE session_id = ?', [sessionId]);
    res.json({ success: true, isSaved: true, productId, total: all.length });
  } catch (err) {
    console.error('POST /api/wishlist/:id error:', err);
    res.status(500).json({ success: false, error: 'Failed to update wishlist.' });
  }
});

// ─── DELETE /api/wishlist/:id ─────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    await run(
      'DELETE FROM wishlist WHERE session_id = ? AND product_id = ?',
      [sessionId, req.params.id]
    );
    res.json({ success: true, message: 'Removed from wishlist.' });
  } catch (err) {
    console.error('DELETE /api/wishlist/:id error:', err);
    res.status(500).json({ success: false, error: 'Failed to remove from wishlist.' });
  }
});

module.exports = router;
