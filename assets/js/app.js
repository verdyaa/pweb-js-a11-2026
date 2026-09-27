/**
 * DEERA. E-Commerce - Main Homepage Controller
 * Implements:
 * - Dynamic product fetch from DummyJSON Products API
 * - Debounce search using Closure
 * - Category filter & sorting using Functional Programming
 * - Load More pagination using Array Slicing
 * - Product detail modal via Event Delegation on parent container
 * - Live promotional countdown timer
 * - Interactive carousel/tabs, mobile navigation, newsletter handling
 */

// Application State
const state = {
  allProducts: [],
  filteredProducts: [],
  categories: [],
  pageSize: 8,
  currentPage: 1,
  searchTerm: '',
  selectedCategory: 'all',
  selectedSort: 'default',
  isLoading: false,
  error: null
};

// ==========================================
// 1. CLOSURE-BASED DEBOUNCE IMPLEMENTATION
// ==========================================
/**
 * Creates a debounced function that delays invoking fn until after delayMs have elapsed.
 * Utilizes JavaScript Closures to maintain the timer state across keystrokes.
 * @param {Function} fn The function to debounce
 * @param {number} delayMs Delay in milliseconds
 * @returns {Function}
 */
function createDebounce(fn, delayMs = 350) {
  let timerId = null; // Enclosed private variable via closure

  return function (...args) {
    const context = this;
    if (timerId !== null) {
      clearTimeout(timerId);
    }
    timerId = setTimeout(() => {
      fn.apply(context, args);
      timerId = null;
    }, delayMs);
  };
}

// ==========================================
// 2. FETCH PRODUCTS FROM DUMMYJSON API
// ==========================================
/**
 * Fetch products dynamically from DummyJSON Products API with error handling
 */
async function fetchProducts() {
  const gridContainer = document.getElementById('newArrivalsGrid');
  const bestSellersGrid = document.getElementById('bestSellersGrid');
  const errorContainer = document.getElementById('productsErrorState');

  state.isLoading = true;
  state.error = null;
  renderLoadingState();

  try {
    // Fetch products from DummyJSON (default 30 items as specified in praktikum spec)
    const response = await fetch('https://dummyjson.com/products');

    if (!response.ok) {
      throw new Error(`Failed to fetch catalog from DummyJSON: HTTP status ${response.status}`);
    }

    const data = await response.json();
    state.allProducts = data.products || [];

    // Extract unique categories for filter dropdown using Functional Programming
    const uniqueCategories = Array.from(
      new Set(state.allProducts.map((p) => p.category).filter(Boolean))
    ).sort();
    state.categories = uniqueCategories;
    populateCategoryDropdown(uniqueCategories);

    // Initial render
    applyFilterAndSort();
    renderBestSellers();
  } catch (err) {
    console.error('Products Fetch Error:', err);
    state.error = err.message || 'Unable to connect to the catalog server.';
    renderErrorState(state.error);
  } finally {
    state.isLoading = false;
  }
}

/**
 * Render visual loading skeleton/state
 */
function renderLoadingState() {
  const gridContainer = document.getElementById('newArrivalsGrid');
  if (!gridContainer) return;

  gridContainer.innerHTML = Array(8)
    .fill(0)
    .map(
      () => `
      <div class="product-card skeleton-card">
        <div class="skeleton skeleton-img"></div>
        <div class="skeleton-meta">
          <div class="skeleton skeleton-text" style="width: 40%"></div>
          <div class="skeleton skeleton-text" style="width: 80%"></div>
          <div class="skeleton skeleton-text" style="width: 30%"></div>
        </div>
      </div>
    `
    )
    .join('');
}

/**
 * Render visual error banner with retry button
 * @param {string} message 
 */
function renderErrorState(message) {
  const gridContainer = document.getElementById('newArrivalsGrid');
  if (!gridContainer) return;

  gridContainer.innerHTML = `
    <div class="catalog-error-box">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#D32F2F" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <h3>Oops! Something went wrong</h3>
      <p>${message}</p>
      <button type="button" class="btn btn-primary btn-sm" onclick="fetchProducts()">Try Again</button>
    </div>
  `;
}

// ==========================================
// 3. FILTER, SORT & ARRAY SLICING PAGINATION
// ==========================================
/**
 * Populate category <select> options
 * @param {Array<string>} categories 
 */
