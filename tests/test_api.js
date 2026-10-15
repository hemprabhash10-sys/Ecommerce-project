/**
 * ATELIER LUXE - BACKEND API TEST SUITE (tests/test_api.js)
 * Comprehensive automated integration tests for all REST endpoints,
 * SQLite3 persistence, and Multer local folder image upload.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const SESSION_ID = 'test-session-' + Date.now();

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    testsPassed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    testsFailed++;
  }
}

function request(options, postData = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(options.path || '/', BASE_URL);
    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'X-Session-Id': SESSION_ID,
        ...headers
      }
    };

    if (postData && typeof postData === 'object' && !Buffer.isBuffer(postData)) {
      postData = JSON.stringify(postData);
      reqOptions.headers['Content-Type'] = 'application/json';
      reqOptions.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(reqOptions, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, body: parsed, raw: body });
        } catch (e) {
          resolve({ status: res.statusCode, body: null, raw: body });
        }
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

// Multipart form data helper for testing Multer upload
function uploadFile(endpoint, filePath) {
  return new Promise((resolve, reject) => {
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    const fileName = path.basename(filePath);
    const fileContent = fs.readFileSync(filePath);

    let pre = `--${boundary}\r\n`;
    pre += `Content-Disposition: form-data; name="image"; filename="${fileName}"\r\n`;
    pre += `Content-Type: image/jpeg\r\n\r\n`;
    const post = `\r\n--${boundary}--\r\n`;

    const bodyBuffer = Buffer.concat([
      Buffer.from(pre, 'utf8'),
      fileContent,
      Buffer.from(post, 'utf8')
    ]);

    const url = new URL(endpoint, BASE_URL);
    const req = http.request({
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': bodyBuffer.length,
        'X-Session-Id': SESSION_ID
      }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    req.write(bodyBuffer);
    req.end();
  });
}

async function runSuite() {
  console.log('\n======================================================');
  console.log('   ATELIER LUXE - BACKEND API AUTOMATED TEST SUITE');
  console.log('======================================================\n');

  // Test 1: Health Check
  console.log('1. Health Check Endpoint (/api/health)');
  const healthRes = await request({ path: '/api/health' });
  assert(healthRes.status === 200, 'GET /api/health returns 200 OK');
  assert(healthRes.body.success === true, 'Health check reports success: true');
  assert(healthRes.body.database.includes('SQLite3'), 'Health check confirms SQLite3 connection');

  // Test 2: Products Listing
  console.log('\n2. Products Endpoint (/api/products)');
  const prodRes = await request({ path: '/api/products' });
  assert(prodRes.status === 200, 'GET /api/products returns 200 OK');
  assert(Array.isArray(prodRes.body.data), 'Products data is an array');
  assert(prodRes.body.count > 0, `Products array has items (found ${prodRes.body.count})`);

  // Test 3: Products Filtering & Search
  console.log('\n3. Product Filtering & Query Params');
  const filterRes = await request({ path: '/api/products?category=outerwear' });
  assert(filterRes.status === 200, 'GET /api/products?category=outerwear returns 200 OK');
  const allOuterwear = filterRes.body.data.every(p => p.category === 'outerwear');
  assert(allOuterwear, 'All returned items have category=outerwear');

  // Test 4: Single Product Detail
  console.log('\n4. Product Detail Endpoint (/api/products/:id)');
  const firstId = prodRes.body.data[0].id;
  const detailRes = await request({ path: `/api/products/${firstId}` });
  assert(detailRes.status === 200, `GET /api/products/${firstId} returns 200 OK`);
  assert(detailRes.body.data.id === firstId, 'Product ID matches request');
  assert(detailRes.body.data.price > 0, 'Product has valid price');

  // Test 5: Promo Code Validation
  console.log('\n5. Promo Code Validation (/api/promo/validate)');
  const promoValid = await request({ path: '/api/promo/validate', method: 'POST' }, { code: 'ATELIER15' });
  assert(promoValid.status === 200, 'POST /api/promo/validate returns 200 OK');
  assert(promoValid.body.valid === true, 'ATELIER15 is marked as valid');
  assert(promoValid.body.discount === 0.15, 'ATELIER15 provides 15% discount');

  const promoInvalid = await request({ path: '/api/promo/validate', method: 'POST' }, { code: 'FAKECODE99' });
  assert(promoInvalid.body.valid === false, 'Invalid promo code correctly rejected');

  // Test 6: Cart Persistence (Session-based)
  console.log('\n6. Cart Persistence (/api/cart)');
  const cartPayload = {
    items: [
      { product: { id: firstId, price: 100 }, size: 'M', color: 'Camel', quantity: 2 }
    ]
  };
  const saveCartRes = await request({ path: '/api/cart', method: 'POST' }, cartPayload);
  assert(saveCartRes.status === 200, 'POST /api/cart saves items successfully');

  const getCartRes = await request({ path: '/api/cart' });
  assert(getCartRes.status === 200, 'GET /api/cart returns 200 OK');
  assert(getCartRes.body.data.items.length === 1, 'Cart items persisted in SQLite session table');

  // Test 7: Wishlist Toggle (Session-based)
  console.log('\n7. Wishlist Endpoint (/api/wishlist)');
  const wishToggle1 = await request({ path: `/api/wishlist/${firstId}`, method: 'POST' }, {});
  assert(wishToggle1.status === 200, `POST /api/wishlist/${firstId} toggles wishlist`);
  assert(wishToggle1.body.isSaved === true, 'Product added to wishlist');

  const getWishRes = await request({ path: '/api/wishlist' });
  assert(getWishRes.body.data.includes(firstId), 'Product ID appears in session wishlist query');

  const wishToggle2 = await request({ path: `/api/wishlist/${firstId}`, method: 'POST' }, {});
  assert(wishToggle2.body.isSaved === false, 'Toggling again removes product from wishlist');

  // Test 8: Multer Local File Upload
  console.log('\n8. Multer Local File Upload (/api/upload)');
  const sampleImagePath = path.join(__dirname, '..', 'public', 'images', 'product_wool_overcoat.jpg');
  if (fs.existsSync(sampleImagePath)) {
    const uploadRes = await uploadFile('/api/upload', sampleImagePath);
    assert(uploadRes.status === 201, 'POST /api/upload returns 201 Created');
    assert(uploadRes.body.success === true, 'Upload response indicates success');
    assert(uploadRes.body.savedToLocalFolder.startsWith('public/uploads/'), 'File saved to public/uploads/ local folder');

    // Verify file exists on disk
    const savedDiskPath = path.join(__dirname, '..', uploadRes.body.savedToLocalFolder);
    assert(fs.existsSync(savedDiskPath), 'Uploaded file verified directly on local filesystem disk');
  } else {
    console.log('  ⚠ SKIP: Sample image not found for upload test');
  }

  // Test 9: Create and Delete Product (CRUD in SQLite)
  console.log('\n9. Product CRUD in SQLite (POST & DELETE)');
  const testProdId = `prod_unit_test_${Date.now()}`;
  const createRes = await request({ path: '/api/products', method: 'POST' }, {
    id: testProdId,
    title: 'Automated Test Silk Scarf',
    brand: 'Atelier Luxe',
    category: 'accessories',
    price: 95.00,
    sizes: ['One Size'],
    colors: [{ name: 'Navy', hex: '#001f3f' }],
    inStock: true
  });
  assert(createRes.status === 201, 'POST /api/products returns 201 Created');
  assert(createRes.body.data.title === 'Automated Test Silk Scarf', 'Created product data verified in DB');

  const deleteRes = await request({ path: `/api/products/${testProdId}`, method: 'DELETE' });
  assert(deleteRes.status === 200, `DELETE /api/products/${testProdId} removes test product`);

  // Test 10: Order Placement and Retrieval
  console.log('\n10. Order Placement & Retrieval (/api/orders)');
  const orderRes = await request({ path: '/api/orders', method: 'POST' }, {
    items: [
      { product: { id: firstId, title: 'Sample Garment', price: 150 }, quantity: 1, size: 'L' }
    ],
    subtotal: 150,
    discount: 22.5,
    shippingCost: 0,
    tax: 10.20,
    total: 137.70,
    shipping: {
      fullName: 'Alexander Wright',
      email: 'alexander@example.com',
      address: '742 Evergreen Terrace',
      city: 'Portland',
      postalCode: '97201',
      country: 'United States'
    },
    paymentMethod: 'Credit Card (Simulated)'
  });

  assert(orderRes.status === 201, 'POST /api/orders returns 201 Created');
  assert(orderRes.body.data.orderId.startsWith('ATL-'), 'Order ID successfully generated');
  const generatedOrderId = orderRes.body.data.orderId;

  const getOrderRes = await request({ path: `/api/orders/${generatedOrderId}` });
  assert(getOrderRes.status === 200, `GET /api/orders/${generatedOrderId} retrieves stored order`);
  assert(getOrderRes.body.data.total === 137.70, 'Order total matches stored calculation');

  // Summary
  console.log('\n======================================================');
  console.log(`   TEST RESULTS: ${testsPassed} PASSED | ${testsFailed} FAILED`);
  console.log('======================================================\n');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runSuite().catch(err => {
  console.error('Test suite execution error:', err);
  process.exit(1);
});
