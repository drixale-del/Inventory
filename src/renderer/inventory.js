/* ============================================================
   PRECISION POS — INVENTORY RENDERER
   ============================================================ */

let sortKey = 'name';
let sortAsc = true;
let filterStatus = 'all';
let editingId = null;
let localProducts = [...Store.products];

document.addEventListener('DOMContentLoaded', () => {
  initTitlebar();
  initNav('inventory');
  renderKPIs();
  renderTable();
});

// Re-render when currency changes
window.addEventListener('currencyUpdated', () => {
  renderKPIs();
  renderTable();
});

// Barcode scanner integration for inventory lookup
window.addEventListener('barcodeScanned', (e) => {
  const code = e.detail.code;
  const searchInput = document.getElementById('inv-search') || document.querySelector('input[type="text"]');
  if (searchInput) {
    searchInput.value = code;
    // Attempt to trigger the native search function if defined
    if (typeof searchInventory === 'function') searchInventory(code);
    else if (typeof filterTableByText === 'function') filterTableByText(code);
    else {
      // Trigger input event
      searchInput.dispatchEvent(new Event('input'));
    }
  }
});

// ── KPIs ─────────────────────────────────────────────────────

function renderKPIs() {
  const totalValue = Store.getTotalStockValue();
  const lowCount   = Store.getLowStockProducts().length;
  const skuCount   = localProducts.length;

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

  set('kpi-stock-value', Currency.format(totalValue));
  set('kpi-low-count',   lowCount);
  set('kpi-low-badge',   lowCount + ' items');
  set('kpi-categories',  skuCount);
}

// ── TABLE ────────────────────────────────────────────────────

function filterTable(status, btn) {
  filterStatus = status;
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderTable();
}

function sortTable(key) {
  if (sortKey === key) sortAsc = !sortAsc;
  else { sortKey = key; sortAsc = true; }

  document.querySelectorAll('th').forEach(th => th.classList.remove('sorted'));
  const headers = { sku: 1, name: 2, category: 3, stock: 4, price: 5, status: 6 };
  const idx = headers[key];
  if (idx) {
    const ths = document.querySelectorAll('.data-table th');
    if (ths[idx]) ths[idx].classList.add('sorted');
  }
  renderTable();
}

function renderTable() {
  const tbody = document.getElementById('inv-table-body');
  if (!tbody) return;

  const q = (document.getElementById('inv-search')?.value || '').toLowerCase().trim();

  let filtered = localProducts.filter(p => {
    const matchStatus = filterStatus === 'all' || p.status === filterStatus;
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  filtered.sort((a, b) => {
    let va = a[sortKey], vb = b[sortKey];
    if (typeof va === 'string') va = va.toLowerCase();
    if (typeof vb === 'string') vb = vb.toLowerCase();
    if (va < vb) return sortAsc ? -1 : 1;
    if (va > vb) return sortAsc ?  1 : -1;
    return 0;
  });

  const badge = document.getElementById('product-count-badge');
  if (badge) badge.textContent = `${filtered.length} items`;

  const badgeClass = { 'In Stock': 'badge-success', 'Low Stock': 'badge-warning', 'Out of Stock': 'badge-error' };

  tbody.innerHTML = filtered.map(p => `
    <tr class="fade-in-up">
      <td class="product-emoji-cell">${p.emoji}</td>
      <td><span class="sku-code">${p.sku}</span></td>
      <td style="font-weight:600;">${p.name}</td>
      <td><span class="badge badge-neutral">${p.category}</span></td>
      <td class="numeric" style="text-align:left;font-variant-numeric:tabular-nums;">${p.stock.toString().padStart(4, '\u2007')}</td>
      <td class="numeric">${Currency.format(p.price)}</td>
      <td><span class="badge ${badgeClass[p.status] || 'badge-neutral'}">${p.status}</span></td>
      <td>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-secondary btn-icon btn-sm" onclick="openEditModal('${p.id}')" title="Edit">
            <span class="material-symbols-rounded">edit</span>
          </button>
          <button class="btn btn-error btn-icon btn-sm" onclick="deleteProduct('${p.id}')" title="Delete">
            <span class="material-symbols-rounded">delete</span>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ── MODAL ────────────────────────────────────────────────────

function openAddModal() {
  editingId = null;
  document.getElementById('modal-title').textContent = 'Add Product';
  clearForm();
  document.getElementById('product-modal').classList.add('open');
}

function openEditModal(id) {
  const p = localProducts.find(x => x.id === id);
  if (!p) return;
  editingId = id;
  document.getElementById('modal-title').textContent = 'Edit Product';
  document.getElementById('f-name').value     = p.name;
  document.getElementById('f-sku').value      = p.sku;
  document.getElementById('f-category').value = p.category;
  document.getElementById('f-stock').value    = p.stock;
  document.getElementById('f-price').value    = p.price;
  document.getElementById('f-cost').value     = p.cost;
  document.getElementById('product-modal').classList.add('open');
}

function closeModal() {
  document.getElementById('product-modal').classList.remove('open');
  editingId = null;
  clearForm();
}

function clearForm() {
  ['f-name','f-sku','f-category','f-stock','f-price','f-cost'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
}

function saveProduct() {
  const name     = document.getElementById('f-name').value.trim();
  const sku      = document.getElementById('f-sku').value.trim();
  const category = document.getElementById('f-category').value.trim();
  const stock    = parseInt(document.getElementById('f-stock').value) || 0;
  const price    = parseFloat(document.getElementById('f-price').value) || 0;
  const cost     = parseFloat(document.getElementById('f-cost').value) || 0;

  if (!name || !sku) { alert('Product name and SKU are required.'); return; }

  const status = stock === 0 ? 'Out of Stock' : stock < 10 ? 'Low Stock' : 'In Stock';

  if (editingId) {
    const idx = localProducts.findIndex(p => p.id === editingId);
    if (idx !== -1) {
      localProducts[idx] = { ...localProducts[idx], name, sku, category, stock, price, cost, status };
    }
  } else {
    const newId = 'P' + String(localProducts.length + 1).padStart(3, '0');
    localProducts.push({ id: newId, sku, name, category, stock, price, cost, status, emoji: '📦' });
  }

  closeModal();
  renderTable();
  renderKPIs();
}

function deleteProduct(id) {
  if (!confirm('Remove this product from inventory?')) return;
  localProducts = localProducts.filter(p => p.id !== id);
  renderTable();
  renderKPIs();
}

function exportInventory() {
  const rows = [['SKU','Name','Category','Stock','Price','Cost','Status']];
  localProducts.forEach(p => rows.push([p.sku, p.name, p.category, p.stock, p.price, p.cost, p.status]));
  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'inventory_export.csv';
  a.click();
}

// Close modal when clicking overlay
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('product-modal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });
});