function populateCategoryDropdown(categories) {
  const select = document.getElementById('categoryFilter');
  if (!select) return;

  // Keep 'all' option and append fetched categories
  const optionsHtml = ['<option value="all">All Categories</option>']
    .concat(
      categories.map((cat) => {
        const formatted = cat.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
        return `<option value="${cat}">${formatted}</option>`;
      })
    )
    .join('');

  select.innerHTML = optionsHtml;
}

/**
 * Apply filtering (Search + Category) and Sorting using Functional Programming
 */
function applyFilterAndSort() {
  let list = [...state.allProducts];

  // 1. Filter by Search Query (Product Name or Category)
  if (state.searchTerm.trim() !== '') {
    const q = state.searchTerm.toLowerCase().trim();
    list = list.filter((item) => {
      const matchTitle = item.title && item.title.toLowerCase().includes(q);
      const matchCat = item.category && item.category.toLowerCase().includes(q);
      const matchBrand = item.brand && item.brand.toLowerCase().includes(q);
      const matchDesc = item.description && item.description.toLowerCase().includes(q);
      return matchTitle || matchCat || matchBrand || matchDesc;
    });
  }

  // 2. Filter by Category Dropdown
  if (state.selectedCategory !== 'all') {
    list = list.filter((item) => item.category === state.selectedCategory);
  }

  // 3. Sort using Array.prototype.sort (Functional approach)
  switch (state.selectedSort) {
    case 'price-asc':
      list.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      list.sort((a, b) => b.price - a.price);
      break;
    case 'rating-desc':
      list.sort((a, b) => b.rating - a.rating);
      break;
    case 'name-asc':
      list.sort((a, b) => a.title.localeCompare(b.title));
      break;
    default:
      // Featured / default order
      break;
  }

  state.filteredProducts = list;
  state.currentPage = 1; // Reset to page 1 on filter/sort change
  renderProducts();
}

/**
 * Render the product cards using Array Slicing for Load More pagination
 */
function renderProducts() {
  const gridContainer = document.getElementById('newArrivalsGrid');
  const countLabel = document.getElementById('productsCountLabel');
  const loadMoreBtn = document.getElementById('loadMoreBtn');
  if (!gridContainer) return;

  const total = state.filteredProducts.length;
  const currentLimit = state.currentPage * state.pageSize;
  
  // Use array slicing to get current batch of products
  const slicedProducts = state.filteredProducts.slice(0, currentLimit);

  if (countLabel) {
    countLabel.textContent = `Showing ${slicedProducts.length} of ${total} products`;
  }

  if (total === 0) {
    gridContainer.innerHTML = `
      <div class="no-products-found">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#6C7275" stroke-width="1.5">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <h4>No products found</h4>
        <p>Try adjusting your search query or category filters.</p>
        <button type="button" class="btn btn-outline btn-sm" onclick="resetFilters()">Reset Filters</button>
      </div>
    `;
    if (loadMoreBtn) loadMoreBtn.style.display = 'none';
    return;
  }

  gridContainer.innerHTML = slicedProducts
    .map((product) => generateProductCardHtml(product, 'NEW'))
    .join('');

  // Handle Load More Button visibility
  if (loadMoreBtn) {
    if (currentLimit < total) {
      loadMoreBtn.style.display = 'inline-block';
      loadMoreBtn.textContent = `Load More (${total - currentLimit} remaining)`;
    } else {
      loadMoreBtn.style.display = 'none';
    }
  }
}

/**
 * Render Best Sellers section with high-rated products
 */
function renderBestSellers() {
  const bestGrid = document.getElementById('bestSellersGrid');
  if (!bestGrid) return;

  // Pick top 8 products sorted by rating & discount
  const topProducts = [...state.allProducts]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 8);

  bestGrid.innerHTML = topProducts
    .map((product) => generateProductCardHtml(product, 'HOT'))
    .join('');
}

/**
 * Generate Product Card HTML template
 * @param {Object} product 
 * @param {string} defaultBadge 
 * @returns {string}
 */
