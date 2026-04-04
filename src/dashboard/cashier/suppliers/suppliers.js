/* ============================================================
   suppliers.js — Supplier Management Logic
   ============================================================ */

const SupplierStore = (() => {
  const KEY = 'precision_pos_suppliers';

  const SAMPLE = [
    { id: 'SUP-001', name: 'Global Tech Dist',   contact: 'Mark Johnson', email: 'sales@globaltech.com', phone: '555-0101', category: 'Electronics', leadTime: 5,  status: 'Active',   lastOrder: '2026-03-25' },
    { id: 'SUP-002', name: 'Industrial Supply Co',contact: 'Sarah Davis',  email: 'orders@indsupply.com', phone: '555-0102', category: 'Hardware',    leadTime: 10, status: 'Active',   lastOrder: '2026-03-18' },
    { id: 'SUP-003', name: 'Urban Apparel Wholesale',contact:'Kevin Lee',  email: 'kevin@urbanapparel.com',phone: '555-0103', category: 'Apparel',     leadTime: 3,  status: 'Pending',  lastOrder: 'Never' },
    { id: 'SUP-004', name: 'Elite Office Products', contact: 'Lisa Wong',  email: 'lisa@eliteoff.com',    phone: '555-0104', category: 'Office',      leadTime: 2,  status: 'Inactive', lastOrder: '2025-11-04' },
  ];

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : SAMPLE;
    } catch { return SAMPLE; }
  }

  function save(data) { localStorage.setItem(KEY, JSON.stringify(data)); }

  function getAll()         { return load(); }
  function getById(id)      { return load().find(s => s.id === id); }

  function add(supplier) {
    const data = load();
    const newId = 'SUP-' + String(data.length + 1).padStart(3, '0');
    data.unshift({ id: newId, ...supplier, lastOrder: 'Never' });
    save(data);
    return newId;
  }

  function update(id, updates) {
    const data = load();
    const idx  = data.findIndex(s => s.id === id);
    if (idx !== -1) { data[idx] = { ...data[idx], ...updates }; save(data); }
  }

  function remove(id) {
    const data = load().filter(s => s.id !== id);
    save(data);
  }

  return { getAll, getById, add, update, remove };
})();

// ── State ──────────────────────────────────────────────────────
let _suppSearchQ   = '';
let _suppFilterStatus = 'all';
let _suppEditingId  = null;

// ── Render KPIs ──────────────────────────────────────────────
function renderSupplierKPIs() {
  const suppliers = SupplierStore.getAll();
  const total     = suppliers.length;
  const active    = suppliers.filter(s => s.status === 'Active').length;
  const pending   = suppliers.filter(s => s.status === 'Pending').length;
  const inactive  = suppliers.filter(s => s.status === 'Inactive').length;

  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('kpi-total-suppliers', total);
  set('kpi-active-suppliers', active);
  set('kpi-pending-suppliers', pending);
  set('kpi-inactive-suppliers', inactive);
}

