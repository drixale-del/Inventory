/* ============================================================
   returns.js — Returns & Refunds Management Logic
   ============================================================ */

const ReturnStore = (() => {
  const KEY = 'precision_pos_returns';

  const REASONS = [
    'Defective / Damaged',
    'Wrong Item Received',
    'Changed Mind',
    'Size / Fit Issue',
    'Not as Described',
    'Duplicate Order',
    'Other',
  ];

  const SAMPLE = [
    {
      id: 'RET-001', txnId: 'TXN-008901', date: '2026-03-28',
      customer: 'Sarah Kimani', product: 'Aura Beats Pro', sku: 'AUD-5540-B',
      qty: 1, amount: 149.99, reason: 'Defective / Damaged',
      resolution: 'refunded', notes: 'Left earbud not working on arrival.',
      processedBy: 'Alex Sterling',
    },
    {
      id: 'RET-002', txnId: 'TXN-008876', date: '2026-03-27',
      customer: 'James Odhiambo', product: 'Titanium Drill Bit Set', sku: 'IND-9230-T',
      qty: 1, amount: 89.99, reason: 'Not as Described',
      resolution: 'exchanged', notes: 'Customer expected metric sizes, received imperial.',
      processedBy: 'Alex Sterling',
    },
    {
      id: 'RET-003', txnId: 'TXN-008854', date: '2026-03-25',
      customer: 'Walk-in Customer', product: 'Nomad Urban Pack', sku: 'BAG-6643-N',
      qty: 1, amount: 129.00, reason: 'Changed Mind',
      resolution: 'pending', notes: '',
      processedBy: '',
    },
    {
      id: 'RET-004', txnId: 'TXN-008840', date: '2026-03-22',
      customer: 'Amina Waweru', product: 'UltraBoost X-20', sku: 'ELX-8831-C',
      qty: 1, amount: 179.99, reason: 'Size / Fit Issue',
      resolution: 'exchanged', notes: 'Swapped for size 42.',
      processedBy: 'Alex Sterling',
    },
    {
      id: 'RET-005', txnId: 'TXN-008811', date: '2026-03-18',
      customer: 'David Muthoni', product: 'Carbon Steel Fasteners', sku: 'FAS-1102-S',
      qty: 3, amount: 38.97, reason: 'Wrong Item Received',
      resolution: 'rejected', notes: 'Item opened and used — outside return policy.',
      processedBy: 'Alex Sterling',
    },
  ];

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : SAMPLE;
    } catch { return SAMPLE; }
  }

  function save(data) { localStorage.setItem(KEY, JSON.stringify(data)); }

  function getAll()    { return load(); }
  function getById(id) { return load().find(r => r.id === id); }

  function add(ret) {
    const data  = load();
    const newId = 'RET-' + String(data.length + 1).padStart(3, '0');
    data.unshift({ id: newId, date: new Date().toISOString().split('T')[0], ...ret });
    save(data);
    return newId;
  }

  function update(id, updates) {
    const data = load();
    const idx  = data.findIndex(r => r.id === id);
    if (idx !== -1) { data[idx] = { ...data[idx], ...updates }; save(data); }
  }

  function remove(id) { save(load().filter(r => r.id !== id)); }

  function getReasons() { return REASONS; }

  return { getAll, getById, add, update, remove, getReasons };
})();

// ── State ────────────────────────────────────────────────────
let _returnSearchQ    = '';
let _returnFilter     = 'all';
let _returnEditingId  = null;

// ── KPIs ────────────────────────────────────────────────────
function renderReturnsKPIs() {
  const returns   = ReturnStore.getAll();
  const total     = returns.length;
  const refunded  = returns.filter(r => r.resolution === 'refunded');
  const pending   = returns.filter(r => r.resolution === 'pending').length;
  const totalVal  = returns.reduce((s, r) => s + r.amount, 0);
  const refundVal = refunded.reduce((s, r) => s + r.amount, 0);

  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('kpi-total-returns',   total);
  set('kpi-refund-value',    Currency.format(refundVal));
  set('kpi-pending-returns', pending);
  set('kpi-return-value',    Currency.format(totalVal));

  // Summary strip
  renderSummaryStrip(returns);
}

