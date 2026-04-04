/* ============================================================
   PRECISION POS — POS TERMINAL RENDERER
   ============================================================ */

let currentFilter = '';
let txnCounter = 8924;
let discountAmount = 0;

document.addEventListener('DOMContentLoaded', () => {
  initTitlebar();
  initNav('pos');
  renderProducts();
  renderLedger();

  document.getElementById('product-search').addEventListener('input', () => {
    renderProducts(document.getElementById('product-search').value);
  });

  Store.cart.onChange(() => renderLedger());
});

// Re-render when currency changes
window.addEventListener('currencyUpdated', () => {
  renderProducts();
  renderLedger();
});

// Barcode scanner integration
window.addEventListener('barcodeScanned', (e) => {
  const code = e.detail.code;
  const product = Store.products.find(p => p.sku === code || p.id === code);
  if (product) {
    Store.cart.add(product);
    console.log(`[POS] Added ${product.name} via Scanner.`);
  } else {
    alert(`[Scanner] Product not found for code: ${code}`);
  }
});

// ── PRODUCTS ────────────────────────────────────────────────

function renderProducts(filter = '') {
  const grid = document.getElementById('product-grid');
  if (!grid) return;

  const q = filter.toLowerCase().trim();
  const items = Store.products.filter(p =>
    !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
  );

  if (items.length === 0) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:var(--space-12);color:var(--on-surface-variant);">
        <span class="material-symbols-rounded" style="font-size:48px;display:block;opacity:0.3;margin-bottom:8px;">search_off</span>
        No products found for "${filter}"
      </div>`;
    return;
  }

  grid.innerHTML = items.map(p => `
    <div
      class="product-card ${p.stock === 0 ? 'out-of-stock' : ''} fade-in-up"
      onclick="addToCart('${p.id}')"
      title="${p.name} — ${p.sku}"
    >
      <div class="product-emoji">${p.emoji}</div>
      <div class="product-name">${p.name}</div>
      <div class="product-price">${Currency.format(p.price)}</div>
      <div class="product-stock ${p.stock < 10 && p.stock > 0 ? 'low' : ''}">
        ${p.stock === 0 ? 'Out of stock' : p.stock < 10 ? `⚠ Only ${p.stock} left` : `${p.stock} in stock`}
      </div>
    </div>
  `).join('');
}

function addToCart(productId) {
  const success = Store.cart.add(productId);
  if (!success) showToast('Item is out of stock');
}

// ── LEDGER ──────────────────────────────────────────────────

function renderLedger() {
  const items = Store.cart.items();
  const itemsContainer = document.getElementById('ledger-items');
  const checkoutBtn = document.getElementById('checkout-btn');
  if (!itemsContainer) return;

  if (items.length === 0) {
    itemsContainer.innerHTML = `
      <div class="ledger-empty">
        <span class="material-symbols-rounded">receipt_long</span>
        <span>No items added yet.<br/>Tap a product to begin.</span>
      </div>`;
    if (checkoutBtn) checkoutBtn.disabled = true;
    updateTotals(0);
    return;
  }

  itemsContainer.innerHTML = items.map(item => `
    <div class="ledger-item" id="ledger-item-${item.productId}">
      <span class="ledger-item-emoji">${item.emoji}</span>
      <div class="ledger-item-info">
        <div class="ledger-item-name">${item.name}</div>
        <div class="ledger-item-price">${Currency.format(item.price)} ea.</div>
      </div>
      <div class="qty-controls">
        <button class="qty-btn" onclick="changeQty('${item.productId}', -1)">−</button>
        <span class="qty-value">${item.qty}</span>
        <button class="qty-btn" onclick="changeQty('${item.productId}', 1)">+</button>
      </div>
    </div>
  `).join('');

  if (checkoutBtn) checkoutBtn.disabled = false;
  updateTotals(Store.cart.subtotal());
}

function changeQty(productId, delta) {
  const item = Store.cart.items().find(i => i.productId === productId);
  if (item) Store.cart.updateQty(productId, item.qty + delta);
}

function updateTotals(rawSubtotal) {
  let promoData = { discount: 0, codes: [] };
  
  // Natively hook into Promotion Engine if it is injected
  if (typeof PromotionEngine !== 'undefined') {
    promoData = PromotionEngine.calculateDiscounts(Store.cart.items());
  }

  // Fallback map for strictly manual codes
  discountAmount = promoData.discount; 
  
  const tax = rawSubtotal * 0.08;
  const total = rawSubtotal + tax - discountAmount;

  const fmt = (n) => Currency.format(Math.max(0, n));
  const el = (id) => document.getElementById(id);

  if (el('subtotal'))    el('subtotal').textContent    = fmt(rawSubtotal);
  if (el('tax-amount'))  el('tax-amount').textContent  = fmt(tax);
  if (el('grand-total')) el('grand-total').textContent = fmt(total);

  // Manipulate Discount DOM actively
  const line = document.getElementById('discount-line');
  const val  = document.getElementById('discount-val');
  if (discountAmount > 0) {
    if (line) line.style.display = 'flex';
    if (val) val.textContent = '−' + fmt(discountAmount);
  } else {
    if (line) line.style.display = 'none';
  }
}

function applyDiscount() {
  const code = document.getElementById('discount-input').value.trim().toUpperCase();
  // We can pass manual code to engine, but since the engine automatically checks 'Active' campaigns, 
  // It is inherently already calculated if Active!
  alert(`If campaign ${code} is Active in Promotions, it is automatically applied.`);
}

function checkout() {
  const cartItems = Store.cart.items();
  if (cartItems.length === 0) return;

  const subtotal = Store.cart.subtotal();
  const tax = subtotal * 0.08;
  const total = subtotal + tax - discountAmount;

  // 1. Record in Central Store (Handles Stock, Transactions, P&L)
  const txnId = Store.recordTransaction(cartItems, subtotal, tax, discountAmount);

  // 2. Alert Other Modules (Sync)
  window.dispatchEvent(new CustomEvent('saleCompleted', { 
    detail: { txnId, items: cartItems, total, tax, discount: discountAmount } 
  }));

  // 3. UI Update
  showToast(`✓ Sale ${txnId} completed — ${Currency.format(total)} charged`);
  
  // Set next display ID (approximate)
  const nextId = parseInt(txnId.split('-')[1]) + 1;
  document.getElementById('txn-id').textContent = String(nextId).padStart(6, '0');

  // Reset & Refresh
  discountAmount = 0;
  const line = document.getElementById('discount-line');
  if (line) line.style.display = 'none';
  Store.cart.clear();
  renderProducts(); // Refresh stock counts in grid
}

function clearCart() {
  discountAmount = 0;
  const line = document.getElementById('discount-line');
  if (line) line.style.display = 'none';
  Store.cart.clear();
}

// ── TOAST ────────────────────────────────────────────────────

function showToast(message) {
  const toast = document.getElementById('toast');
  const msg   = document.getElementById('toast-msg');
  if (!toast || !msg) return;
  msg.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2800);
}
