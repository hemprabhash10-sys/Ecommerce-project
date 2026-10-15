/**
 * ATELIER LUXE - DATABASE LAYER (db/database.js)
 * SQLite3 connection, schema creation, and seed data migration.
 */

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Support both local development and Vercel serverless (/tmp writable filesystem)
const IS_VERCEL = !!process.env.VERCEL;
const ORIGINAL_DB_PATH = path.join(__dirname, '..', '..', 'database', 'ecommerce.db');

let DB_PATH = ORIGINAL_DB_PATH;
if (IS_VERCEL) {
  const tmpDir = path.join('/tmp', 'atelier_data');
  if (!fs.existsSync(tmpDir)) {
    try { fs.mkdirSync(tmpDir, { recursive: true }); } catch (e) {}
  }
  DB_PATH = path.join(tmpDir, 'ecommerce.db');
  // Copy seed database to /tmp if it doesn't exist yet
  if (!fs.existsSync(DB_PATH) && fs.existsSync(ORIGINAL_DB_PATH)) {
    try {
      fs.copyFileSync(ORIGINAL_DB_PATH, DB_PATH);
    } catch (e) {
      console.warn('Could not copy original DB to /tmp, will initialize new DB:', e.message);
    }
  }
}

let db;

function getDb() {
  if (!db) {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('❌ Failed to connect to SQLite database:', err.message);
        process.exit(1);
      }
      console.log('✓ Connected to SQLite3 database at:', DB_PATH);
    });
    db.run('PRAGMA journal_mode = WAL');
    db.run('PRAGMA foreign_keys = ON');
  }
  return db;
}

/**
 * Initialize all database tables.
 * Creates tables if they don't already exist (idempotent).
 */
function initializeSchema(db) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // --- Products Table ---
      db.run(`
        CREATE TABLE IF NOT EXISTS products (
          id              TEXT PRIMARY KEY,
          title           TEXT NOT NULL,
          brand           TEXT NOT NULL,
          category        TEXT NOT NULL,
          gender          TEXT DEFAULT 'unisex',
          price           REAL NOT NULL,
          compare_price   REAL,
          rating          REAL DEFAULT 4.5,
          review_count    INTEGER DEFAULT 0,
          badge           TEXT,
          description     TEXT,
          fabric_details  TEXT,    -- JSON array stored as text
          care_inst       TEXT,    -- JSON array stored as text
          images          TEXT,    -- JSON array stored as text
          colors          TEXT,    -- JSON array stored as text
          sizes           TEXT,    -- JSON array stored as text
          in_stock        INTEGER DEFAULT 1,
          stock_count     INTEGER DEFAULT 0,
          is_featured     INTEGER DEFAULT 0,
          created_at      TEXT DEFAULT (datetime('now'))
        )
      `, (err) => { if (err) { reject(err); return; } });

      // --- Orders Table ---
      db.run(`
        CREATE TABLE IF NOT EXISTS orders (
          id              INTEGER PRIMARY KEY AUTOINCREMENT,
          order_id        TEXT UNIQUE NOT NULL,
          status          TEXT DEFAULT 'Confirmed',
          items           TEXT NOT NULL,   -- JSON array
          subtotal        REAL NOT NULL,
          discount        REAL DEFAULT 0,
          shipping_cost   REAL DEFAULT 0,
          tax             REAL DEFAULT 0,
          total           REAL NOT NULL,
          shipping        TEXT NOT NULL,   -- JSON object
          payment_method  TEXT,
          estimated_delivery TEXT,
          created_at      TEXT DEFAULT (datetime('now'))
        )
      `, (err) => { if (err) { reject(err); return; } });

      // --- Cart Sessions Table ---
      db.run(`
        CREATE TABLE IF NOT EXISTS cart_sessions (
          session_id    TEXT PRIMARY KEY,
          items         TEXT NOT NULL DEFAULT '[]',
          promo_code    TEXT,
          updated_at    TEXT DEFAULT (datetime('now'))
        )
      `, (err) => { if (err) { reject(err); return; } });

      // --- Wishlist Table ---
      db.run(`
        CREATE TABLE IF NOT EXISTS wishlist (
          session_id  TEXT NOT NULL,
          product_id  TEXT NOT NULL,
          added_at    TEXT DEFAULT (datetime('now')),
          PRIMARY KEY (session_id, product_id)
        )
      `, (err) => { if (err) { reject(err); return; } });

      // --- Product Images / Uploads Table ---
      db.run(`
        CREATE TABLE IF NOT EXISTS product_images (
          id          INTEGER PRIMARY KEY AUTOINCREMENT,
          product_id  TEXT,
          filename    TEXT NOT NULL,
          original_name TEXT,
          file_path   TEXT NOT NULL,
          mime_type   TEXT,
          size        INTEGER,
          uploaded_at TEXT DEFAULT (datetime('now'))
        )
      `, (err) => {
        if (err) { reject(err); return; }
        resolve();
      });
    });
  });
}

