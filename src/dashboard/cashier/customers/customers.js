/* ============================================================
   customers.js — Customer Data & Loyalty Program Logic
   ============================================================ */

const CustomerStore = (() => {
  const KEY = 'precision_pos_customers';

  const SAMPLE = [
    { id: 'C001', name: 'Sarah Kimani',   email: 'sarah.k@email.com',  phone: '+254 712 345 678', joinDate: '2025-08-14', totalSpend: 4820.50, visits: 23, tier: 'gold',     notes: 'Prefers electronics. Always pays cash.' },
    { id: 'C002', name: 'James Odhiambo', email: 'james.o@email.com',  phone: '+254 700 112 233', joinDate: '2025-11-03', totalSpend: 1230.00, visits: 8,  tier: 'silver',   notes: '' },
    { id: 'C003', name: 'Amina Waweru',   email: 'amina.w@email.com',  phone: '+254 733 987 654', joinDate: '2026-01-22', totalSpend: 387.99,  visits: 3,  tier: 'bronze',   notes: 'New customer — referred by Sarah K.' },
    { id: 'C004', name: 'David Muthoni',  email: 'david.m@email.com',  phone: '+254 722 445 566', joinDate: '2025-06-01', totalSpend: 12450.00,visits: 61, tier: 'platinum', notes: 'Corporate account — invoicing only.' },
    { id: 'C005', name: 'Rose Achieng',   email: 'rose.a@email.com',   phone: '+254 701 667 788', joinDate: '2025-09-17', totalSpend: 2100.75, visits: 14, tier: 'silver',   notes: '' },
    { id: 'C006', name: 'Peter Njoroge',  email: 'peter.n@email.com',  phone: '+254 710 223 344', joinDate: '2026-02-08', totalSpend: 89.99,   visits: 1,  tier: 'bronze',   notes: 'First visit — bought headphones.' },
  ];

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : SAMPLE;
    } catch { return SAMPLE; }
  }

  function save(data) { localStorage.setItem(KEY, JSON.stringify(data)); }

  function getAll()         { return load(); }
  function getById(id)      { return load().find(c => c.id === id); }

  function add(customer) {
    const data = load();
    const newId = 'C' + String(data.length + 1).padStart(3, '0');
    data.unshift({ id: newId, ...customer, joinDate: new Date().toISOString().split('T')[0], visits: 0, tier: 'bronze' });
    save(data);
    return newId;
  }

  function update(id, updates) {
    const data = load();
    const idx  = data.findIndex(c => c.id === id);
    if (idx !== -1) { data[idx] = { ...data[idx], ...updates }; save(data); }
  }

  function remove(id) {
    const data = load().filter(c => c.id !== id);
    save(data);
  }

  function getTierLabel(spend) {
    if (spend >= 10000) return 'platinum';
    if (spend >= 3000)  return 'gold';
    if (spend >= 1000)  return 'silver';
    return 'bronze';
  }

  return { getAll, getById, add, update, remove, getTierLabel };
})();

// ── State ──────────────────────────────────────────────────────
let _searchQ   = '';
let _filterTier = 'all';
let _editingId  = null;

// ── Render KPIs ──────────────────────────────────────────────
function renderCustomerKPIs() {
  const customers = CustomerStore.getAll();
  const total    = customers.length;
  const revenue  = customers.reduce((s, c) => s + c.totalSpend, 0);
  const avgSpend = total ? revenue / total : 0;
  const loyaltyCount = customers.filter(c => c.tier === 'gold' || c.tier === 'platinum').length;

  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('kpi-total-customers', total);
  set('kpi-total-revenue',   Currency.format(revenue));
  set('kpi-avg-spend',       Currency.format(avgSpend));
  set('kpi-loyalty-members', loyaltyCount);
}

