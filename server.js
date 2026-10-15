/**
 * ATELIER LUXE - EXPRESS.JS SERVER (server.js)
 *
 * Decoupled Architecture:
 *   - Serves the static frontend from /public
 *   - Exposes REST API at /api/*
 *   - Connects to SQLite3 for data persistence
 *   - Handles local file uploads via Multer to /public/uploads
 */

const express = require('express');
const path = require('path');
const cors = require('cors');

const requestLogger = require('./src/middleware/logger');
const { bootstrap } = require('./src/db/database');

// Route modules
const productsRouter = require('./src/routes/products');
const cartRouter     = require('./src/routes/cart');
const wishlistRouter = require('./src/routes/wishlist');
const ordersRouter   = require('./src/routes/orders');
const uploadRouter   = require('./src/routes/upload');

// ─────────────────────────────────────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 3000;

// ─── Global Middleware ────────────────────────────────────────────────────────
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-Id']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);

// ─── Static Frontend Serving ──────────────────────────────────────────────────
// Decoupled Architecture: Express serves the compiled static client
app.use(express.static(path.join(__dirname, 'public')));

// ─── REST API Routes ──────────────────────────────────────────────────────────
app.use('/api/products', productsRouter);
app.use('/api/cart',     cartRouter);
app.use('/api/wishlist', wishlistRouter);
app.use('/api/orders',   ordersRouter);
app.use('/api/upload',   uploadRouter);

// Promo code validation (via orders router)
app.post('/api/promo/validate', (req, res) => {
  const PROMO_CODES = {
    'ATELIER15': { discount: 0.15, label: '15% Welcome Discount' },
    'LUXE20':    { discount: 0.20, label: '20% Exclusive Member Discount' },
    'FREESHIP':  { discount: 0.00, freeShipping: true, label: 'Complimentary Express Shipping' }
  };
  const cleanCode = ((req.body && req.body.code) || '').trim().toUpperCase();
  const promo = PROMO_CODES[cleanCode];
  if (promo) return res.json({ success: true, valid: true, code: cleanCode, ...promo });
  res.json({ success: true, valid: false, message: 'Invalid or expired promotion code.' });
});

// ─── API Health Check ─────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    service: 'ATELIER LUXE REST API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    database: 'SQLite3 (Connected)',
    uptime: `${Math.floor(process.uptime())}s`
  });
});

// ─── SPA Fallback: Serve index.html for any non-API route ─────────────────────
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err.stack || err.message);
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'An internal server error occurred.' : err.message
  });
});

// ─── Bootstrap Database & Start Server ───────────────────────────────────────
let isBootstrapped = false;
let bootstrapPromise = null;

async function ensureDbReady() {
  if (isBootstrapped) return;
  if (!bootstrapPromise) {
    bootstrapPromise = bootstrap().then(() => {
      isBootstrapped = true;
    });
  }
  return bootstrapPromise;
}

// Middleware to ensure DB is initialized on serverless request invocations
app.use(async (req, res, next) => {
  try {
    await ensureDbReady();
    next();
  } catch (err) {
    next(err);
  }
});

// If running directly as a standalone Node.js process (local dev or traditional hosting)
if (require.main === module || !process.env.VERCEL) {
  (async () => {
    try {
      await ensureDbReady();

      app.listen(PORT, () => {
        console.log('\n');
        console.log('┌──────────────────────────────────────────────────────────┐');
        console.log('│         ATELIER LUXE E-Commerce Platform Running          │');
        console.log('│                                                          │');
        console.log(`│  Storefront:  http://localhost:${PORT}                       │`);
        console.log(`│  REST API:    http://localhost:${PORT}/api                   │`);
        console.log(`│  Health:      http://localhost:${PORT}/api/health            │`);
        console.log(`│  Database:    SQLite3 → database/ecommerce.db            │`);
        console.log(`│  Uploads:     public/uploads/                            │`);
        console.log('└──────────────────────────────────────────────────────────┘');
        console.log('\nRequest log:\n');
      });
    } catch (err) {
      console.error('Failed to start server:', err);
      process.exit(1);
    }
  })();
}

// Export for Vercel Serverless Functions
module.exports = app;
