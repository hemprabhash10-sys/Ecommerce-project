/**
 * ATELIER LUXE - REACTIVE STATE STORE (store.js)
 * Lightweight Pub/Sub Store managing Cart, Wishlist, Filter, and UI States.
 */

class Store {
  constructor() {
    this.listeners = {};
    
    this.state = {
      cart: [],
      wishlist: [],
      filters: {
        category: "all",
        maxPrice: 350,
        inStockOnly: false
      },
      searchQuery: "",
      sortBy: "featured",
      promo: null,
      theme: localStorage.getItem("atelier_theme") || "dark",
      selectedProduct: null
    };

    this.FREE_SHIPPING_THRESHOLD = 150.00;
    this.STANDARD_SHIPPING_COST = 15.00;
    this.ESTIMATED_TAX_RATE = 0.08;
  }

  // Pub/Sub Subscription
  subscribe(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    return () => {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    };
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
    // Also emit global 'change'
    if (this.listeners["*"]) {
      this.listeners["*"].forEach(cb => cb({ event, data, state: this.state }));
    }
  }

  // Initialize store with persistent storage
  async init() {
    try {
      this.state.cart = await window.apiService.getCart();
      this.state.wishlist = await window.apiService.getWishlist();
      this.applyTheme(this.state.theme);
      this.emit("cart:updated", this.getCartSummary());
      this.emit("wishlist:updated", this.state.wishlist);
    } catch (err) {
      console.error("Store initialization failed:", err);
    }
  }

  // Cart Calculations & Computeds
  getCartSummary() {
    const items = this.state.cart;
    const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

    let discountAmount = 0;
    let freeShippingFromPromo = false;

    if (this.state.promo) {
      if (this.state.promo.discount) {
        discountAmount = subtotal * this.state.promo.discount;
      }
      if (this.state.promo.freeShipping) {
        freeShippingFromPromo = true;
      }
    }

    const eligibleForFreeShipping = subtotal >= this.FREE_SHIPPING_THRESHOLD || freeShippingFromPromo;
    const shippingCost = items.length === 0 ? 0 : (eligibleForFreeShipping ? 0 : this.STANDARD_SHIPPING_COST);
    const amountNeededForFreeShipping = Math.max(0, this.FREE_SHIPPING_THRESHOLD - subtotal);
    const freeShippingProgress = Math.min(100, Math.round((subtotal / this.FREE_SHIPPING_THRESHOLD) * 100));
    
    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const taxAmount = taxableAmount * this.ESTIMATED_TAX_RATE;
    const total = taxableAmount + shippingCost + taxAmount;

    return {
      items,
      itemCount,
      subtotal,
      discountAmount,
      promo: this.state.promo,
      shippingCost,
      eligibleForFreeShipping,
      amountNeededForFreeShipping,
      freeShippingProgress,
      taxAmount,
      total
    };
  }

  // Add Item to Cart
  async addToCart(product, size = null, color = null, quantity = 1) {
    const selectedSize = size || (product.sizes && product.sizes[0]) || "Standard";
    const selectedColor = color || (product.colors && product.colors[0]?.name) || "Default";
    const cartItemId = `${product.id}-${selectedSize}-${selectedColor}`;

    const existingIndex = this.state.cart.findIndex(i => i.cartItemId === cartItemId);

    if (existingIndex > -1) {
      this.state.cart[existingIndex].quantity += quantity;
    } else {
      this.state.cart.push({
        cartItemId,
        productId: product.id,
        title: product.title,
        price: product.price,
        image: product.images[0],
        selectedSize,
        selectedColor,
        quantity
      });
    }

    await window.apiService.saveCart(this.state.cart);
    const summary = this.getCartSummary();
    this.emit("cart:updated", summary);
    this.emit("toast", {
      type: "success",
      title: "Added to Bag",
      message: `${product.title} (${selectedSize} / ${selectedColor}) has been added.`
    });
    return summary;
  }

  // Update Quantity
  async updateQuantity(cartItemId, newQty) {
    const index = this.state.cart.findIndex(i => i.cartItemId === cartItemId);
    if (index === -1) return;

    if (newQty <= 0) {
      this.state.cart.splice(index, 1);
    } else {
      this.state.cart[index].quantity = newQty;
    }

    await window.apiService.saveCart(this.state.cart);
    const summary = this.getCartSummary();
    this.emit("cart:updated", summary);
  }

  // Remove Item
  async removeFromCart(cartItemId) {
    const item = this.state.cart.find(i => i.cartItemId === cartItemId);
    this.state.cart = this.state.cart.filter(i => i.cartItemId !== cartItemId);
    await window.apiService.saveCart(this.state.cart);
    const summary = this.getCartSummary();
    this.emit("cart:updated", summary);
    if (item) {
      this.emit("toast", {
        type: "info",
        title: "Item Removed",
        message: `${item.title} was removed from your bag.`
      });
    }
  }

  // Clear Cart
  async clearCart() {
    this.state.cart = [];
    this.state.promo = null;
    await window.apiService.saveCart([]);
    this.emit("cart:updated", this.getCartSummary());
  }

  // Apply Promo
  async applyPromo(code) {
    const res = await window.apiService.validatePromoCode(code);
    if (res.valid) {
      this.state.promo = res;
      const summary = this.getCartSummary();
      this.emit("cart:updated", summary);
      this.emit("toast", {
        type: "success",
        title: "Promo Code Applied",
        message: res.label
      });
      return { success: true, promo: res };
    } else {
      this.emit("toast", {
        type: "error",
        title: "Promo Code Error",
        message: res.message
      });
      return { success: false, message: res.message };
    }
  }

  // Wishlist Toggle
  async toggleWishlist(productId) {
    const res = await window.apiService.toggleWishlist(productId);
    this.state.wishlist = await window.apiService.getWishlist();
    this.emit("wishlist:updated", this.state.wishlist);
    this.emit("toast", {
      type: res.isSaved ? "success" : "info",
      title: res.isSaved ? "Saved to Wishlist" : "Removed from Wishlist",
      message: res.isSaved ? "Garment saved to your private curation." : "Item removed from wishlist."
    });
    return res;
  }

  isWishlisted(productId) {
    return this.state.wishlist.includes(productId);
  }

  // Filter & Search Mutators
  setCategory(category) {
    this.state.filters.category = category;
    this.emit("filters:changed", this.state.filters);
  }

  setMaxPrice(price) {
    this.state.filters.maxPrice = Number(price);
    this.emit("filters:changed", this.state.filters);
  }

  setInStockOnly(val) {
    this.state.filters.inStockOnly = Boolean(val);
    this.emit("filters:changed", this.state.filters);
  }

  setSearchQuery(q) {
    this.state.searchQuery = q;
    this.emit("search:changed", q);
  }

  setSortBy(sortKey) {
    this.state.sortBy = sortKey;
    this.emit("sort:changed", sortKey);
  }

  // Theme Toggle
  toggleTheme() {
    this.state.theme = this.state.theme === "dark" ? "light" : "dark";
    this.applyTheme(this.state.theme);
    localStorage.setItem("atelier_theme", this.state.theme);
    this.emit("theme:changed", this.state.theme);
  }

  applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
  }
}

// Global Store singleton
window.store = new Store();
