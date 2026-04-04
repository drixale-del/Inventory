/* ============================================================
   outlets.js — Multi-Outlet Management Logic
   ============================================================ */

const OutletStore = (() => {
  const KEY = 'precision_pos_outlets';

  const SAMPLE = [
    { id: 'OUT-MAIN', name: 'Downtown Main', location: '120 Market St', manager: 'Alex Sterling', phone: '555-0001', status: 'Active' },
    { id: 'OUT-NRT', name: 'Northside Branch', location: '4450 Northern Blvd', manager: 'Sam Lee', phone: '555-0002', status: 'Active' },
    { id: 'OUT-STH', name: 'Southpark Kiosk', location: '12 Southpark Mall', manager: 'Jamie Fox', phone: '555-0003', status: 'Inactive' }
  ];

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : SAMPLE;
    } catch { return SAMPLE; }
  }

  function save(data) { localStorage.setItem(KEY, JSON.stringify(data)); }

  function getAll()         { return load(); }
  function getById(id)      { return load().find(o => o.id === id); }

  function add(outlet) {
    const data = load();
    const newId = 'OUT-' + Math.random().toString(36).substr(2, 4).toUpperCase();
    data.push({ id: newId, ...outlet });
    save(data);
    return newId;
  }

  function update(id, updates) {
    const data = load();
    const idx  = data.findIndex(o => o.id === id);
    if (idx !== -1) { data[idx] = { ...data[idx], ...updates }; save(data); }
  }

  function remove(id) {
    // Prevent deleting the very last outlet
    const data = load();
    if (data.length <= 1) return false;
    save(data.filter(o => o.id !== id));
    return true;
  }
  
  // Global Active Outlet State
  function getActiveOutlet() {
    return localStorage.getItem('precision_active_outlet') || 'OUT-MAIN';
  }
  
  function setActiveOutlet(id) {
    localStorage.setItem('precision_active_outlet', id);
    // Broadcast event for live updates
    window.dispatchEvent(new CustomEvent('outletUpdated', { detail: { outletId: id } }));
  }

  return { getAll, getById, add, update, remove, getActiveOutlet, setActiveOutlet };
})();

// ── State ──────────────────────────────────────────────────────
let _outletEditingId = null;

// ── Global Outlet Selector Injection ─────────────────────────
function injectGlobalOutletSelector() {
  const sidebarUser = document.querySelector('.sidebar-user-info');
  if (!sidebarUser || document.getElementById('global-outlet-select')) return;
  
  const select = document.createElement('select');
  select.id = 'global-outlet-select';
  select.className = 'outlet-selector';
  
  function populate() {
    select.innerHTML = '';
    OutletStore.getAll().filter(o => o.status === 'Active').forEach(o => {
      const opt = document.createElement('option');
      opt.value = o.id;
      opt.textContent = o.name;
      if (o.id === OutletStore.getActiveOutlet()) opt.selected = true;
      select.appendChild(opt);
    });
  }
  
  populate();
  
  select.addEventListener('change', (e) => {
    OutletStore.setActiveOutlet(e.target.value);
  });
  
  sidebarUser.appendChild(select);
  
  // Update if changed from another window
  window.addEventListener('outletUpdated', (e) => {
    if (select.value !== e.detail.outletId) {
      select.value = e.detail.outletId;
    }
  });
}

// ── Table Rendering ───────────────────────────────────────────
function renderOutletTable() {
  const tbody = document.getElementById('outlets-tbody');
  if (!tbody) return;

  const outlets = OutletStore.getAll();
  const badgeClass = { Active: 'badge-success', Inactive: 'badge-error' };

  tbody.innerHTML = outlets.map(o => `
    <tr class="fade-in-up">
      <td style="font-weight:600; color:var(--on-surface);"><span class="material-symbols-rounded" style="vertical-align:middle;margin-right:8px;color:var(--primary);font-size:18px;">storefront</span>${o.name}</td>
      <td>${o.location}</td>
      <td>${o.manager}</td>
      <td>${o.phone}</td>
      <td><span class="badge ${badgeClass[o.status] || 'badge-neutral'}">${o.status}</span></td>
      <td>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-secondary btn-icon btn-sm" onclick="openOutletModal('${o.id}')" title="Edit">
            <span class="material-symbols-rounded">edit</span>
          </button>
          <button class="btn btn-error btn-icon btn-sm" onclick="deleteOutlet('${o.id}')" title="Delete">
            <span class="material-symbols-rounded">delete</span>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ── Modal ─────────────────────────────────────────────────────
function openAddOutletModal() {
  _outletEditingId = null;
  document.getElementById('outlet-modal-title').textContent = 'Add Branch / Outlet';
  clearOutletForm();
  document.getElementById('outlet-modal').classList.add('open');
}

function openOutletModal(id) {
  const o = OutletStore.getById(id);
  if (!o) return;
  _outletEditingId = id;
  document.getElementById('outlet-modal-title').textContent = 'Edit Branch';
  document.getElementById('om-name').value     = o.name;
  document.getElementById('om-location').value = o.location;
  document.getElementById('om-manager').value  = o.manager;
  document.getElementById('om-phone').value    = o.phone;
  document.getElementById('om-status').value   = o.status;
  document.getElementById('outlet-modal').classList.add('open');
}

function closeOutletModal() {
  document.getElementById('outlet-modal').classList.remove('open');
  _outletEditingId = null;
  clearOutletForm();
}

function clearOutletForm() {
  ['om-name','om-location','om-manager','om-phone'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  const st = document.getElementById('om-status');
  if (st) st.value = 'Active';
}

function saveOutlet() {
  const name     = document.getElementById('om-name')?.value.trim();
  const location = document.getElementById('om-location')?.value.trim();
  const manager  = document.getElementById('om-manager')?.value.trim();
  const phone    = document.getElementById('om-phone')?.value.trim();
  const status   = document.getElementById('om-status')?.value || 'Active';

  if (!name || !location) { alert('Branch Name and Location are required.'); return; }

  const payload = { name, location, manager, phone, status };

  if (_outletEditingId) {
    OutletStore.update(_outletEditingId, payload);
  } else {
    OutletStore.add(payload);
  }

  closeOutletModal();
  renderOutletTable();
  
  // Reload global selector if on the same page
  const sel = document.getElementById('global-outlet-select');
  if (sel) {
    const currentVal = sel.value;
    injectGlobalOutletSelector(); // Or force re-render
    sel.value = currentVal;
  }
}

function deleteOutlet(id) {
  if (!confirm('Remove this branch? This cannot be undone.')) return;
  if (!OutletStore.remove(id)) {
    alert('Cannot delete the last remaining outlet.');
    return;
  }
  
  if (OutletStore.getActiveOutlet() === id) {
    const remaining = OutletStore.getAll();
    OutletStore.setActiveOutlet(remaining[0].id);
  }
  
  renderOutletTable();
}

// ── Auto-Inject into all pages ───────────────────────────────
// We wait for DOM content to ensure sidebar-user-info exists, 
// then inject the selector.
document.addEventListener('DOMContentLoaded', () => {
  injectGlobalOutletSelector();
  
  // If we are ON the outlets page, render the table
  if (document.getElementById('outlets-tbody')) {
    initTitlebar();
    initNav('outlets'); // Must be added to nav.js
    renderOutletTable();
  }
});
