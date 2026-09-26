/**
 * DEERA. E-Commerce - Cart Management & LocalStorage CRUD
 * Provides full CRUD operations for the shopping cart persisted in LocalStorage,
 * badge count updates, and interactive slide-out cart drawer.
 */

const CART_STORAGE_KEY = 'deera_cart';

/**
 * Retrieve current cart from LocalStorage (Read)
 * @returns {Array} Array of cart items
 */
function getCart() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error reading cart from localStorage:', e);
    return [];
  }
}

/**
 * Save cart to LocalStorage and notify listeners (Create / Update)
 * @param {Array} cart 
 */
function saveCart(cart) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    updateCartBadge();
    renderCartDrawer();
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { cart } }));
  } catch (e) {
    console.error('Error saving cart to localStorage:', e);
  }
}

/**
 * Add an item to cart (Create or Update)
 * @param {Object} product 
 * @param {number} quantity 
 */
function addToCart(product, quantity = 1) {
  if (!product || !product.id) return;

  const cart = getCart();
  const existingIndex = cart.findIndex((item) => Number(item.id) === Number(product.id));

  if (existingIndex > -1) {
    cart[existingIndex].quantity += quantity;
  } else {
    cart.push({
      id: Number(product.id),
      title: product.title,
      price: Number(product.price),
      discountPercentage: Number(product.discountPercentage || 0),
      thumbnail: product.thumbnail || (product.images && product.images[0]) || 'https://via.placeholder.com/150',
      category: product.category || 'General',
      quantity: quantity
    });
  }

  saveCart(cart);
  showToast(`Added "${product.title}" to cart!`);
}

/**
 * Update quantity for an item (Update)
 * @param {number} productId 
 * @param {number} delta 
 */
function updateCartItemQuantity(productId, delta) {
  let cart = getCart();
  const item = cart.find((i) => Number(i.id) === Number(productId));

  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) {
    cart = cart.filter((i) => Number(i.id) !== Number(productId));
    showToast(`Removed "${item.title}" from cart.`);
  }

  saveCart(cart);
}

/**
 * Remove an item from the cart (Delete)
 * @param {number} productId 
 */
function removeFromCart(productId) {
  const cart = getCart();
  const item = cart.find((i) => Number(i.id) === Number(productId));
  const newCart = cart.filter((i) => Number(i.id) !== Number(productId));
  saveCart(newCart);
  
  if (item) {
    showToast(`Removed "${item.title}" from cart.`);
  }
}

/**
 * Clear all items from cart (Delete all)
 */
function clearCart() {
  localStorage.removeItem(CART_STORAGE_KEY);
  updateCartBadge();
  renderCartDrawer();
  window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { cart: [] } }));
}

/**
 * Calculate totals: item count and total monetary price
 * @returns {{ count: number, total: number }}
 */
function getCartSummary() {
  const cart = getCart();
  const count = cart.reduce((acc, item) => acc + (item.quantity || 0), 0);
  const total = cart.reduce((acc, item) => acc + ((item.price || 0) * (item.quantity || 0)), 0);
  return { count, total };
}

/**
 * Update cart badge icons in header/navbar
 */
function updateCartBadge() {
  const { count } = getCartSummary();
  const badges = document.querySelectorAll('.cart-badge');
  badges.forEach((badge) => {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline-flex' : 'none';
  });
}

/**
 * Render the slide-out Cart Drawer content
 */
function renderCartDrawer() {
  const drawerBody = document.getElementById('cartDrawerBody');
  const drawerFooter = document.getElementById('cartDrawerFooter');
  if (!drawerBody) return;

  const cart = getCart();
  const { total } = getCartSummary();

  if (cart.length === 0) {
    drawerBody.innerHTML = `
      <div class="cart-empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#6C7275" stroke-width="1.5">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <path d="M16 10a4 4 0 0 1-8 0"></path>
        </svg>
        <p class="empty-title">Your shopping cart is empty</p>
        <p class="empty-desc">Discover our collection and add your favorite audio gear!</p>
        <a href="#newArrivals" class="btn btn-primary btn-sm" onclick="closeCartDrawer()">Explore Products</a>
      </div>
    `;
    if (drawerFooter) {
      drawerFooter.style.display = 'none';
    }
    return;
  }

  drawerBody.innerHTML = `
    <div class="cart-items-list">
      ${cart.map((item) => `
        <div class="cart-item-row" data-cart-id="${item.id}">
          <div class="cart-item-img-wrap">
            <img src="${item.thumbnail}" alt="${item.title}" loading="lazy" />
          </div>
          <div class="cart-item-details">
            <h4 class="cart-item-title">${item.title}</h4>
            <span class="cart-item-category">${item.category}</span>
            <div class="cart-item-price">$${(item.price).toFixed(2)}</div>
            <div class="cart-qty-ctrl">
              <button type="button" class="qty-btn" onclick="updateCartItemQuantity(${item.id}, -1)" title="Decrease quantity">−</button>
              <span class="qty-val">${item.quantity}</span>
              <button type="button" class="qty-btn" onclick="updateCartItemQuantity(${item.id}, 1)" title="Increase quantity">+</button>
            </div>
          </div>
          <button type="button" class="cart-item-remove-btn" onclick="removeFromCart(${item.id})" title="Remove item" aria-label="Remove item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      `).join('')}
    </div>
  `;

  if (drawerFooter) {
    drawerFooter.style.display = 'block';
    drawerFooter.innerHTML = `
      <div class="cart-subtotal-row">
        <span>Subtotal</span>
        <span class="cart-subtotal-price">$${total.toFixed(2)}</span>
      </div>
      <p class="cart-shipping-notice">Shipping and taxes calculated at checkout.</p>
      <div class="cart-drawer-actions">
        <a href="cart.html" class="btn btn-primary w-100" id="checkoutDrawerBtn">View cart ($${total.toFixed(2)})</a>
      </div>
    `;
  }
}

/**
 * Open Cart Drawer
 */
function openCartDrawer() {
  const drawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('cartDrawerOverlay');
  if (drawer && overlay) {
    renderCartDrawer();
    drawer.classList.add('open');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

/**
 * Close Cart Drawer
 */
function closeCartDrawer() {
  const drawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('cartDrawerOverlay');
  if (drawer && overlay) {
    drawer.classList.remove('open');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }
}

/**
 * Toast Notification system
 * @param {string} message 
 */
function showToast(message) {
  let toastContainer = document.getElementById('deeraToastContainer');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'deeraToastContainer';
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = 'toast-msg';
  toast.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38CB89" stroke-width="2.5">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
    <span>${message}</span>
  `;

  toastContainer.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.add('visible');
  });

  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 2800);
}

// Global initialization
document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();

  // Attach drawer open listeners
  document.querySelectorAll('.open-cart-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openCartDrawer();
    });
  });

  const closeBtn = document.getElementById('closeCartDrawerBtn');
  const overlay = document.getElementById('cartDrawerOverlay');
  if (closeBtn) closeBtn.addEventListener('click', closeCartDrawer);
  if (overlay) overlay.addEventListener('click', closeCartDrawer);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeCartDrawer();
    }
  });
});
