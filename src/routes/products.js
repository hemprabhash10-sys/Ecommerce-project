/**
 * ATELIER LUXE - PRODUCTS ROUTER (routes/products.js)
 * REST Endpoints:
 *   GET  /api/products          - List all products with filtering & sorting
 *   GET  /api/products/:id      - Get a single product by ID
 *   POST /api/products          - Create a new product (admin)
 *   PUT  /api/products/:id      - Update a product (admin)
 *   DELETE /api/products/:id    - Delete a product (admin)
 */

const express = require('express');
const router = express.Router();
const { query, queryOne, run } = require('../db/database');

/**
 * Helper: parse JSON fields stored as text in SQLite
 */
function parseProductRow(row) {
  if (!row) return null;
  return {
    ...row,
    images: safeParseJson(row.images, []),
    colors: safeParseJson(row.colors, []),
    sizes: safeParseJson(row.sizes, []),
    fabricDetails: safeParseJson(row.fabric_details, []),
    careInstructions: safeParseJson(row.care_inst, []),
    compareAtPrice: row.compare_price,
    reviewCount: row.review_count,
    inStock: row.in_stock === 1,
    stockCount: row.stock_count,
    isFeatured: row.is_featured === 1
  };
}

function safeParseJson(val, fallback) {
  try {
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
}

// ─── GET /api/products ──────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { category, search, maxPrice, inStockOnly, sortBy, featured } = req.query;

    let sql = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (category && category !== 'all') {
      sql += ' AND LOWER(category) = LOWER(?)';
      params.push(category);
    }

    if (search && search.trim()) {
      const q = `%${search.trim().toLowerCase()}%`;
      sql += ' AND (LOWER(title) LIKE ? OR LOWER(category) LIKE ? OR LOWER(description) LIKE ?)';
      params.push(q, q, q);
    }

    if (maxPrice) {
      sql += ' AND price <= ?';
      params.push(Number(maxPrice));
    }

    if (inStockOnly === 'true') {
      sql += ' AND in_stock = 1';
    }

    if (featured === 'true') {
      sql += ' AND is_featured = 1';
    }

    // Sorting
    switch (sortBy) {
      case 'price-asc':   sql += ' ORDER BY price ASC'; break;
      case 'price-desc':  sql += ' ORDER BY price DESC'; break;
      case 'rating':      sql += ' ORDER BY rating DESC'; break;
      case 'newest':      sql += " ORDER BY CASE WHEN badge='NEW' THEN 0 ELSE 1 END, created_at DESC"; break;
      default:            sql += ' ORDER BY is_featured DESC, created_at DESC'; break;
    }

    const rows = await query(sql, params);
    const products = rows.map(parseProductRow);

    res.json({ success: true, count: products.length, data: products });
  } catch (err) {
    console.error('GET /api/products error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch products.' });
  }
});

// ─── GET /api/products/:id ───────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const row = await queryOne('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!row) {
      return res.status(404).json({ success: false, error: 'Product not found.' });
    }
    res.json({ success: true, data: parseProductRow(row) });
  } catch (err) {
    console.error('GET /api/products/:id error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch product.' });
  }
});

// ─── POST /api/products ───────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const {
      id, title, brand, category, gender = 'unisex',
      price, compareAtPrice, rating = 4.5, reviewCount = 0,
      badge, description, fabricDetails, careInstructions,
      images, colors, sizes, inStock = true, stockCount = 0, isFeatured = false
    } = req.body;

    if (!id || !title || !category || !price) {
      return res.status(400).json({ success: false, error: 'id, title, category, and price are required.' });
    }

    await run(`
      INSERT INTO products (
        id, title, brand, category, gender, price, compare_price,
        rating, review_count, badge, description, fabric_details, care_inst,
        images, colors, sizes, in_stock, stock_count, is_featured
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, title, brand, category, gender, price, compareAtPrice || null,
      rating, reviewCount, badge || null, description || null,
      JSON.stringify(fabricDetails || []), JSON.stringify(careInstructions || []),
      JSON.stringify(images || []), JSON.stringify(colors || []), JSON.stringify(sizes || []),
      inStock ? 1 : 0, stockCount, isFeatured ? 1 : 0
    ]);

    const created = await queryOne('SELECT * FROM products WHERE id = ?', [id]);
    res.status(201).json({ success: true, data: parseProductRow(created) });
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ success: false, error: 'A product with this ID already exists.' });
    }
    console.error('POST /api/products error:', err);
    res.status(500).json({ success: false, error: 'Failed to create product.' });
  }
});

// ─── PUT /api/products/:id ────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const existing = await queryOne('SELECT id FROM products WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Product not found.' });
    }

    const {
      title, brand, category, gender, price, compareAtPrice,
      rating, reviewCount, badge, description, fabricDetails, careInstructions,
      images, colors, sizes, inStock, stockCount, isFeatured
    } = req.body;

    await run(`
      UPDATE products SET
        title = COALESCE(?, title),
        brand = COALESCE(?, brand),
        category = COALESCE(?, category),
        gender = COALESCE(?, gender),
        price = COALESCE(?, price),
        compare_price = COALESCE(?, compare_price),
        rating = COALESCE(?, rating),
        review_count = COALESCE(?, review_count),
        badge = COALESCE(?, badge),
        description = COALESCE(?, description),
        fabric_details = COALESCE(?, fabric_details),
        care_inst = COALESCE(?, care_inst),
        images = COALESCE(?, images),
        colors = COALESCE(?, colors),
        sizes = COALESCE(?, sizes),
        in_stock = COALESCE(?, in_stock),
        stock_count = COALESCE(?, stock_count),
        is_featured = COALESCE(?, is_featured)
      WHERE id = ?
    `, [
      title, brand, category, gender, price, compareAtPrice,
      rating, reviewCount, badge, description,
      fabricDetails ? JSON.stringify(fabricDetails) : null,
      careInstructions ? JSON.stringify(careInstructions) : null,
      images ? JSON.stringify(images) : null,
      colors ? JSON.stringify(colors) : null,
      sizes ? JSON.stringify(sizes) : null,
      inStock !== undefined ? (inStock ? 1 : 0) : null,
      stockCount, isFeatured !== undefined ? (isFeatured ? 1 : 0) : null,
      req.params.id
    ]);

    const updated = await queryOne('SELECT * FROM products WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: parseProductRow(updated) });
  } catch (err) {
    console.error('PUT /api/products/:id error:', err);
    res.status(500).json({ success: false, error: 'Failed to update product.' });
  }
});

// ─── DELETE /api/products/:id ─────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const existing = await queryOne('SELECT id FROM products WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Product not found.' });
    }
    await run('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: `Product '${req.params.id}' deleted.` });
  } catch (err) {
    console.error('DELETE /api/products/:id error:', err);
    res.status(500).json({ success: false, error: 'Failed to delete product.' });
  }
});

module.exports = router;