// ── Render Table ──────────────────────────────────────────────
function renderSupplierTable() {
  const tbody   = document.getElementById('supp-tbody');
  const countEl = document.getElementById('supp-count');
  if (!tbody) return;

  let suppliers = SupplierStore.getAll();

  if (_suppSearchQ) {
    const q = _suppSearchQ.toLowerCase();
    suppliers = suppliers.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.contact.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q)
    );
  }
  if (_suppFilterStatus !== 'all') {
    suppliers = suppliers.filter(s => s.status === _suppFilterStatus);
  }

  if (countEl) countEl.textContent = `${suppliers.length} suppliers`;

  const badgeClass = { Active: 'badge-active', Pending: 'badge-pending', Inactive: 'badge-inactive' };

  if (suppliers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:var(--space-10);color:var(--on-surface-variant);">
      <span class="material-symbols-rounded" style="font-size:40px;display:block;opacity:0.25;margin-bottom:8px;">local_shipping</span>
      No suppliers found
    </td></tr>`;
    return;
  }

  tbody.innerHTML = suppliers.map(s => `
    <tr class="fade-in-up">
      <td>
        <div class="supplier-name-cell">
          <div class="supplier-avatar">${s.name.split(' ').map(w => w[0]).join('').slice(0,2)}</div>
          <div>
            <div style="font-weight:600;color:var(--on-surface);">${s.name}</div>
            <div style="font-size:var(--text-label-sm);color:var(--on-surface-variant);"><span class="badge ${badgeClass[s.status] || 'badge-neutral'}">${s.status}</span></div>
          </div>
        </div>
      </td>
      <td>
        <div style="font-weight:600;color:var(--on-surface);">${s.contact}</div>
        <div style="font-size:var(--text-label-sm);color:var(--on-surface-variant);">${s.phone}</div>
      </td>
      <td><span style="color:var(--primary);">${s.email}</span></td>
      <td><span class="badge badge-neutral">${s.category}</span></td>
      <td class="numeric">${s.leadTime} days</td>
      <td style="color:var(--on-surface-variant);">${s.lastOrder}</td>
      <td>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-secondary btn-icon btn-sm" onclick="openSupplierModal('${s.id}')" title="View / Edit">
            <span class="material-symbols-rounded">edit</span>
          </button>
          <button class="btn btn-error btn-icon btn-sm" onclick="deleteSupplier('${s.id}')" title="Delete">
            <span class="material-symbols-rounded">delete</span>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ── Search & Filter ───────────────────────────────────────────
function supplierSearch(val) {
  _suppSearchQ = val;
  renderSupplierTable();
}

function filterBySupplierStatus(status, btn) {
  _suppFilterStatus = status;
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderSupplierTable();
}

// ── Modal ─────────────────────────────────────────────────────
function openAddSupplierModal() {
  _suppEditingId = null;
  document.getElementById('supp-modal-title').textContent = 'Add Supplier';
  clearSupplierForm();
  document.getElementById('supplier-modal').classList.add('open');
}

function openSupplierModal(id) {
  const s = SupplierStore.getById(id);
  if (!s) return;
  _suppEditingId = id;
  document.getElementById('supp-modal-title').textContent = 'Edit Supplier';
  document.getElementById('sm-name').value     = s.name;
  document.getElementById('sm-contact').value  = s.contact;
  document.getElementById('sm-email').value    = s.email;
  document.getElementById('sm-phone').value    = s.phone;
  document.getElementById('sm-category').value = s.category;
  document.getElementById('sm-lead').value     = s.leadTime;
  document.getElementById('sm-status').value   = s.status;
  document.getElementById('supplier-modal').classList.add('open');
}

function closeSupplierModal() {
  document.getElementById('supplier-modal').classList.remove('open');
  _suppEditingId = null;
  clearSupplierForm();
}

function clearSupplierForm() {
  ['sm-name','sm-contact','sm-email','sm-phone','sm-category','sm-lead'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  const st = document.getElementById('sm-status');
  if (st) st.value = 'Active';
}

function saveSupplier() {
  const name     = document.getElementById('sm-name')?.value.trim();
  const contact  = document.getElementById('sm-contact')?.value.trim();
  const email    = document.getElementById('sm-email')?.value.trim();
  const phone    = document.getElementById('sm-phone')?.value.trim();
  const category = document.getElementById('sm-category')?.value.trim();
  const leadTime = parseInt(document.getElementById('sm-lead')?.value) || 0;
  const status   = document.getElementById('sm-status')?.value || 'Active';

  if (!name || !contact) { alert('Supplier Name and Contact Person are required.'); return; }

  const payload = { name, contact, email, phone, category, leadTime, status };

  if (_suppEditingId) {
    SupplierStore.update(_suppEditingId, payload);
  } else {
    SupplierStore.add(payload);
  }

  closeSupplierModal();
  renderSupplierKPIs();
  renderSupplierTable();
}

function deleteSupplier(id) {
  if (!confirm('Remove this supplier? This cannot be undone.')) return;
  SupplierStore.remove(id);
  renderSupplierKPIs();
  renderSupplierTable();
}

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initTitlebar();
  initNav('suppliers');
  renderSupplierKPIs();
  renderSupplierTable();

  document.getElementById('supp-search')?.addEventListener('input', e => supplierSearch(e.target.value));
  document.getElementById('supplier-modal')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closeSupplierModal();
  });
});
