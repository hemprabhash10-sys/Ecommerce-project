/**
 * ATELIER LUXE - UPLOAD ROUTER (routes/upload.js)
 * Handles multipart/form-data image uploads via Multer.
 * Files are saved to: public/uploads/<timestamp>-<originalname>
 *
 * REST Endpoints:
 *   POST /api/upload            - Upload a single product image
 *   GET  /api/upload            - List all uploaded files
 *   DELETE /api/upload/:filename - Delete an uploaded file
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { run, query } = require('../db/database');

const UPLOADS_DIR = path.join(__dirname, '..', '..', 'public', 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// ─── Multer Storage Engine ────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = file.originalname
      .replace(ext, '')
      .replace(/[^a-zA-Z0-9_\-]/g, '_')
      .toLowerCase();
    const uniqueName = `${Date.now()}-${safeName}${ext}`;
    cb(null, uniqueName);
  }
});

// Only allow image types
const fileFilter = (req, file, cb) => {
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 8 * 1024 * 1024 } // 8MB max per file
});

// ─── POST /api/upload ─────────────────────────────────────────────────────────
router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file provided.' });
    }

    const { productId } = req.body;
    const filePath = `/uploads/${req.file.filename}`;

    // Track in DB
    await run(`
      INSERT INTO product_images (product_id, filename, original_name, file_path, mime_type, size)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      productId || null,
      req.file.filename,
      req.file.originalname,
      filePath,
      req.file.mimetype,
      req.file.size
    ]);

    res.status(201).json({
      success: true,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      url: filePath,
      mimeType: req.file.mimetype,
      size: req.file.size,
      savedToLocalFolder: `public/uploads/${req.file.filename}`
    });
  } catch (err) {
    console.error('POST /api/upload error:', err);
    res.status(500).json({ success: false, error: err.message || 'Upload failed.' });
  }
});

// ─── GET /api/upload ──────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const rows = await query(
      'SELECT * FROM product_images ORDER BY uploaded_at DESC',
      []
    );
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    console.error('GET /api/upload error:', err);
    res.status(500).json({ success: false, error: 'Failed to list uploads.' });
  }
});

// ─── DELETE /api/upload/:filename ─────────────────────────────────────────────
router.delete('/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(UPLOADS_DIR, filename);

    // Remove from DB
    await run('DELETE FROM product_images WHERE filename = ?', [filename]);

    // Remove from disk
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ success: true, message: `File '${filename}' deleted.` });
  } catch (err) {
    console.error('DELETE /api/upload/:filename error:', err);
    res.status(500).json({ success: false, error: 'Failed to delete file.' });
  }
});

// Multer error handler
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ success: false, error: `Upload error: ${err.message}` });
  }
  if (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
  next();
});

module.exports = router;