/**
 * Seed the products table with the initial curated catalog.
 * Only inserts if the products table is empty (safe to call on every boot).
 */
function seedProducts(db) {
  return new Promise((resolve, reject) => {
    db.get('SELECT COUNT(*) as count FROM products', (err, row) => {
      if (err) { reject(err); return; }
      if (row.count > 0) {
        console.log(`✓ Products table already seeded (${row.count} products found).`);
        resolve(); return;
      }

      const SEED_PRODUCTS = [
        {
          id: 'prod_wool_overcoat',
          title: 'Double-Breasted Camel Wool Overcoat',
          brand: 'ATELIER Atelier',
          category: 'outerwear',
          gender: 'unisex',
          price: 295.00,
          compare_price: 380.00,
          rating: 4.9,
          review_count: 94,
          badge: 'BESTSELLER',
          description: 'An iconic sartorial staple. Precision tailored from 100% heavyweight virgin Italian wool. Features horn button closures, wide peak lapels, and an unstructured relaxed drape designed for effortless layering.',
          fabric_details: JSON.stringify(['100% Virgin Merino Wool (540 gsm)', 'Bemberg cupro satin interior lining', 'Genuine Italian horn buttons', 'Double back vent with concealed kick pleat']),
          care_inst: JSON.stringify(['Dry clean only', 'Steam gently to release wrinkles', 'Store on wide-shoulder contoured hanger']),
          images: JSON.stringify(['images/product_wool_overcoat.jpg', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80']),
          colors: JSON.stringify([{ name: 'Camel Tan', hex: '#c19a6b' }, { name: 'Onyx Black', hex: '#111115' }, { name: 'Charcoal', hex: '#3a3a42' }]),
          sizes: JSON.stringify(['XS', 'S', 'M', 'L', 'XL']),
          in_stock: 1, stock_count: 12, is_featured: 1
        },
        {
          id: 'prod_ribbed_sweater',
          title: 'Chunky Ribbed Merino Turtleneck',
          brand: 'ATELIER Studio',
          category: 'knitwear',
          gender: 'women',
          price: 165.00,
          compare_price: 220.00,
          rating: 4.8,
          review_count: 112,
          badge: 'NEW',
          description: 'Knit from extra-fine 7-gauge merino wool for cloud-like softness. Features an architectural ribbed pattern, drop-shoulder silhouette, and an effortless fold-over collar.',
          fabric_details: JSON.stringify(['100% Extra-Fine Australian Merino Wool', 'Pre-washed for shrink resistance', 'Heavyweight 7-gauge fisherman rib knit']),
          care_inst: JSON.stringify(['Hand wash cold with wool detergent', 'Dry flat, do not wring or hang']),
          images: JSON.stringify(['images/product_ribbed_sweater.jpg', 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80']),
          colors: JSON.stringify([{ name: 'Ivory Cream', hex: '#f4f1ea' }, { name: 'Muted Sage', hex: '#8a9a86' }, { name: 'Espresso', hex: '#2e2118' }]),
          sizes: JSON.stringify(['XS', 'S', 'M', 'L']),
          in_stock: 1, stock_count: 18, is_featured: 1
        },
        {
          id: 'prod_denim_jacket',
          title: 'Raw Selvedge Denim Trucker Jacket',
          brand: 'ATELIER Craft',
          category: 'outerwear',
          gender: 'unisex',
          price: 195.00,
          compare_price: 250.00,
          rating: 4.9,
          review_count: 76,
          badge: 'LIMITED',
          description: 'Constructed on vintage shuttle looms from 14.5oz Japanese selvedge denim. Designed with clean contrast stitching, custom brass shanks, and a boxy modern silhouette.',
          fabric_details: JSON.stringify(['14.5 oz Kaihara Japanese Selvedge Denim', '100% Long-Staple Organic Cotton', 'Custom anti-tarnish brass hardware']),
          care_inst: JSON.stringify(['Wear raw for 6 months before first wash', 'Wash inside out in cold water, hang dry only']),
          images: JSON.stringify(['images/product_denim_jacket.jpg', 'https://images.unsplash.com/photo-1543076447-215ad9ba6923?auto=format&fit=crop&w=800&q=80']),
          colors: JSON.stringify([{ name: 'Raw Indigo', hex: '#1c2b48' }, { name: 'Washed Black', hex: '#252528' }]),
          sizes: JSON.stringify(['S', 'M', 'L', 'XL']),
          in_stock: 1, stock_count: 8, is_featured: 1
        },
        {
          id: 'prod_relaxed_blazer',
          title: 'Oversized Charcoal Wool Tailored Blazer',
          brand: 'ATELIER Studio',
          category: 'outerwear',
          gender: 'unisex',
          price: 245.00,
          compare_price: 320.00,
          rating: 4.9,
          review_count: 63,
          badge: 'SALE',
          description: 'A gender-fluid statement piece designed with exaggerated shoulders, deep notch lapels, and an effortless fluid drape.',
          fabric_details: JSON.stringify(['85% Virgin Wool, 15% Silk Blend', 'Full internal horsehair canvas chest piece', 'Hand-finished welt pockets']),
          care_inst: JSON.stringify(['Dry clean only', 'Low temperature press with pressing cloth']),
          images: JSON.stringify(['images/product_relaxed_blazer.jpg', 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80']),
          colors: JSON.stringify([{ name: 'Charcoal Grey', hex: '#35363b' }, { name: 'Midnight Navy', hex: '#151e2e' }]),
          sizes: JSON.stringify(['XS', 'S', 'M', 'L', 'XL']),
          in_stock: 1, stock_count: 15, is_featured: 1
        },
        {
          id: 'prod_silk_shirt',
          title: 'Relaxed Matte Silk Crepe Shirt',
          brand: 'ATELIER Atelier',
          category: 'shirts',
          gender: 'women',
          price: 145.00,
          compare_price: 190.00,
          rating: 4.7,
          review_count: 42,
          badge: 'NEW',
          description: 'Crafted from sand-washed silk crepe de chine with a fluid, liquid-like drape and an ultra-soft peachskin finish.',
          fabric_details: JSON.stringify(['100% Sandwashed Silk Crepe (19mm weight)', 'Mother-of-pearl buttons', 'French seams throughout']),
          care_inst: JSON.stringify(['Hand wash cold or dry clean', 'Do not tumble dry; steam gently']),
          images: JSON.stringify(['https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=800&q=80']),
          colors: JSON.stringify([{ name: 'Sage Olive', hex: '#5b6654' }, { name: 'Alabaster White', hex: '#f3f3f0' }, { name: 'Champagne', hex: '#d8c4a0' }]),
          sizes: JSON.stringify(['XS', 'S', 'M', 'L']),
          in_stock: 1, stock_count: 22, is_featured: 0
        },
        {
          id: 'prod_pleated_trousers',
          title: 'Double-Pleated Wide-Leg Wool Trousers',
          brand: 'ATELIER Studio',
          category: 'pants',
          gender: 'unisex',
          price: 180.00,
          compare_price: 230.00,
          rating: 4.8,
          review_count: 51,
          badge: 'BESTSELLER',
          description: 'High-waisted trousers with dramatic double front pleats and a relaxed wide-leg taper. Designed with side-adjuster buckle tabs.',
          fabric_details: JSON.stringify(['100% Tropical High-Twist Wool', 'Side waist tab adjusters in brass', 'Unfinished hem for custom alteration']),
          care_inst: JSON.stringify(['Dry clean recommended', 'Steam or iron at medium heat']),
          images: JSON.stringify(['https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80']),
          colors: JSON.stringify([{ name: 'Graphite', hex: '#2a2b2f' }, { name: 'Sand Beige', hex: '#c9ba9e' }]),
          sizes: JSON.stringify(['28', '30', '32', '34', '36']),
          in_stock: 1, stock_count: 14, is_featured: 0
        },
        {
          id: 'prod_cashmere_hoodie',
          title: 'Heavyweight Brushed Cashmere Hoodie',
          brand: 'ATELIER Craft',
          category: 'knitwear',
          gender: 'unisex',
          price: 210.00,
          compare_price: 275.00,
          rating: 4.9,
          review_count: 88,
          badge: 'HOT',
          description: 'A plush blend of Mongolian grade-A cashmere and organic combed cotton creates a heavyweight hand feel that repels cold without bulk.',
          fabric_details: JSON.stringify(['70% Mongolian Cashmere, 30% Organic Combed Cotton', 'Double-layered hood', 'Seamless kangaroo pocket']),
          care_inst: JSON.stringify(['Dry clean or hand wash cold', 'Lay flat on towel to dry']),
          images: JSON.stringify(['https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80']),
          colors: JSON.stringify([{ name: 'Muted Taupe', hex: '#8c827a' }, { name: 'Shadow Black', hex: '#161618' }]),
          sizes: JSON.stringify(['S', 'M', 'L', 'XL']),
          in_stock: 1, stock_count: 9, is_featured: 0
        },
        {
          id: 'prod_leather_chelsea',
          title: 'Handcrafted Pebble Leather Chelsea Boots',
          brand: 'ATELIER Footwear',
          category: 'accessories',
          gender: 'unisex',
          price: 285.00,
          compare_price: 350.00,
          rating: 4.9,
          review_count: 39,
          badge: 'LIMITED',
          description: 'Artisan-made in Tuscany using vegetable-tanned full-grain calfskin with Goodyear welt construction and Vibram commando rubber outsoles.',
          fabric_details: JSON.stringify(['100% Full-Grain Tuscan Calf Leather', 'Goodyear Welted construction', 'Vibram Italian rubber lug sole', 'Full calfskin glove lining']),
          care_inst: JSON.stringify(['Condition leather bi-annually with natural beeswax cream', 'Use cedar shoe trees between wears']),
          images: JSON.stringify(['https://images.unsplash.com/photo-1638247025967-b4e38f787b76?auto=format&fit=crop&w=800&q=80']),
          colors: JSON.stringify([{ name: 'Espresso Pebble', hex: '#1e1713' }, { name: 'Onyx Smooth', hex: '#0e0e0e' }]),
          sizes: JSON.stringify(['39', '40', '41', '42', '43', '44']),
          in_stock: 1, stock_count: 7, is_featured: 0
        }
      ];

      const stmt = db.prepare(`
        INSERT OR IGNORE INTO products (
          id, title, brand, category, gender, price, compare_price,
          rating, review_count, badge, description, fabric_details, care_inst,
          images, colors, sizes, in_stock, stock_count, is_featured
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      db.serialize(() => {
        SEED_PRODUCTS.forEach(p => {
          stmt.run([
            p.id, p.title, p.brand, p.category, p.gender, p.price, p.compare_price,
            p.rating, p.review_count, p.badge, p.description, p.fabric_details, p.care_inst,
            p.images, p.colors, p.sizes, p.in_stock, p.stock_count, p.is_featured
          ]);
        });

        stmt.finalize((err) => {
          if (err) { reject(err); return; }
          console.log(`✓ Database seeded with ${SEED_PRODUCTS.length} products.`);
          resolve();
        });
      });
    });
  });
}

/**
 * Helper: run a SELECT query and return rows as a Promise
 */
function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDb().all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

/**
 * Helper: run a SELECT query expecting a single row
 */
function queryOne(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDb().get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row || null);
    });
  });
}

/**
 * Helper: run an INSERT / UPDATE / DELETE and return lastID + changes
 */
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDb().run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

/**
 * Bootstrap the database on startup
 */
async function bootstrap() {
  const db = getDb();
  await initializeSchema(db);
  await seedProducts(db);
}

module.exports = { getDb, bootstrap, query, queryOne, run };
