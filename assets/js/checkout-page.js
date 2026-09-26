// checkout.js (page): checkout form autofill, validation, order summary,
// place-order flow, and the order-complete screen for checkout.html.
// Reuses cart.js helpers and auth.js getCurrentUser. Simple test checkout:
// no funds check, every valid submission succeeds.

(function () {
  const CHECKOUT_STATE_KEY = 'deera_checkout';
  const ORDERS_KEY = 'deera_orders';

  function money(value) {
    return '$' + Number(value).toFixed(2);
  }

  // Required fields and their validation rules.
  const RULES = {
    'firstName': { required: true, msg: 'First name is required.' },
    'lastName': { required: true, msg: 'Last name is required.' },
    'email': { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, msg: 'Enter a valid email address.' },
    'phone': { required: true, pattern: /^[0-9+\-\s]{8,15}$/, msg: 'Enter a valid phone number (8 to 15 digits).' },
    'address': { required: true, msg: 'Address is required.' },
    'city': { required: true, msg: 'City is required.' },
    'postal': { required: true, pattern: /^\d{4,6}$/, msg: 'Enter a valid postal code (4 to 6 digits).' }
  };

  document.addEventListener('DOMContentLoaded', function () {
    const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    if (!user) {
      window.location.replace('login.html');
      return;
    }

    const form = document.getElementById('checkoutForm');
    if (!form) return;

    const layoutEl = document.getElementById('checkoutLayout');
    const emptyEl = document.getElementById('checkoutEmpty');
    const completeEl = document.getElementById('orderComplete');

    // Empty guard: nothing to buy means show the empty state.
    const cart = getCart();
    if (!cart.length) {
      layoutEl.hidden = true;
      emptyEl.hidden = false;
      return;
    }
    layoutEl.hidden = false;
    emptyEl.hidden = true;

    autofill(user);
    renderOrderSummary(cart);
    setupPaymentToggle();
    setupValidation();

    function autofill(user) {
      setVal('firstName', user.firstName);
      setVal('lastName', user.lastName);
      setVal('email', user.email);
    }

    function setVal(id, val) {
      const el = document.getElementById(id);
      if (el && val) el.value = val;
    }

    function renderOrderSummary(cart) {
      const listEl = document.getElementById('orderItems');
      listEl.innerHTML = cart.map(function (item) {
        const qty = Number(item.quantity) || 1;
        const line = (Number(item.price) || 0) * qty;
        const title = escapeHtml(item.title || 'Product');
        const thumb = escapeHtml(item.thumbnail || '');
        return '' +
          '<div class="order-item">' +
            '<img class="order-item__thumb" src="' + thumb + '" alt="' + title + '" ' +
              'onerror="this.style.visibility=\'hidden\'">' +
            '<div class="order-item__info">' +
              '<div class="order-item__name">' + title + '</div>' +
              '<div class="order-item__qty">Qty: ' + qty + '</div>' +
            '</div>' +
            '<div class="order-item__price">' + money(line) + '</div>' +
          '</div>';
      }).join('');

      // Totals come from the cart page. Recompute if the key is missing.
      let state = JSON.parse(localStorage.getItem(CHECKOUT_STATE_KEY) || 'null');
      if (!state) {
        const subtotal = cart.reduce(function (s, i) {
          return s + (Number(i.price) || 0) * (Number(i.quantity) || 0);
        }, 0);
        state = { subtotal: subtotal, shippingCost: 0, total: subtotal };
      }
      document.getElementById('coSubtotal').textContent = money(state.subtotal || 0);
      document.getElementById('coShipping').textContent = money(state.shippingCost || 0);
      document.getElementById('coTotal').textContent = money(state.total || 0);
    }

    function setupPaymentToggle() {
      const radios = form.querySelectorAll('input[name="payment"]');
      const panels = {
        card: document.getElementById('payCard'),
        cod: document.getElementById('payCod'),
        ewallet: document.getElementById('payEwallet')
      };
      function refresh() {
        const selected = form.querySelector('input[name="payment"]:checked');
        Object.keys(panels).forEach(function (key) {
          if (panels[key]) panels[key].classList.toggle('show', selected && selected.value === key);
        });
      }
      radios.forEach(function (r) { r.addEventListener('change', refresh); });
      refresh();
    }

    function validateField(id) {
      const rule = RULES[id];
      const el = document.getElementById(id);
      if (!rule || !el) return true;
      const val = el.value.trim();
      let ok = true;
      if (rule.required && !val) ok = false;
      else if (rule.pattern && !rule.pattern.test(val)) ok = false;

      const errEl = document.getElementById('err-' + id);
      if (ok) {
        el.classList.remove('invalid');
        if (errEl) { errEl.classList.remove('show'); errEl.textContent = ''; }
      } else {
        el.classList.add('invalid');
        if (errEl) { errEl.textContent = rule.msg; errEl.classList.add('show'); }
      }
      return ok;
    }

    function setupValidation() {
      Object.keys(RULES).forEach(function (id) {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('blur', function () { validateField(id); });
        el.addEventListener('input', function () {
          if (el.classList.contains('invalid')) validateField(id);
        });
      });
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        placeOrder();
      });
    }

    function placeOrder() {
      let firstInvalid = null;
      let allValid = true;
      Object.keys(RULES).forEach(function (id) {
        if (!validateField(id)) {
          allValid = false;
          if (!firstInvalid) firstInvalid = document.getElementById(id);
        }
      });
      if (!allValid) {
        if (firstInvalid) {
          firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
          firstInvalid.focus({ preventScroll: true });
        }
        return;
      }

      const cart = getCart();
      const state = JSON.parse(localStorage.getItem(CHECKOUT_STATE_KEY) || '{}');
      const paymentEl = form.querySelector('input[name="payment"]:checked');
      const payment = paymentEl ? paymentEl.value : 'card';
      let paymentDetail = null;
      if (payment === 'ewallet') {
        const wallet = form.querySelector('input[name="ewallet"]:checked');
        paymentDetail = wallet ? wallet.value : null;
      }

      const order = {
        orderId: 'DRA-' + Date.now(),
        createdAt: new Date().toISOString(),
        customer: {
          firstName: document.getElementById('firstName').value.trim(),
          lastName: document.getElementById('lastName').value.trim(),
          email: document.getElementById('email').value.trim(),
          phone: document.getElementById('phone').value.trim()
        },
        shipping: {
          address: document.getElementById('address').value.trim(),
          city: document.getElementById('city').value.trim(),
          postal: document.getElementById('postal').value.trim(),
          type: state.shippingType || 'free',
          cost: state.shippingCost || 0
        },
        payment: { method: payment, detail: paymentDetail },
        notes: document.getElementById('notes').value.trim(),
        items: cart,
        subtotal: state.subtotal || 0,
        total: state.total || 0
      };

      const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
      orders.unshift(order);
      localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));

      // Clear the cart via the shared helper so badge and drawer update too.
      if (typeof clearCart === 'function') {
        clearCart();
      } else {
        localStorage.removeItem('deera_cart');
      }
      localStorage.removeItem(CHECKOUT_STATE_KEY);

      showComplete(order);
    }

    function showComplete(order) {
      layoutEl.hidden = true;
      document.getElementById('completeOrderId').textContent = order.orderId;
      completeEl.hidden = false;
      completeEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
