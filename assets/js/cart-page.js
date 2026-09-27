(function () {
  const CHECKOUT_STATE_KEY = 'deera_checkout';

  const SHIPPING = {
    free: { label: 'Free shipping', cost: 0 },
    express: { label: 'Express shipping', cost: 15 },
    pickup: { label: 'Local pickup', cost: 5 }
  };

  function money(value) {
    return '$' + Number(value).toFixed(2);
  }

  document.addEventListener('DOMContentLoaded', function () {

    if (typeof getCurrentUser === 'function' && !getCurrentUser()) {
      window.location.replace('login.html');
      return;
    }

    const listEl = document.getElementById('cartLineList');
    if (!listEl) return;

    const layoutEl = document.getElementById('cartLayout');
    const emptyEl = document.getElementById('cartEmpty');
    const summaryEl = document.getElementById('cartSummaryPanel');

    let shippingType = 'free';

    render();

    listEl.addEventListener('click', function (e) {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const id = Number(btn.dataset.id);
      if (btn.dataset.action === 'increase') {
        updateCartItemQuantity(id, 1);
      } else if (btn.dataset.action === 'decrease') {
        updateCartItemQuantity(id, -1);
      } else if (btn.dataset.action === 'remove') {
        removeFromCart(id);
      }
      render();
    });

    summaryEl.addEventListener('change', function (e) {
      if (e.target.name === 'shipping') {
        shippingType = e.target.value;
        renderTotals();
      }
    });

    function computeTotals() {
      const { total: subtotal } = getCartSummary();
      const shippingCost = SHIPPING[shippingType].cost;
      return { subtotal: subtotal, shippingCost: shippingCost, total: subtotal + shippingCost };
    }

    function persistCheckoutState() {
      const t = computeTotals();
      localStorage.setItem(CHECKOUT_STATE_KEY, JSON.stringify({
        subtotal: t.subtotal,
        shippingType: shippingType,
        shippingCost: t.shippingCost,
        total: t.total
      }));
    }

    function render() {
      const cart = getCart();
      if (!cart.length) {
        layoutEl.hidden = true;
        emptyEl.hidden = false;
        localStorage.removeItem(CHECKOUT_STATE_KEY);
        return;
      }
      layoutEl.hidden = false;
      emptyEl.hidden = true;
      renderLines(cart);
      renderTotals();
    }

    function renderLines(cart) {
      listEl.innerHTML = cart.map(function (item) {
        const qty = Number(item.quantity) || 1;
        const price = Number(item.price) || 0;
        const line = price * qty;
        const title = escapeHtml(item.title || 'Product');
        const category = escapeHtml(item.category || '');
        const thumb = escapeHtml(item.thumbnail || '');
        return '' +
          '<div class="cart-line">' +
            '<div class="cart-line__product">' +
              '<img class="cart-line__thumb" src="' + thumb + '" alt="' + title + '" ' +
                'onerror="this.style.visibility=\'hidden\'">' +
              '<div>' +
                '<div class="cart-line__name">' + title + '</div>' +
                (category ? '<div class="cart-line__category">' + category + '</div>' : '') +
                '<button type="button" class="cart-line__remove" data-action="remove" data-id="' + item.id + '">' +
                  '&#10005; Remove</button>' +
              '</div>' +
            '</div>' +
            '<div class="qty-stepper">' +
              '<button type="button" class="qty-stepper__btn" data-action="decrease" data-id="' + item.id + '" aria-label="Decrease quantity">&minus;</button>' +
              '<span class="qty-stepper__val">' + qty + '</span>' +
              '<button type="button" class="qty-stepper__btn" data-action="increase" data-id="' + item.id + '" aria-label="Increase quantity">+</button>' +
            '</div>' +
            '<div class="cart-line__subtotal"><span class="cart-line__subtotal-label">Subtotal</span>' + money(line) + '</div>' +
            '<button type="button" class="cart-line__mobile-remove" data-action="remove" data-id="' + item.id + '" aria-label="Remove item">&#10005;</button>' +
          '</div>';
      }).join('');
    }

    function renderTotals() {
      const t = computeTotals();
      document.getElementById('sumSubtotal').textContent = money(t.subtotal);
      document.getElementById('sumShipping').textContent = money(t.shippingCost);
      document.getElementById('sumTotal').textContent = money(t.total);
      persistCheckoutState();
    }
  });

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
})();