function renderSummaryStrip(returns) {
  const strip = document.getElementById('returns-summary-strip');
  if (!strip) return;
  const counts = { refunded: 0, exchanged: 0, pending: 0, rejected: 0 };
  returns.forEach(r => { if (counts[r.resolution] !== undefined) counts[r.resolution]++; });
  strip.innerHTML = Object.entries(counts).map(([k, v]) => `
    <div class="returns-summary-item">
      <span class="badge badge-${k === 'pending' ? 'warning' : k === 'rejected' ? 'error' : k === 'exchanged' ? 'neutral' : 'success'}">${k.charAt(0).toUpperCase()+k.slice(1)}</span>
      <strong>${v}</strong>
    </div>
  `).join('');
}

// ── Table ────────────────────────────────────────────────────
function renderReturnsTable() {
  const tbody   = document.getElementById('returns-tbody');
  const countEl = document.getElementById('returns-count');
  if (!tbody) return;

  let returns = ReturnStore.getAll();

  if (_returnSearchQ) {
    const q = _returnSearchQ.toLowerCase();
    returns = returns.filter(r =>
      r.id.toLowerCase().includes(q)      ||
      r.txnId.toLowerCase().includes(q)   ||
      r.customer.toLowerCase().includes(q)||
      r.product.toLowerCase().includes(q) ||
      r.sku.toLowerCase().includes(q)
    );
  }
  if (_returnFilter !== 'all') {
    returns = returns.filter(r => r.resolution === _returnFilter);
  }

  if (countEl) countEl.textContent = `${returns.length} records`;

  const statusBadge = {
    refunded:  '<span class="badge badge-refunded">Refunded</span>',
    exchanged: '<span class="badge badge-exchanged">Exchanged</span>',
    pending:   '<span class="badge badge-pending">Pending</span>',
    rejected:  '<span class="badge badge-rejected">Rejected</span>',
  };

  if (returns.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:var(--space-10);color:var(--on-surface-variant);">
      <span class="material-symbols-rounded" style="font-size:40px;display:block;opacity:0.25;margin-bottom:8px;">assignment_return</span>
      No return records found
    </td></tr>`;
    return;
  }

  tbody.innerHTML = returns.map(r => `
    <tr class="fade-in-up">
      <td><span class="sku-code">${r.id}</span></td>
      <td><span class="sku-code">${r.txnId}</span></td>
      <td style="font-weight:600;">${r.customer}</td>
      <td>
        <div style="font-weight:600;color:var(--on-surface);">${r.product}</div>
        <div style="font-size:var(--text-label-sm);color:var(--on-surface-variant);">${r.sku}</div>
      </td>
      <td><span class="return-reason-chip">
        <span class="material-symbols-rounded" style="font-size:13px;">info</span>${r.reason}
      </span></td>
      <td class="numeric">${Currency.format(r.amount)}</td>
      <td>${statusBadge[r.resolution] || r.resolution}</td>
      <td>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-secondary btn-icon btn-sm" onclick="openReturnModal('${r.id}')" title="View / Edit">
            <span class="material-symbols-rounded">edit</span>
          </button>
          <button class="btn btn-error btn-icon btn-sm" onclick="deleteReturn('${r.id}')" title="Delete">
            <span class="material-symbols-rounded">delete</span>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ── Search & Filter ──────────────────────────────────────────
function returnsSearch(val) {
  _returnSearchQ = val;
  renderReturnsTable();
}

function filterByResolution(res, btn) {
  _returnFilter = res;
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderReturnsTable();
}

// ── Populate reason dropdown ─────────────────────────────────
function populateReasons() {
  const sel = document.getElementById('rm-reason');
  if (!sel) return;
  ReturnStore.getReasons().forEach(r => {
    const opt = document.createElement('option');
    opt.value = r; opt.textContent = r;
    sel.appendChild(opt);
  });
}

// ── Modal ────────────────────────────────────────────────────
function openAddReturnModal() {
  _returnEditingId = null;
  document.getElementById('ret-modal-title').textContent = 'Log Return / Refund';
  clearReturnForm();
  document.getElementById('return-modal').classList.add('open');
}

function openReturnModal(id) {
  const r = ReturnStore.getById(id);
  if (!r) return;
  _returnEditingId = id;
  document.getElementById('ret-modal-title').textContent = 'Edit Return Record';

  document.getElementById('rm-txn').value       = r.txnId;
  document.getElementById('rm-customer').value  = r.customer;
  document.getElementById('rm-product').value   = r.product;
  document.getElementById('rm-sku').value       = r.sku;
  document.getElementById('rm-qty').value       = r.qty;
  document.getElementById('rm-amount').value    = r.amount;
  document.getElementById('rm-reason').value    = r.reason;
  document.getElementById('rm-resolution').value= r.resolution;
  document.getElementById('rm-notes').value     = r.notes || '';

  document.getElementById('return-modal').classList.add('open');
}

function closeReturnModal() {
  document.getElementById('return-modal').classList.remove('open');
  _returnEditingId = null;
  clearReturnForm();
}

function clearReturnForm() {
  ['rm-txn','rm-customer','rm-product','rm-sku','rm-qty','rm-amount','rm-notes'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  const sel = document.getElementById('rm-resolution');
  if (sel) sel.value = 'pending';
}

function saveReturn() {
  const txnId      = document.getElementById('rm-txn')?.value.trim()        || '';
  const customer   = document.getElementById('rm-customer')?.value.trim()   || 'Walk-in Customer';
  const product    = document.getElementById('rm-product')?.value.trim();
  const sku        = document.getElementById('rm-sku')?.value.trim()         || '';
  const qty        = parseInt(document.getElementById('rm-qty')?.value)      || 1;
  const amount     = parseFloat(document.getElementById('rm-amount')?.value) || 0;
  const reason     = document.getElementById('rm-reason')?.value             || 'Other';
  const resolution = document.getElementById('rm-resolution')?.value         || 'pending';
  const notes      = document.getElementById('rm-notes')?.value.trim()       || '';

  if (!product) { alert('Product name is required.'); return; }

  const payload = { txnId, customer, product, sku, qty, amount, reason, resolution, notes, processedBy: 'Alex Sterling' };

  if (_returnEditingId) {
    ReturnStore.update(_returnEditingId, payload);
  } else {
    ReturnStore.add(payload);
  }

  closeReturnModal();
  renderReturnsKPIs();
  renderReturnsTable();
}

function deleteReturn(id) {
  if (!confirm('Delete this return record? This cannot be undone.')) return;
  ReturnStore.remove(id);
  renderReturnsKPIs();
  renderReturnsTable();
}

// ── Export ───────────────────────────────────────────────────
function exportReturns() {
  const rows = [['ID','TXN ID','Date','Customer','Product','SKU','Qty','Amount','Reason','Resolution','Notes','Processed By']];
  ReturnStore.getAll().forEach(r =>
    rows.push([r.id, r.txnId, r.date, r.customer, r.product, r.sku, r.qty, r.amount, r.reason, r.resolution, r.notes, r.processedBy])
  );
  const csv  = rows.map(row => row.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = 'returns_export.csv';
  a.click();
}

// ── Init ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initTitlebar();
  initNav('returns');
  populateReasons();
  renderReturnsKPIs();
  renderReturnsTable();

  document.getElementById('returns-search')?.addEventListener('input', e => returnsSearch(e.target.value));
  document.getElementById('return-modal')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closeReturnModal();
  });
});

window.addEventListener('currencyUpdated', () => {
  renderReturnsKPIs();
  renderReturnsTable();
});
