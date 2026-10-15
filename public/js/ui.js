/**
 * ATELIER LUXE - UI CONTROLLER (ui.js)
 * Modular presentation layer for rendering DOM elements, Modals, Offcanvas Drawers, and Toasts.
 */

class UIController {
  constructor() {
    this.currencySymbol = "$";
  }

  formatPrice(amount) {
    return `${this.currencySymbol}${Number(amount).toFixed(2)}`;
  }

  // --- Render Product Grid ---
  renderProductGrid(containerId, products) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!products || products.length === 0) {
      container.innerHTML = `
        <div class="col-12 text-center py-5">
          <div class="py-4">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-muted mb-3">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <h4 class="font-serif mb-2">No Garments Found</h4>
            <p class="text-secondary mb-4">No pieces match your selected filters. Try adjusting your search criteria.</p>
            <button class="btn btn-atelier-outline" onclick="window.store.setCategory('all'); document.getElementById('search-input').value='';">
              Reset Filters
            </button>
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = products.map(product => this.createProductCardHTML(product)).join("");
  }

  createProductCardHTML(product) {
    const isWishlisted = window.store.isWishlisted(product.id);
    const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
    const discountPercent = hasDiscount 
      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
      : 0;

    let badgeHTML = "";
    if (product.badge) {
      const badgeClass = product.badge.toLowerCase() === "new" ? "badge-new" :
                         product.badge.toLowerCase() === "sale" ? "badge-sale" : "badge-hot";
      badgeHTML = `<span class="product-badge ${badgeClass}">${product.badge}</span>`;
    }

    return `
      <div class="col-12 col-sm-6 col-lg-3 mb-4">
        <article class="product-card h-100" data-product-id="${product.id}">
          <div class="product-img-wrapper">
            <img src="${product.images[0]}" alt="${product.title}" class="product-img" loading="lazy">
            
            <div class="product-badge-group">
              ${badgeHTML}
              ${hasDiscount ? `<span class="product-badge badge-sale">-${discountPercent}%</span>` : ""}
            </div>

            <button class="wishlist-btn-corner ${isWishlisted ? 'active' : ''}" 
                    aria-label="Save to Wishlist"
                    onclick="window.app.handleWishlistToggle('${product.id}', event)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="${isWishlisted ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </button>

            <button class="quick-view-overlay-btn" onclick="window.app.openQuickView('${product.id}')">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              Quick View
            </button>
          </div>

          <div class="product-info">
            <span class="product-brand">${product.brand}</span>
            <h3 class="product-title" title="${product.title}">${product.title}</h3>
            
            <div class="product-rating">
              <span class="star-gold">★</span>
              <span>${product.rating.toFixed(1)}</span>
              <span class="text-muted">(${product.reviewCount})</span>
            </div>

            <div class="product-price-row">
              <span class="product-price">${this.formatPrice(product.price)}</span>
              ${hasDiscount ? `<span class="product-compare-price">${this.formatPrice(product.compareAtPrice)}</span>` : ""}
            </div>

            <button class="btn-add-cart-card" onclick="window.app.handleQuickAddToCart('${product.id}', event)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
              Add to Bag
            </button>
          </div>
        </article>
      </div>
    `;
  }

  // --- Render Cart Drawer ---
  renderCartDrawer(cartSummary) {
    const itemsContainer = document.getElementById("cart-items-list");
    const cartFooter = document.getElementById("cart-drawer-footer");
    const emptyState = document.getElementById("cart-empty-state");
    const freeShippingBox = document.getElementById("free-shipping-container");
    
    // Update Badge Count
    this.updateBadges(cartSummary.itemCount, window.store.state.wishlist.length);

    if (cartSummary.items.length === 0) {
      if (itemsContainer) itemsContainer.innerHTML = "";
      if (emptyState) emptyState.classList.remove("d-none");
      if (cartFooter) cartFooter.classList.add("d-none");
      if (freeShippingBox) freeShippingBox.classList.add("d-none");
      return;
    }

    if (emptyState) emptyState.classList.add("d-none");
    if (cartFooter) cartFooter.classList.remove("d-none");
    if (freeShippingBox) freeShippingBox.classList.remove("d-none");

    // Free Shipping Progress
    const shippingProgressText = document.getElementById("free-shipping-text-status");
    const shippingProgressBar = document.getElementById("free-shipping-progress-bar");
    if (shippingProgressText && shippingProgressBar) {
      if (cartSummary.eligibleForFreeShipping) {
        shippingProgressText.innerHTML = `<span>🎉 You've unlocked <strong>Free Express Shipping!</strong></span>`;
        shippingProgressBar.style.width = "100%";
      } else {
        shippingProgressText.innerHTML = `
          <span>Add <strong>${this.formatPrice(cartSummary.amountNeededForFreeShipping)}</strong> for <strong>Free Shipping</strong></span>
          <span class="text-muted">${cartSummary.freeShippingProgress}%</span>
        `;
        shippingProgressBar.style.width = `${cartSummary.freeShippingProgress}%`;
      }
    }

    // Render Items
    if (itemsContainer) {
      itemsContainer.innerHTML = cartSummary.items.map(item => `
        <div class="cart-item-row" data-cart-item-id="${item.cartItemId}">
          <img src="${item.image}" alt="${item.title}" class="cart-item-thumb">
          <div class="cart-item-details">
            <h4 class="cart-item-title">${item.title}</h4>
            <div class="cart-item-variants">
              <span>Size: <strong>${item.selectedSize}</strong></span> • 
              <span>Color: <strong>${item.selectedColor}</strong></span>
            </div>
            <div class="cart-item-price">${this.formatPrice(item.price * item.quantity)}</div>
            <div class="d-flex align-items-center">
              <div class="qty-control-group">
                <button class="qty-btn" onclick="window.store.updateQuantity('${item.cartItemId}', ${item.quantity - 1})">−</button>
                <span class="qty-number">${item.quantity}</span>
                <button class="qty-btn" onclick="window.store.updateQuantity('${item.cartItemId}', ${item.quantity + 1})">+</button>
              </div>
              <button class="btn-remove-item ms-auto" onclick="window.store.removeFromCart('${item.cartItemId}')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      `).join("");
    }

    // Render Totals
    const subtotalEl = document.getElementById("cart-subtotal");
    const discountRow = document.getElementById("cart-discount-row");
    const discountEl = document.getElementById("cart-discount-amount");
    const shippingEl = document.getElementById("cart-shipping-cost");
    const taxEl = document.getElementById("cart-tax-amount");
    const totalEl = document.getElementById("cart-total-amount");

    if (subtotalEl) subtotalEl.textContent = this.formatPrice(cartSummary.subtotal);
    if (discountRow && discountEl) {
      if (cartSummary.discountAmount > 0) {
        discountRow.classList.remove("d-none");
        discountEl.textContent = `-${this.formatPrice(cartSummary.discountAmount)}`;
      } else {
        discountRow.classList.add("d-none");
      }
    }
    if (shippingEl) {
      shippingEl.textContent = cartSummary.shippingCost === 0 ? "FREE" : this.formatPrice(cartSummary.shippingCost);
    }
    if (taxEl) taxEl.textContent = this.formatPrice(cartSummary.taxAmount);
    if (totalEl) totalEl.textContent = this.formatPrice(cartSummary.total);
  }

  // --- Render Wishlist Drawer ---
  renderWishlistDrawer(wishlistProductIds) {
    const container = document.getElementById("wishlist-items-list");
    const emptyState = document.getElementById("wishlist-empty-state");
    if (!container) return;

    const allProducts = JSON.parse(localStorage.getItem(window.apiService.storageKeys.PRODUCTS) || "[]");
    const wishlistedProducts = allProducts.filter(p => wishlistProductIds.includes(p.id));

    if (wishlistedProducts.length === 0) {
      container.innerHTML = "";
      if (emptyState) emptyState.classList.remove("d-none");
      return;
    }

    if (emptyState) emptyState.classList.add("d-none");

    container.innerHTML = wishlistedProducts.map(prod => `
      <div class="cart-item-row" data-product-id="${prod.id}">
        <img src="${prod.images[0]}" alt="${prod.title}" class="cart-item-thumb">
        <div class="cart-item-details">
          <h4 class="cart-item-title">${prod.title}</h4>
          <span class="product-brand mb-1">${prod.brand}</span>
          <div class="cart-item-price mb-2">${this.formatPrice(prod.price)}</div>
          <div class="d-flex align-items-center gap-2">
            <button class="btn btn-sm btn-atelier-primary py-1 px-3" onclick="window.app.moveWishlistToCart('${prod.id}')">
              Move to Bag
            </button>
            <button class="btn-remove-item ms-auto" onclick="window.store.toggleWishlist('${prod.id}')">
              Remove
            </button>
          </div>
        </div>
      </div>
    `).join("");
  }

  // --- Render Quick View Modal ---
  renderQuickView(product) {
    const modalBody = document.getElementById("quickview-modal-body");
    if (!modalBody) return;

    window.activeQuickViewProduct = product;
    window.selectedQuickViewSize = product.sizes[0];
    window.selectedQuickViewColor = product.colors[0]?.name || "Default";
    window.selectedQuickViewQty = 1;

    modalBody.innerHTML = `
      <div class="row g-4">
        <!-- Gallery Column -->
        <div class="col-lg-6">
          <div class="position-relative">
            <img src="${product.images[0]}" id="qv-main-img" alt="${product.title}" class="quickview-img-main">
            ${product.badge ? `<span class="product-badge badge-new position-absolute top-0 start-0 m-3">${product.badge}</span>` : ""}
          </div>
          ${product.images.length > 1 ? `
            <div class="d-flex gap-2 mt-3 overflow-auto">
              ${product.images.map((img, idx) => `
                <img src="${img}" class="rounded border p-1" style="width: 64px; height: 80px; object-fit: cover; cursor: pointer;" 
                     onclick="document.getElementById('qv-main-img').src='${img}'" alt="angle-${idx}">
              `).join("")}
            </div>
          ` : ""}
        </div>

        <!-- Info Column -->
        <div class="col-lg-6 d-flex flex-column">
          <span class="product-brand mb-1">${product.brand}</span>
          <h2 class="h3 font-serif mb-2">${product.title}</h2>
          
          <div class="d-flex align-items-center gap-2 mb-3">
            <div class="star-gold">★★★★★</div>
            <span class="small font-weight-bold">${product.rating}</span>
            <span class="text-muted small">(${product.reviewCount} customer reviews)</span>
          </div>

          <div class="d-flex align-items-baseline gap-3 mb-3">
            <span class="h3 mb-0 font-weight-bold">${this.formatPrice(product.price)}</span>
            ${product.compareAtPrice ? `<span class="text-muted text-decoration-line-through">${this.formatPrice(product.compareAtPrice)}</span>` : ""}
            <span class="badge bg-success-subtle text-success ms-auto">In Stock (${product.stockCount} available)</span>
          </div>

          <p class="text-secondary small mb-4">${product.description}</p>

          <!-- Color Swatches -->
          <div class="mb-3">
            <label class="form-label small font-weight-bold text-uppercase tracking-wider">
              Color: <span id="qv-selected-color" class="text-primary">${product.colors[0]?.name}</span>
            </label>
            <div class="swatch-group">
              ${product.colors.map((color, idx) => `
                <button class="swatch-btn ${idx === 0 ? 'active' : ''}" 
                        style="background-color: ${color.hex};" 
                        title="${color.name}"
                        onclick="window.app.setQuickViewColor('${color.name}', this)"></button>
              `).join("")}
            </div>
          </div>

          <!-- Size Selectors -->
          <div class="mb-4">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <label class="form-label small font-weight-bold text-uppercase tracking-wider mb-0">
                Size: <span id="qv-selected-size" class="text-primary">${product.sizes[0]}</span>
              </label>
              <button class="btn btn-link p-0 small text-decoration-none" onclick="window.app.showSizeGuideAlert()">Size Guide</button>
            </div>
            <div class="size-pill-group">
              ${product.sizes.map((sz, idx) => `
                <button class="size-pill-btn ${idx === 0 ? 'active' : ''}" 
                        onclick="window.app.setQuickViewSize('${sz}', this)">
                  ${sz}
                </button>
              `).join("")}
            </div>
          </div>

          <!-- Add to Cart Action -->
          <div class="d-flex gap-3 mb-4">
            <div class="qty-control-group px-2">
              <button class="qty-btn" onclick="window.app.adjustQuickViewQty(-1)">−</button>
              <span class="qty-number" id="qv-qty-display">1</span>
              <button class="qty-btn" onclick="window.app.adjustQuickViewQty(1)">+</button>
            </div>
            <button class="btn btn-atelier-primary flex-grow-1" onclick="window.app.submitQuickViewAddToCart()">
              Add to Bag • <span id="qv-btn-price">${this.formatPrice(product.price)}</span>
            </button>
          </div>

          <!-- Accordion for Fabric Specs -->
          <div class="accordion accordion-flush mt-auto" id="qv-specs-accordion">
            <div class="accordion-item bg-transparent border-top">
              <h2 class="accordion-header">
                <button class="accordion-button collapsed bg-transparent text-primary py-2 px-0 small" type="button" data-bs-toggle="collapse" data-bs-target="#spec-fabric">
                  Fabric & Composition Details
                </button>
              </h2>
              <div id="spec-fabric" class="accordion-collapse collapse" data-bs-parent="#qv-specs-accordion">
                <div class="accordion-body px-0 text-secondary small">
                  <ul class="ps-3 mb-0">
                    ${product.fabricDetails.map(f => `<li>${f}</li>`).join("")}
                  </ul>
                </div>
              </div>
            </div>

            <div class="accordion-item bg-transparent border-top">
              <h2 class="accordion-header">
                <button class="accordion-button collapsed bg-transparent text-primary py-2 px-0 small" type="button" data-bs-toggle="collapse" data-bs-target="#spec-shipping">
                  Complimentary Shipping & 30-Day Returns
                </button>
              </h2>
              <div id="spec-shipping" class="accordion-collapse collapse" data-bs-parent="#qv-specs-accordion">
                <div class="accordion-body px-0 text-secondary small">
                  Orders over $150 qualify for complimentary priority express delivery. Returns are free and accepted within 30 days of purchase in original packaging.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // --- Render Order Receipt in Checkout Modal ---
  renderOrderReceipt(order) {
    const confirmationContainer = document.getElementById("checkout-step-3");
    if (!confirmationContainer) return;

    confirmationContainer.innerHTML = `
      <div class="text-center py-4">
        <div class="mb-3">
          <div class="pillar-icon-box mx-auto" style="width: 68px; height: 68px; font-size: 2rem;">
            ✓
          </div>
        </div>
        <span class="badge bg-success-subtle text-success text-uppercase tracking-wider px-3 py-1 mb-2">Order Confirmed</span>
        <h3 class="font-serif mb-2">Thank you, ${order.shipping.firstName}!</h3>
        <p class="text-secondary small mb-4">We've received your order and are preparing it for shipment from our atelier.</p>
        
        <div class="bg-surface-elevated border rounded-3 p-4 text-start mb-4">
          <div class="d-flex justify-content-between mb-2 small">
            <span class="text-muted">Order Identifier:</span>
            <strong class="font-monospace">${order.orderId}</strong>
          </div>
          <div class="d-flex justify-content-between mb-2 small">
            <span class="text-muted">Estimated Delivery:</span>
            <strong>${order.estimatedDelivery}</strong>
          </div>
          <div class="d-flex justify-content-between mb-3 small">
            <span class="text-muted">Shipping Destination:</span>
            <span>${order.shipping.address}, ${order.shipping.city}</span>
          </div>

          <hr class="my-2 border-subtle">

          <div class="py-2">
            ${order.items.map(item => `
              <div class="d-flex justify-content-between align-items-center mb-2 small">
                <div>
                  <strong>${item.title}</strong>
                  <span class="text-muted d-block">${item.selectedSize} / ${item.selectedColor} × ${item.quantity}</span>
                </div>
                <span>${this.formatPrice(item.price * item.quantity)}</span>
              </div>
            `).join("")}
          </div>

          <hr class="my-2 border-subtle">

          <div class="d-flex justify-content-between pt-2">
            <span class="font-weight-bold">Total Paid:</span>
            <span class="font-weight-bold h5 mb-0 text-accent">${this.formatPrice(order.total)}</span>
          </div>
        </div>

        <div class="d-flex justify-content-center gap-3">
          <button class="btn btn-atelier-primary" onclick="window.app.finishOrderAndClose()">
            Continue Shopping
          </button>
          <button class="btn btn-atelier-outline" onclick="window.print()">
            Print Receipt
          </button>
        </div>
      </div>
    `;
  }

  // --- Badge Counters ---
  updateBadges(cartCount, wishlistCount) {
    const cartBadges = document.querySelectorAll(".cart-count-badge");
    cartBadges.forEach(b => {
      b.textContent = cartCount;
      b.style.display = cartCount > 0 ? "inline-flex" : "none";
    });

    const wishlistBadges = document.querySelectorAll(".wishlist-count-badge");
    wishlistBadges.forEach(b => {
      b.textContent = wishlistCount;
      b.style.display = wishlistCount > 0 ? "inline-flex" : "none";
    });
  }

  // --- Floating Toast Notifications ---
  showToast({ title, message, type = "info" }) {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toastId = `toast-${Date.now()}`;
    const icon = type === "success" ? "✓" : (type === "error" ? "✕" : "ℹ");
    const accentClass = type === "success" ? "text-success" : (type === "error" ? "text-danger" : "text-warning");

    const toastEl = document.createElement("div");
    toastEl.className = "toast toast-atelier show mb-2";
    toastEl.id = toastId;
    toastEl.setAttribute("role", "alert");
    toastEl.innerHTML = `
      <div class="toast-header bg-transparent border-0 d-flex align-items-center pt-3 px-3">
        <span class="${accentClass} me-2 font-weight-bold">${icon}</span>
        <strong class="me-auto font-serif small">${title}</strong>
        <button type="button" class="btn-close btn-close-white ms-2" onclick="document.getElementById('${toastId}').remove()"></button>
      </div>
      <div class="toast-body pt-1 px-3 pb-3 text-secondary small">
        ${message}
      </div>
    `;

    container.appendChild(toastEl);
    setTimeout(() => {
      if (toastEl.parentNode) {
        toastEl.classList.remove("show");
        setTimeout(() => toastEl.remove(), 300);
      }
    }, 4000);
  }
}

// Global UI singleton
window.ui = new UIController();
