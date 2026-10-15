/**
 * ATELIER LUXE - DECOUPLED API SERVICE LAYER (api.js)
 *
 * Implements a clean REST-like client interface.
 * Phase 2: Connected to Express.js REST API endpoints:
 *   - GET  /api/products
 *   - GET  /api/products/:id
 *   - POST /api/cart
 *   - POST /api/orders
 *   - POST /api/upload (multer local file upload)
 */

class ApiService {
  constructor() {
    this.isRemote = true; // Phase 2: Live Express.js backend is active
    this.baseUrl = "/api";
    this.storageKeys = {
      PRODUCTS: "atelier_products_v1",
      CART: "atelier_cart_v1",
      WISHLIST: "atelier_wishlist_v1",
      ORDERS: "atelier_orders_v1"
    };

    this.initializeLocalStorage();
  }

  // Generate a persistent session ID for server-side cart/wishlist tracking
  getSessionId() {
    let sid = localStorage.getItem('atelier_session_id');
    if (!sid) {
      sid = 'sess-' + Math.random().toString(36).substr(2, 16);
      localStorage.setItem('atelier_session_id', sid);
    }
    return sid;
  }

  apiFetch(path, options = {}) {
    return fetch(this.baseUrl + path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Id': this.getSessionId(),
        ...(options.headers || {})
      }
    }).then(r => r.json());
  }

  initializeLocalStorage() {
    if (!localStorage.getItem(this.storageKeys.PRODUCTS)) {
      localStorage.setItem(this.storageKeys.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
    }
    if (!localStorage.getItem(this.storageKeys.CART)) {
      localStorage.setItem(this.storageKeys.CART, JSON.stringify([]));
    }
    if (!localStorage.getItem(this.storageKeys.WISHLIST)) {
      localStorage.setItem(this.storageKeys.WISHLIST, JSON.stringify([]));
    }
    if (!localStorage.getItem(this.storageKeys.ORDERS)) {
      localStorage.setItem(this.storageKeys.ORDERS, JSON.stringify([]));
    }
  }

  // Helper to simulate realistic async network response in decoupled client
  async _simulateNetworkDelay(data, ms = 80) {
    return new Promise(resolve => setTimeout(() => resolve(JSON.parse(JSON.stringify(data))), ms));
  }

  /**
   * Fetch all products with filtering, search, and sorting
   */
  async getProducts(params = {}) {
    if (this.isRemote) {
      const queryStr = new URLSearchParams(params).toString();
      const res = await this.apiFetch(`/products?${queryStr}`);
      return res.data || [];
    }

    // Local / Phase 1 implementation
    let products = JSON.parse(localStorage.getItem(this.storageKeys.PRODUCTS) || "[]");

    // Filter by Category
    if (params.category && params.category !== "all") {
      products = products.filter(p => p.category.toLowerCase() === params.category.toLowerCase());
    }

    // Filter by Search Query
    if (params.search && params.search.trim()) {
      const q = params.search.toLowerCase().trim();
      products = products.filter(p => 
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.badge && p.badge.toLowerCase().includes(q))
      );
    }

    // Filter by Price Range
    if (params.maxPrice) {
      products = products.filter(p => p.price <= Number(params.maxPrice));
    }

    // Filter by In-Stock Only
    if (params.inStockOnly) {
      products = products.filter(p => p.inStock);
    }

    // Sorting
    if (params.sortBy) {
      switch (params.sortBy) {
        case "price-asc":
          products.sort((a, b) => a.price - b.price);
          break;
        case "price-desc":
          products.sort((a, b) => b.price - a.price);
          break;
        case "rating":
          products.sort((a, b) => b.rating - a.rating);
          break;
        case "newest":
          products.sort((a, b) => (b.badge === "NEW" ? 1 : 0) - (a.badge === "NEW" ? 1 : 0));
          break;
        default: // featured
          products.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
      }
    }

    return this._simulateNetworkDelay(products);
  }

  /**
   * Fetch a single product by ID
   */
  async getProductById(id) {
    if (this.isRemote) {
      const res = await this.apiFetch(`/products/${id}`);
      return res.data || null;
    }

    const products = JSON.parse(localStorage.getItem(this.storageKeys.PRODUCTS) || "[]");
    const product = products.find(p => p.id === id);
    if (!product) throw new Error(`Product ${id} not found`);
    return this._simulateNetworkDelay(product);
  }

  /**
   * Create a new product (POST /api/products)
   */
  async createProduct(productData) {
    if (this.isRemote) {
      const res = await this.apiFetch('/products', {
        method: 'POST',
        body: JSON.stringify(productData)
      });
      return res.data || res;
    }
    const products = JSON.parse(localStorage.getItem(this.storageKeys.PRODUCTS) || "[]");
    products.unshift(productData);
    localStorage.setItem(this.storageKeys.PRODUCTS, JSON.stringify(products));
    return this._simulateNetworkDelay(productData);
  }

  /**
   * Retrieve Cart items
   */
  async getCart() {
    if (this.isRemote) {
      const res = await this.apiFetch('/cart');
      return (res.data && res.data.items) || [];
    }
    const cart = JSON.parse(localStorage.getItem(this.storageKeys.CART) || "[]");
    return this._simulateNetworkDelay(cart);
  }

  /**
   * Persist Cart items
   */
  async saveCart(items) {
    if (this.isRemote) {
      const res = await this.apiFetch('/cart', {
        method: 'POST',
        body: JSON.stringify({ items })
      });
      return res;
    }
    localStorage.setItem(this.storageKeys.CART, JSON.stringify(items));
    return this._simulateNetworkDelay({ success: true, count: items.length });
  }

  /**
   * Retrieve Wishlist item IDs
   */
  async getWishlist() {
    if (this.isRemote) {
      const res = await this.apiFetch('/wishlist');
      return res.data || [];
    }
    const wishlist = JSON.parse(localStorage.getItem(this.storageKeys.WISHLIST) || "[]");
    return this._simulateNetworkDelay(wishlist);
  }

  /**
   * Toggle Wishlist item
   */
  async toggleWishlist(productId) {
    if (this.isRemote) {
      const res = await this.apiFetch(`/wishlist/${productId}`, { method: 'POST', body: '{}' });
      return res;
    }
    const wishlist = JSON.parse(localStorage.getItem(this.storageKeys.WISHLIST) || "[]");
    const index = wishlist.indexOf(productId);
    let isSaved = false;
    if (index > -1) {
      wishlist.splice(index, 1);
      isSaved = false;
    } else {
      wishlist.push(productId);
      isSaved = true;
    }
    localStorage.setItem(this.storageKeys.WISHLIST, JSON.stringify(wishlist));
    return this._simulateNetworkDelay({ productId, isSaved, total: wishlist.length });
  }

  /**
   * Validate Promo Code
   */
  async validatePromoCode(code) {
    if (this.isRemote) {
      const res = await this.apiFetch('/promo/validate', {
        method: 'POST',
        body: JSON.stringify({ code })
      });
      return res;
    }
    const cleanCode = (code || "").trim().toUpperCase();
    if (PROMO_CODES[cleanCode]) {
      return this._simulateNetworkDelay({ valid: true, code: cleanCode, ...PROMO_CODES[cleanCode] });
    }
    return this._simulateNetworkDelay({ valid: false, message: "Invalid or expired promotion code." });
  }

  /**
   * Submit an Order
   */
  async submitOrder(orderPayload) {
    if (this.isRemote) {
      const res = await this.apiFetch('/orders', {
        method: 'POST',
        body: JSON.stringify(orderPayload)
      });
      return res.data || res;
    }

    const orderId = `ATL-${Math.floor(100000 + Math.random() * 900000)}`;
    const fullOrder = {
      orderId,
      createdAt: new Date().toISOString(),
      ...orderPayload,
      status: "Confirmed",
      estimatedDelivery: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric"
      })
    };

    const orders = JSON.parse(localStorage.getItem(this.storageKeys.ORDERS) || "[]");
    orders.unshift(fullOrder);
    localStorage.setItem(this.storageKeys.ORDERS, JSON.stringify(orders));

    // Clear cart on successful order
    localStorage.setItem(this.storageKeys.CART, JSON.stringify([]));

    return this._simulateNetworkDelay(fullOrder, 300);
  }

  /**
   * Simulated Local File Upload Handler
   * In Phase 2: Will send multipart/form-data via POST to Express `/api/upload`
   * which saves files directly to `public/uploads/` on the server disk!
   */
  async uploadProductImage(file, productId = null) {
    if (this.isRemote) {
      const formData = new FormData();
      formData.append('image', file);
      if (productId) formData.append('productId', productId);
      const res = await fetch(`${this.baseUrl}/upload`, {
        method: 'POST',
        headers: { 'X-Session-Id': this.getSessionId() },
        body: formData  // Do NOT set Content-Type; browser sets it with boundary
      });
      return await res.json();
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          success: true,
          fileName: file.name,
          url: reader.result,
          savedToLocalFolder: `uploads/${file.name}`
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

// Global API singleton
window.apiService = new ApiService();
