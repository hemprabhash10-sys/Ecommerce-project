/**
 * ATELIER LUXE - MAIN APPLICATION CONTROLLER (app.js)
 * Connects User Interactions, State Store, API Services, and UI Rendering.
 */

class AppController {
  constructor() {
    this.searchDebounceTimer = null;
    this.currentCheckoutStep = 1;
    this.checkoutFormData = {
      shipping: {},
      payment: {}
    };
  }

  async init() {
    console.log("Initializing Atelier Luxe E-Commerce App...");

    // Initialize state store (loads cart & wishlist from storage)
    await window.store.init();

    // Render initial catalog
    await this.refreshCatalog();

    // Setup event listeners
    this.bindEvents();

    // Check URL parameters for direct category or search links
    this.handleUrlParams();
  }

  // Bind UI Event Listeners
  bindEvents() {
    // Category Filter Pills
    const categoryPills = document.querySelectorAll(".category-pill");
    categoryPills.forEach(pill => {
      pill.addEventListener("click", (e) => {
        categoryPills.forEach(p => p.classList.remove("active"));
        pill.classList.add("active");
        const cat = pill.getAttribute("data-category");
        window.store.setCategory(cat);
      });
    });

    // Live Search Input (with debounce)
    const searchInput = document.getElementById("search-input");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        clearTimeout(this.searchDebounceTimer);
        this.searchDebounceTimer = setTimeout(() => {
          window.store.setSearchQuery(e.target.value);
        }, 200);
      });
    }

    // Sort Dropdown
    const sortSelect = document.getElementById("sort-select");
    if (sortSelect) {
      sortSelect.addEventListener("change", (e) => {
        window.store.setSortBy(e.target.value);
      });
    }

    // Price Range Slider
    const priceSlider = document.getElementById("price-range-slider");
    const priceDisplay = document.getElementById("price-range-val");
    if (priceSlider && priceDisplay) {
      priceSlider.addEventListener("input", (e) => {
        priceDisplay.textContent = `$${e.target.value}`;
        window.store.setMaxPrice(e.target.value);
      });
    }

    // In Stock Only Toggle
    const inStockToggle = document.getElementById("filter-in-stock");
    if (inStockToggle) {
      inStockToggle.addEventListener("change", (e) => {
        window.store.setInStockOnly(e.target.checked);
      });
    }

    // Theme Toggle Button
    const themeBtn = document.getElementById("theme-toggle-btn");
    if (themeBtn) {
      themeBtn.addEventListener("click", () => {
        window.store.toggleTheme();
      });
    }

    // Promo Code Form
    const promoForm = document.getElementById("promo-code-form");
    if (promoForm) {
      promoForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const input = document.getElementById("promo-code-input");
        if (input && input.value) {
          window.store.applyPromo(input.value);
        }
      });
    }

    // Store Subscriptions for UI reactive updates
    window.store.subscribe("cart:updated", (summary) => {
      window.ui.renderCartDrawer(summary);
    });

    window.store.subscribe("wishlist:updated", (list) => {
      window.ui.renderWishlistDrawer(list);
    });

    window.store.subscribe("filters:changed", () => this.refreshCatalog());
    window.store.subscribe("search:changed", () => this.refreshCatalog());
    window.store.subscribe("sort:changed", () => this.refreshCatalog());

    window.store.subscribe("toast", (toastData) => {
      window.ui.showToast(toastData);
    });

    // Keyboard Shortcuts (Esc to close, / to search)
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.closeAllDrawersAndModals();
      }
      if (e.key === "/" && document.activeElement !== searchInput) {
        e.preventDefault();
        if (searchInput) searchInput.focus();
      }
    });
  }

  // Refresh Product Grid based on active store state
  async refreshCatalog() {
    const filters = {
      category: window.store.state.filters.category,
      maxPrice: window.store.state.filters.maxPrice,
      inStockOnly: window.store.state.filters.inStockOnly,
      search: window.store.state.searchQuery,
      sortBy: window.store.state.sortBy
    };

    const products = await window.apiService.getProducts(filters);
    window.ui.renderProductGrid("product-catalog-grid", products);
  }

  // --- Handlers: Wishlist & Cart Actions ---
  async handleWishlistToggle(productId, event) {
    if (event) event.stopPropagation();
    await window.store.toggleWishlist(productId);
    await this.refreshCatalog();
  }

  async handleQuickAddToCart(productId, event) {
    if (event) event.stopPropagation();
    const product = await window.apiService.getProductById(productId);
    if (!product) return;

    // Use default first size and color
    const defaultSize = product.sizes[0];
    const defaultColor = product.colors[0]?.name;
    await window.store.addToCart(product, defaultSize, defaultColor, 1);

    // Open Cart Drawer
    this.openCartDrawer();
  }

  async moveWishlistToCart(productId) {
    const product = await window.apiService.getProductById(productId);
    if (!product) return;

    await window.store.addToCart(product, product.sizes[0], product.colors[0]?.name, 1);
    await window.store.toggleWishlist(productId);
    this.openCartDrawer();
  }

  // --- Handlers: Quick View Modal ---
  async openQuickView(productId) {
    const product = await window.apiService.getProductById(productId);
    if (!product) return;

    window.ui.renderQuickView(product);

    const qvModal = new bootstrap.Modal(document.getElementById("quickview-modal"));
    qvModal.show();
  }

  setQuickViewColor(colorName, el) {
    window.selectedQuickViewColor = colorName;
    const label = document.getElementById("qv-selected-color");
    if (label) label.textContent = colorName;

    const allSwatches = el.parentNode.querySelectorAll(".swatch-btn");
    allSwatches.forEach(s => s.classList.remove("active"));
    el.classList.add("active");
  }

  setQuickViewSize(size, el) {
    window.selectedQuickViewSize = size;
    const label = document.getElementById("qv-selected-size");
    if (label) label.textContent = size;

    const allPills = el.parentNode.querySelectorAll(".size-pill-btn");
    allPills.forEach(p => p.classList.remove("active"));
    el.classList.add("active");
  }

  adjustQuickViewQty(delta) {
    window.selectedQuickViewQty = Math.max(1, (window.selectedQuickViewQty || 1) + delta);
    const display = document.getElementById("qv-qty-display");
    if (display) display.textContent = window.selectedQuickViewQty;
    
    const priceDisplay = document.getElementById("qv-btn-price");
    if (priceDisplay && window.activeQuickViewProduct) {
      priceDisplay.textContent = window.ui.formatPrice(window.activeQuickViewProduct.price * window.selectedQuickViewQty);
    }
  }

  async submitQuickViewAddToCart() {
    if (!window.activeQuickViewProduct) return;
    
    await window.store.addToCart(
      window.activeQuickViewProduct,
      window.selectedQuickViewSize,
      window.selectedQuickViewColor,
      window.selectedQuickViewQty || 1
    );

    // Hide quick view modal
    const modalEl = document.getElementById("quickview-modal");
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();

    // Open Cart Drawer
    this.openCartDrawer();
  }

  showSizeGuideAlert() {
    alert("Size Guide (Standard International Measurements):\n\nXS: Chest 34-36\" | Waist 28-30\"\nS: Chest 36-38\" | Waist 30-32\"\nM: Chest 38-40\" | Waist 32-34\"\nL: Chest 40-42\" | Waist 34-36\"\nXL: Chest 42-44\" | Waist 36-38\"\n\nAll garments feature a relaxed contemporary fit. For a closer fit, we recommend ordering one size down.");
  }

  // --- Handlers: Drawers ---
  openCartDrawer() {
    const cartEl = document.getElementById("offcanvas-cart");
    if (cartEl) {
      const bsOffcanvas = bootstrap.Offcanvas.getOrCreateInstance(cartEl);
      bsOffcanvas.show();
    }
  }

  openWishlistDrawer() {
    const wishlistEl = document.getElementById("offcanvas-wishlist");
    if (wishlistEl) {
      const bsOffcanvas = bootstrap.Offcanvas.getOrCreateInstance(wishlistEl);
      bsOffcanvas.show();
    }
  }

  closeAllDrawersAndModals() {
    document.querySelectorAll(".offcanvas.show").forEach(el => {
      const instance = bootstrap.Offcanvas.getInstance(el);
      if (instance) instance.hide();
    });
    document.querySelectorAll(".modal.show").forEach(el => {
      const instance = bootstrap.Modal.getInstance(el);
      if (instance) instance.hide();
    });
  }

  // --- Handlers: Multi-Step Checkout Modal ---
  openCheckout() {
    const summary = window.store.getCartSummary();
    if (summary.items.length === 0) {
      window.ui.showToast({
        type: "error",
        title: "Bag is Empty",
        message: "Please add at least one garment before proceeding to checkout."
      });
      return;
    }

    // Hide cart drawer
    const cartEl = document.getElementById("offcanvas-cart");
    if (cartEl) {
      const instance = bootstrap.Offcanvas.getInstance(cartEl);
      if (instance) instance.hide();
    }

    // Reset to step 1
    this.goToCheckoutStep(1);

    // Update order summary sidebar in checkout modal
    const checkoutSubtotal = document.getElementById("checkout-modal-subtotal");
    const checkoutTotal = document.getElementById("checkout-modal-total");
    if (checkoutSubtotal) checkoutSubtotal.textContent = window.ui.formatPrice(summary.subtotal);
    if (checkoutTotal) checkoutTotal.textContent = window.ui.formatPrice(summary.total);

    const checkoutModal = new bootstrap.Modal(document.getElementById("checkout-modal"));
    checkoutModal.show();
  }

  goToCheckoutStep(step) {
    this.currentCheckoutStep = step;

    // Update Stepper Nodes
    const nodes = document.querySelectorAll(".step-node");
    nodes.forEach((node, idx) => {
      const nodeStep = idx + 1;
      node.classList.remove("active", "completed");
      if (nodeStep === step) node.classList.add("active");
      if (nodeStep < step) node.classList.add("completed");
    });

    // Update Step View Panels
    document.getElementById("checkout-step-1").classList.toggle("d-none", step !== 1);
    document.getElementById("checkout-step-2").classList.toggle("d-none", step !== 2);
    document.getElementById("checkout-step-3").classList.toggle("d-none", step !== 3);
  }

  handleShippingFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    this.checkoutFormData.shipping = {
      firstName: form.firstName.value,
      lastName: form.lastName.value,
      email: form.email.value,
      address: form.address.value,
      city: form.city.value,
      zip: form.zip.value,
      deliveryMethod: form.deliveryMethod ? form.deliveryMethod.value : "Standard Express"
    };

    this.goToCheckoutStep(2);
  }

  async handlePaymentFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const payBtn = document.getElementById("btn-pay-submit");
    if (payBtn) {
      payBtn.disabled = true;
      payBtn.innerHTML = `
        <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
        Processing Encrypted Payment...
      `;
    }

    const summary = window.store.getCartSummary();
    const orderPayload = {
      items: summary.items,
      subtotal: summary.subtotal,
      discount: summary.discountAmount,
      shippingCost: summary.shippingCost,
      tax: summary.taxAmount,
      total: summary.total,
      shipping: this.checkoutFormData.shipping,
      paymentMethod: "Credit Card (Simulated)"
    };

    try {
      const completedOrder = await window.apiService.submitOrder(orderPayload);
      
      // Update Step 3 with receipt
      window.ui.renderOrderReceipt(completedOrder);
      this.goToCheckoutStep(3);

      // Reset store cart
      await window.store.clearCart();
    } catch (err) {
      console.error("Order submission failed:", err);
      window.ui.showToast({
        type: "error",
        title: "Payment Error",
        message: "An issue occurred while processing the order. Please try again."
      });
      if (payBtn) {
        payBtn.disabled = false;
        payBtn.textContent = "Complete Order";
      }
    }
  }

  finishOrderAndClose() {
    const modalEl = document.getElementById("checkout-modal");
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();
    this.refreshCatalog();
  }

  handleUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get("category");
    if (category) {
      const targetPill = document.querySelector(`.category-pill[data-category="${category}"]`);
      if (targetPill) targetPill.click();
    }
  }
}

// Global App bootstrap
window.app = new AppController();
document.addEventListener("DOMContentLoaded", () => {
  window.app.init();
});