function generateProductCardHtml(product, defaultBadge = 'NEW') {
  const discount = Math.round(product.discountPercentage || 0);
  const badgeText = discount > 15 ? `-${discount}%` : defaultBadge;
  const originalPrice = (product.price / (1 - (discount / 100))).toFixed(2);
  const starsHtml = renderStarRating(product.rating);

  return `
    <article class="product-card" data-product-id="${product.id}">
      <div class="product-img-box">
        <span class="product-badge ${badgeText.startsWith('-') ? 'badge-discount' : 'badge-new'}">${badgeText}</span>
        <button type="button" class="btn-wishlist" title="Add to Wishlist" aria-label="Add to Wishlist" onclick="toggleWishlist(event, ${product.id})">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </button>
        <img 
          src="${product.thumbnail}" 
          alt="${escapeHtml(product.title)}" 
          loading="lazy" 
          class="product-thumb"
          onerror="this.src='https://dummyjson.com/image/300x300?text=DEERA+Product'"
        />
        <button type="button" class="btn-add-cart" onclick="handleCardAddToCart(event, ${product.id})">
          Add to cart
        </button>
      </div>
      <div class="product-info">
        <div class="product-rating">
          <div class="stars">${starsHtml}</div>
          <span class="rating-num">(${product.rating.toFixed(1)})</span>
        </div>
        <h3 class="product-title" title="${escapeHtml(product.title)}">${escapeHtml(product.title)}</h3>
        <div class="product-price-row">
          <span class="price-current">$${product.price.toFixed(2)}</span>
          ${discount > 5 ? `<span class="price-original">$${originalPrice}</span>` : ''}
        </div>
        <span class="product-category-tag">${escapeHtml(product.category)}</span>
      </div>
    </article>
  `;
}

/**
 * Generate 5-star rating SVG icons
 * @param {number} rating 
 * @returns {string}
 */
function renderStarRating(rating) {
  const rounded = Math.round(rating);
  let stars = '';
  for (let i = 1; i <= 5; i++) {
    const isFilled = i <= rounded;
    stars += `
      <svg class="star-icon ${isFilled ? 'filled' : 'empty'}" width="14" height="14" viewBox="0 0 24 24" fill="${isFilled ? '#343839' : 'none'}" stroke="#343839" stroke-width="2">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
      </svg>
    `;
  }
  return stars;
}

// ==================================================
// 4. EVENT DELEGATION FOR PRODUCT DETAIL MODAL
// ==================================================
/**
 * Setup Event Delegation on the product grid containers
 */
function setupEventDelegation() {
  const containers = [
    document.getElementById('newArrivalsGrid'),
    document.getElementById('bestSellersGrid')
  ];

  containers.forEach((container) => {
    if (!container) return;

    container.addEventListener('click', (event) => {
      // Ignore clicks on Add to Cart or Wishlist buttons
      if (
        event.target.closest('.btn-add-cart') ||
        event.target.closest('.btn-wishlist') ||
        event.target.closest('button')
      ) {
        return;
      }

      // Find closest product card element
      const card = event.target.closest('.product-card');
      if (card && card.dataset.productId) {
        const productId = Number(card.dataset.productId);
        openProductModal(productId);
      }
    });
  });
}

/**
 * Open Product Detail Modal populated with full product details
 * @param {number} productId 
 */
function openProductModal(productId) {
  const product = state.allProducts.find((p) => p.id === productId);
  if (!product) return;

  const modal = document.getElementById('productDetailModal');
  const modalContent = document.getElementById('modalProductBody');
  if (!modal || !modalContent) return;

  const discount = Math.round(product.discountPercentage || 0);
  const originalPrice = (product.price / (1 - (discount / 100))).toFixed(2);
  const starsHtml = renderStarRating(product.rating);

  modalContent.innerHTML = `
    <div class="modal-product-layout">
      <div class="modal-gallery">
        <div class="modal-main-image-wrap">
          <img 
            id="modalMainImg" 
            src="${product.thumbnail}" 
            alt="${escapeHtml(product.title)}"
          />
        </div>
        ${
          product.images && product.images.length > 1
            ? `
          <div class="modal-thumbnails">
            ${product.images
              .slice(0, 4)
              .map(
                (imgUrl, idx) => `
              <button type="button" class="modal-thumb-btn ${idx === 0 ? 'active' : ''}" onclick="changeModalImage('${imgUrl}', this)">
                <img src="${imgUrl}" alt="Thumbnail ${idx + 1}" />
              </button>
            `
              )
              .join('')}
          </div>
        `
            : ''
        }
      </div>

      <div class="modal-details">
        <div class="modal-rating-row">
          <div class="stars">${starsHtml}</div>
          <span class="rating-text">${product.rating.toFixed(1)} / 5.0</span>
          <span class="review-count">(${product.reviews ? product.reviews.length : 12} reviews)</span>
        </div>

        <h2 class="modal-product-title">${escapeHtml(product.title)}</h2>
        
        <div class="modal-price-box">
          <span class="modal-price-current">$${product.price.toFixed(2)}</span>
          ${discount > 5 ? `<span class="modal-price-original">$${originalPrice}</span>` : ''}
          ${discount > 0 ? `<span class="badge-discount">-${discount}% OFF</span>` : ''}
        </div>

        <p class="modal-description">${escapeHtml(product.description)}</p>

        <div class="modal-meta-grid">
          <div class="meta-item">
            <span class="meta-label">Brand:</span>
            <span class="meta-val">${escapeHtml(product.brand || 'DEERA Select')}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Category:</span>
            <span class="meta-val">${escapeHtml(product.category)}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Availability:</span>
            <span class="meta-val in-stock">
              <span class="stock-dot"></span> In Stock (${product.stock} units)
            </span>
          </div>
          <div class="meta-item">
            <span class="meta-label">SKU:</span>
            <span class="meta-val">${product.sku || 'DRA-' + product.id}</span>
          </div>
          ${
            product.shippingInformation
              ? `
            <div class="meta-item">
              <span class="meta-label">Shipping:</span>
              <span class="meta-val">${escapeHtml(product.shippingInformation)}</span>
            </div>
          `
              : ''
          }
        </div>

        <div class="modal-purchase-controls">
          <div class="modal-qty-picker">
            <button type="button" class="qty-btn" onclick="adjustModalQty(-1)">−</button>
            <input type="number" id="modalQtyInput" value="1" min="1" max="${product.stock}" readonly />
            <button type="button" class="qty-btn" onclick="adjustModalQty(1)">+</button>
          </div>
          <button type="button" class="btn btn-primary btn-modal-cart" onclick="addModalProductToCart(${product.id})">
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  `;

  // Display modal
  if (typeof modal.showModal === 'function') {
    modal.showModal();
  } else {
    modal.classList.add('open');
  }
  document.body.style.overflow = 'hidden';
}

