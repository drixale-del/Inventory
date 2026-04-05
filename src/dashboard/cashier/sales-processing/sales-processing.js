/* ============================================================
   sales-processing.js — POS Logic & Terminal Engine
   Handles cart, barcode scans, tax, and payments.
   ============================================================ */

let cart = [];
let taxRate = 0.08; // 8% default
let currentDiscount = 0;
let selectedPaymentMethod = 'cash';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Core Framework Init
    if (typeof initNav === 'function') initNav('pos');
    if (typeof initWindowControls === 'function') initWindowControls();

    // 2. Load Products & Listeners
    renderProductGrid();
    initSearch();
    initBarcodeScanner();

    // 3. UI Update
    updateCartUI();
});

/**
 * renderProductGrid
 * Populates the product selection panel.
 */
function renderProductGrid(filterText = '') {
    const grid = document.getElementById('product-grid');
    if (!grid) return;

    const products = Store.products.filter(p => 
        p.name.toLowerCase().includes(filterText.toLowerCase()) ||
        p.id.includes(filterText)
    );

    grid.innerHTML = products.map(p => `
        <div class="product-card fade-in-up" onclick="addToCart('${p.id}')">
            <div class="p-name">${p.name}</div>
            <div class="p-price">${Currency.format(p.price)}</div>
            <div class="p-stock">${p.stock} in stock</div>
            <div class="badge badge-neutral" style="font-size:9px; margin-top:auto;">${p.id}</div>
        </div>
    `).join('');
}

/**
 * addToCart
 * Adds a product by ID or increments quantity if already present.
 */
function addToCart(productId) {
    const product = Store.getProductById(productId);
    if (!product) return;

    const existing = cart.find(item => item.id === productId);
    if (existing) {
        existing.qty++;
    } else {
        cart.push({ ...product, qty: 1 });
    }

    updateCartUI();
    showToast(`Added ${product.name}`);
}

/**
 * updateCartUI
 * Calculates totals and refreshes the ledger display.
 */
function updateCartUI() {
    const ledger = document.getElementById('ledger-items');
    if (!ledger) return;

    ledger.innerHTML = cart.map((item, index) => `
        <div class="ledger-item">
            <div class="ledger-item-info">
                <div class="title">${item.name}</div>
                <div class="meta">${item.qty} x ${Currency.format(item.price)}</div>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
                <div style="font-weight:700;">${Currency.format(item.price * item.qty)}</div>
                <button class="btn btn-icon btn-sm" onclick="removeFromCart(${index})" style="color:var(--error);">
                   <span class="material-symbols-rounded" style="font-size:16px;">delete</span>
                </button>
            </div>
        </div>
    `).join('');

    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
    const tax = subtotal * taxRate;
    const discountAmount = subtotal * (currentDiscount / 100);
    const total = subtotal + tax - discountAmount;

    document.getElementById('subtotal').textContent = Currency.format(subtotal);
    document.getElementById('tax-amount').textContent = Currency.format(tax);
    document.getElementById('grand-total').textContent = Currency.format(total);
    
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) checkoutBtn.disabled = cart.length === 0;
}

/**
 * applyDiscount
 * Handles discount application with manager approval logic.
 */
function applyDiscount() {
    const input = document.getElementById('discount-input');
    const value = parseFloat(input.value);

    if (isNaN(value) || value < 0) {
        alert("Invalid discount percentage.");
        return;
    }

    // High discount protection
    if (value > 20) {
        const approvalCode = prompt("Manager Approval Required for discounts > 20%. Enter override code:");
        if (approvalCode !== "9999") {
            alert("Unauthorized access. Discount rejected.");
            return;
        }
    }

    currentDiscount = value;
    document.getElementById('discount-line').style.display = 'flex';
    document.getElementById('discount-val').textContent = `-${value}%`;
    updateCartUI();
    showToast(`Applied ${value}% discount`);
}

/**
 * initSearch
 * Binds the search input to the grid filter.
 */
function initSearch() {
    const search = document.getElementById('product-search');
    search?.addEventListener('input', (e) => renderProductGrid(e.target.value));
}

/**
 * initBarcodeScanner
 * Simulates a hardware barcode scanner.
 */
function initBarcodeScanner() {
    document.addEventListener('keydown', (e) => {
        // Alt+B simulates a barcode scan for demo purposes
        if (e.altKey && e.key === 'b') {
            const randomProduct = Store.products[Math.floor(Math.random() * Store.products.length)];
            addToCart(randomProduct.id);
            showToast(`Scanned Barcode: ${randomProduct.id}`);
        }
    });
}

/**
 * openPaymentModal
 * Shows the final payment selection UI.
 */
function openPaymentModal() {
    const modal = document.getElementById('payment-modal');
    const total = document.getElementById('grand-total').textContent;
    document.getElementById('payment-amount-display').textContent = total;
    modal.style.display = 'flex';
}

function selectPaymentMethod(method) {
    selectedPaymentMethod = method;
    document.querySelectorAll('.payment-method').forEach(m => m.classList.remove('active'));
    document.getElementById(`pay-${method}`).classList.add('active');
}

/**
 * finalizeTransaction
 * Processes the sale and resets the terminal.
 */
function finalizeTransaction() {
    alert(`Transaction successful! Method: ${selectedPaymentMethod.toUpperCase()}`);
    cart = [];
    currentDiscount = 0;
    document.getElementById('discount-line').style.display = 'none';
    document.getElementById('payment-modal').style.display = 'none';
    updateCartUI();
    showToast("Receipt printed & Sale recorded.");
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartUI();
}

function clearCart() {
    if (confirm("Clear all items in the current sale?")) {
        cart = [];
        updateCartUI();
    }
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    document.getElementById('toast-msg').textContent = msg;
    toast.classList.add('active');
    setTimeout(() => toast.classList.remove('active'), 3000);
}
