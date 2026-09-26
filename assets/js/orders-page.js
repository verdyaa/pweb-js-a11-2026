// orders-page.js: order history for orders.html.
// Reads deera_orders (written by checkout) and renders each order newest-first.
// Protected page: redirects to login when there is no session.

(function () {
  const ORDERS_KEY = 'deera_orders';

  const SHIPPING_LABEL = {
    free: 'Free shipping',
    express: 'Express shipping',
    pickup: 'Local pickup'
  };
  const PAYMENT_LABEL = {
    card: 'Credit / Debit Card',
    cod: 'Cash on Delivery',
    ewallet: 'E-Wallet'
  };

  function money(value) {
    return '$' + Number(value).toFixed(2);
  }

  // Render an ISO timestamp as a readable local date.
  function formatDate(iso) {
    const d = new Date(iso);
    if (isNaN(d)) return '';
    return d.toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (typeof getCurrentUser === 'function' && !getCurrentUser()) {
      window.location.replace('login.html');
      return;
    }

    const listEl = document.getElementById('ordersList');
    if (!listEl) return;
    const emptyEl = document.getElementById('ordersEmpty');

    const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
    if (!orders.length) {
      listEl.hidden = true;
      emptyEl.hidden = false;
      return;
    }
    listEl.hidden = false;
    emptyEl.hidden = true;

    listEl.innerHTML = orders.map(renderOrderCard).join('');
  });

  function renderOrderCard(order) {
    const items = Array.isArray(order.items) ? order.items : [];
    const itemCount = items.reduce(function (s, i) { return s + (Number(i.quantity) || 0); }, 0);
    const payment = PAYMENT_LABEL[order.payment && order.payment.method] || 'Payment';
    const shipType = order.shipping && order.shipping.type;
    const shipLabel = SHIPPING_LABEL[shipType] || 'Shipping';

    const itemsHtml = items.map(function (item) {
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

    return '' +
      '<article class="order-card">' +
        '<div class="order-card__head">' +
          '<div class="order-card__meta">' +
            '<span class="order-card__id">' + escapeHtml(order.orderId || '') + '</span>' +
            '<span class="order-card__date">' + escapeHtml(formatDate(order.createdAt)) + ' &middot; ' + itemCount + ' item(s)</span>' +
          '</div>' +
          '<span class="order-card__status"><span class="order-card__status-dot"></span> Confirmed</span>' +
        '</div>' +
        '<div class="order-card__body">' + itemsHtml + '</div>' +
        '<div class="order-card__foot">' +
          '<span class="order-card__ship">' + shipLabel + ' &middot; ' + escapeHtml(payment) + '</span>' +
          '<span class="order-card__total">Total ' + money(order.total || 0) + '</span>' +
        '</div>' +
      '</article>';
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
})();