/**
 * Close Product Detail Modal
 */
function closeProductModal() {
  const modal = document.getElementById('productDetailModal');
  if (!modal) return;

  if (typeof modal.close === 'function') {
    modal.close();
  } else {
    modal.classList.remove('open');
  }
  document.body.style.overflow = '';
}

/**
 * Change active image in modal gallery
 */
function changeModalImage(src, btn) {
  const mainImg = document.getElementById('modalMainImg');
  if (mainImg) {
    mainImg.src = src;
  }
  document.querySelectorAll('.modal-thumb-btn').forEach((b) => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
}

/**
 * Adjust quantity inside modal
 */
function adjustModalQty(delta) {
  const input = document.getElementById('modalQtyInput');
  if (!input) return;
  let val = parseInt(input.value, 10) || 1;
  val = Math.max(1, Math.min(val + delta, 99));
  input.value = val;
}

/**
 * Add product to cart from inside the modal
 */
function addModalProductToCart(productId) {
  const product = state.allProducts.find((p) => p.id === productId);
  const input = document.getElementById('modalQtyInput');
  const qty = input ? parseInt(input.value, 10) : 1;

  if (product && typeof addToCart === 'function') {
    addToCart(product, qty);
    closeProductModal();
  }
}

// ==========================================
// 5. CARD ACTION HANDLERS
// ==========================================
/**
 * Handle Add to Cart click from product card
 */
function handleCardAddToCart(event, productId) {
  event.stopPropagation();
  const product = state.allProducts.find((p) => p.id === productId);
  if (product && typeof addToCart === 'function') {
    addToCart(product, 1);
  }
}

/**
 * Handle Wishlist toggle
 */
function toggleWishlist(event, productId) {
  event.stopPropagation();
  const btn = event.currentTarget;
  const isFilled = btn.classList.toggle('wishlist-active');
  const svg = btn.querySelector('svg');
  if (svg) {
    svg.setAttribute('fill', isFilled ? '#FF4848' : 'none');
    svg.setAttribute('stroke', isFilled ? '#FF4848' : 'currentColor');
  }
  if (typeof showToast === 'function') {
    showToast(isFilled ? 'Added to your Wishlist!' : 'Removed from Wishlist.');
  }
}

/**
 * Reset all filters to default state
 */
function resetFilters() {
  state.searchTerm = '';
  state.selectedCategory = 'all';
  state.selectedSort = 'default';

  const searchInput = document.getElementById('productSearchInput');
  const catFilter = document.getElementById('categoryFilter');
  const sortFilter = document.getElementById('sortBy');

  if (searchInput) searchInput.value = '';
  if (catFilter) catFilter.value = 'all';
  if (sortFilter) sortFilter.value = 'default';

  applyFilterAndSort();
}

// ==========================================
// 6. PROMOTION COUNTDOWN TIMER
// ==========================================
/**
 * Initialize promotional offer countdown timer
 */
function initCountdownTimer() {
  const daysEl = document.getElementById('timerDays');
  const hoursEl = document.getElementById('timerHours');
  const minutesEl = document.getElementById('timerMinutes');
  const secondsEl = document.getElementById('timerSeconds');

  if (!daysEl || !hoursEl || !minutesEl || !secondsEl) return;

  // Set target expiry date (e.g. 2 days, 12 hours from now)
  const targetTime = Date.now() + (2 * 24 * 60 * 60 + 12 * 60 * 60 + 45 * 60 + 5) * 1000;

  function update() {
    const diff = targetTime - Date.now();
    if (diff <= 0) {
      daysEl.textContent = '00';
      hoursEl.textContent = '00';
      minutesEl.textContent = '00';
      secondsEl.textContent = '00';
      return;
    }

    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const m = Math.floor((diff / (1000 * 60)) % 60);
    const s = Math.floor((diff / 1000) % 60);

    daysEl.textContent = String(d).padStart(2, '0');
    hoursEl.textContent = String(h).padStart(2, '0');
    minutesEl.textContent = String(m).padStart(2, '0');
    secondsEl.textContent = String(s).padStart(2, '0');
  }

  update();
  setInterval(update, 1000);
}

// ==========================================
// 7. UTILITY FUNCTIONS & EVENT LISTENERS
// ==========================================
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Initialize event listeners on page load
 */
document.addEventListener('DOMContentLoaded', () => {
  // 1. Initial product fetch
  fetchProducts();

  // 2. Setup Event Delegation
  setupEventDelegation();

  // 3. Search with Debounce (Closure technique)
  const searchInput = document.getElementById('productSearchInput');
  if (searchInput) {
    const debouncedSearch = createDebounce((query) => {
      state.searchTerm = query;
      applyFilterAndSort();
    }, 300);

    searchInput.addEventListener('input', (e) => {
      debouncedSearch(e.target.value);
    });
  }

  // 4. Category Filter listener
  const categoryFilter = document.getElementById('categoryFilter');
  if (categoryFilter) {
    categoryFilter.addEventListener('change', (e) => {
      state.selectedCategory = e.target.value;
      applyFilterAndSort();
    });
  }

  // 5. Sorting listener
  const sortBy = document.getElementById('sortBy');
  if (sortBy) {
    sortBy.addEventListener('change', (e) => {
      state.selectedSort = e.target.value;
      applyFilterAndSort();
    });
  }

  // 6. Load More pagination listener
  const loadMoreBtn = document.getElementById('loadMoreBtn');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      state.currentPage += 1;
      renderProducts();
    });
  }

  // 7. Modal close handlers (Light dismiss, Escape, Backdrop)
  const modal = document.getElementById('productDetailModal');
  const modalCloseBtn = document.getElementById('closeModalBtn');
  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeProductModal);

  if (modal) {
    // Backdrop click dismiss for <dialog>
    modal.addEventListener('click', (e) => {
      const rect = modal.getBoundingClientRect();
      const isInDialog =
        rect.top <= e.clientY &&
        e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX &&
        e.clientX <= rect.left + rect.width;
      if (!isInDialog) {
        closeProductModal();
      }
    });

    modal.addEventListener('cancel', () => {
      document.body.style.overflow = '';
    });
  }

  // 8. Top Announcement Bar dismissal
  const announceCloseBtn = document.getElementById('closeAnnouncementBtn');
  const announcementBar = document.getElementById('announcementBar');
  if (announceCloseBtn && announcementBar) {
    announceCloseBtn.addEventListener('click', () => {
      announcementBar.style.display = 'none';
    });
  }

  // 9. Mobile Navigation Drawer toggle
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const mobileNavDrawer = document.getElementById('mobileNavDrawer');
  const mobileNavClose = document.getElementById('mobileNavClose');
  const mobileNavOverlay = document.getElementById('mobileNavOverlay');

  function openMobileNav() {
    if (mobileNavDrawer && mobileNavOverlay) {
      mobileNavDrawer.classList.add('open');
      mobileNavOverlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeMobileNav() {
    if (mobileNavDrawer && mobileNavOverlay) {
      mobileNavDrawer.classList.remove('open');
      mobileNavOverlay.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  if (mobileMenuToggle) mobileMenuToggle.addEventListener('click', openMobileNav);
  if (mobileNavClose) mobileNavClose.addEventListener('click', closeMobileNav);
  if (mobileNavOverlay) mobileNavOverlay.addEventListener('click', closeMobileNav);
});