// ── Render Table ──────────────────────────────────────────────
function renderCustomerTable() {
  const tbody     = document.getElementById('customer-tbody');
  const countEl   = document.getElementById('customer-count');
  if (!tbody) return;

  let customers = CustomerStore.getAll();

  if (_searchQ) {
    const q = _searchQ.toLowerCase();
    customers = customers.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.includes(q)
    );
  }
  if (_filterTier !== 'all') {
    customers = customers.filter(c => c.tier === _filterTier);
  }

  if (countEl) countEl.textContent = `${customers.length} customers`;

  const tierIcon  = { bronze: '🥉', silver: '🥈', gold: '🥇', platinum: '💎' };
  const tierClass = { bronze: 'tier-bronze', silver: 'tier-silver', gold: 'tier-gold', platinum: 'tier-platinum' };

  if (customers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:var(--space-10);color:var(--on-surface-variant);">
      <span class="material-symbols-rounded" style="font-size:40px;display:block;opacity:0.25;margin-bottom:8px;">group_off</span>
      No customers found
    </td></tr>`;
    return;
  }

  tbody.innerHTML = customers.map(c => `
    <tr class="fade-in-up">
      <td>
        <div class="customer-name-cell">
          <div class="customer-avatar">${c.name.split(' ').map(w => w[0]).join('').slice(0,2)}</div>
          <div>
            <div style="font-weight:600;color:var(--on-surface);">${c.name}</div>
            <div style="font-size:var(--text-label-sm);color:var(--on-surface-variant);">${c.email}</div>
          </div>
        </div>
      </td>
      <td>${c.phone}</td>
      <td><span class="badge ${tierClass[c.tier]}">${tierIcon[c.tier]} ${c.tier.charAt(0).toUpperCase() + c.tier.slice(1)}</span></td>
      <td class="numeric">${c.visits}</td>
      <td class="numeric">${Currency.format(c.totalSpend)}</td>
      <td>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-secondary btn-icon btn-sm" onclick="openCustomerModal('${c.id}')" title="View / Edit">
            <span class="material-symbols-rounded">edit</span>
          </button>
          <button class="btn btn-error btn-icon btn-sm" onclick="deleteCustomer('${c.id}')" title="Delete">
            <span class="material-symbols-rounded">delete</span>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ── Search & Filter ───────────────────────────────────────────
function customerSearch(val) {
  _searchQ = val;
  renderCustomerTable();
}

function filterByTier(tier, btn) {
  _filterTier = tier;
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderCustomerTable();
}

// ── Modal ─────────────────────────────────────────────────────
function openAddCustomerModal() {
  _editingId = null;
  document.getElementById('cust-modal-title').textContent = 'Add Customer';
  clearCustomerForm();
  document.getElementById('customer-modal').classList.add('open');
}

function openCustomerModal(id) {
  const c = CustomerStore.getById(id);
  if (!c) return;
  _editingId = id;
  document.getElementById('cust-modal-title').textContent = 'Edit Customer';
  document.getElementById('cm-name').value  = c.name;
  document.getElementById('cm-email').value = c.email;
  document.getElementById('cm-phone').value = c.phone;
  document.getElementById('cm-notes').value = c.notes || '';
  document.getElementById('cm-spend').value = c.totalSpend;
  document.getElementById('cm-visits').value = c.visits;
  document.getElementById('customer-modal').classList.add('open');
}

function closeCustomerModal() {
  document.getElementById('customer-modal').classList.remove('open');
  _editingId = null;
  clearCustomerForm();
}

function clearCustomerForm() {
  ['cm-name','cm-email','cm-phone','cm-notes','cm-spend','cm-visits'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
}

function saveCustomer() {
  const name   = document.getElementById('cm-name')?.value.trim();
  const email  = document.getElementById('cm-email')?.value.trim();
  const phone  = document.getElementById('cm-phone')?.value.trim();
  const notes  = document.getElementById('cm-notes')?.value.trim() || '';
  const spend  = parseFloat(document.getElementById('cm-spend')?.value) || 0;
  const visits = parseInt(document.getElementById('cm-visits')?.value) || 0;

  if (!name || !email) {
    alert('Customer name and email are required.');
    return;
  }

  const tier = CustomerStore.getTierLabel(spend);

  if (_editingId) {
    CustomerStore.update(_editingId, { name, email, phone, notes, totalSpend: spend, visits, tier });
  } else {
    CustomerStore.add({ name, email, phone, notes, totalSpend: spend });
  }

  closeCustomerModal();
  renderCustomerKPIs();
  renderCustomerTable();
}

function deleteCustomer(id) {
  if (!confirm('Remove this customer? This cannot be undone.')) return;
  CustomerStore.remove(id);
  renderCustomerKPIs();
  renderCustomerTable();
}

// ── Export ────────────────────────────────────────────────────
function exportCustomers() {
  const rows = [['ID','Name','Email','Phone','Tier','Visits','Total Spend','Joined','Notes']];
  CustomerStore.getAll().forEach(c =>
    rows.push([c.id, c.name, c.email, c.phone, c.tier, c.visits, c.totalSpend, c.joinDate, c.notes])
  );
  const csv  = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = 'customers_export.csv';
  a.click();
}

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initTitlebar();
  initNav('customers');
  renderCustomerKPIs();
  renderCustomerTable();

  document.getElementById('cust-search')?.addEventListener('input', e => customerSearch(e.target.value));
  document.getElementById('customer-modal')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closeCustomerModal();
  });
});

window.addEventListener('currencyUpdated', () => {
  renderCustomerKPIs();
  renderCustomerTable();
});
