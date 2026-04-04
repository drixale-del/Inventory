/* ============================================================
   automation.js — Report Scheduling and Automation Logic
   ============================================================ */

const AutoReportStore = (() => {
  const KEY = 'precision_pos_automations';

  const SAMPLE = [
    { id: 'AUTO-1', name: 'Daily Sales Recap', reportType: 'sales', frequency: 'daily', channels: ['email', 'notification'], recipients: 'manager@precision.local', lastRun: 'Today 08:00', status: 'Active' },
    { id: 'AUTO-2', name: 'Weekly Low Stock Alerts', reportType: 'inventory', frequency: 'weekly', channels: ['email', 'sms'], recipients: 'warehouse@precision.local, 555-0010', lastRun: 'Sunday 00:00', status: 'Active' },
  ];

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : SAMPLE;
    } catch { return SAMPLE; }
  }

  function save(data) { localStorage.setItem(KEY, JSON.stringify(data)); }

  function getAll()         { return load(); }
  function getById(id)      { return load().find(a => a.id === id); }

  function add(rule) {
    const data = load();
    const newId = 'AUTO-' + Math.random().toString(36).substr(2, 6).toUpperCase();
    data.push({ id: newId, ...rule, lastRun: 'Never' });
    save(data);
    return newId;
  }

  function update(id, updates) {
    const data = load();
    const idx  = data.findIndex(a => a.id === id);
    if (idx !== -1) { data[idx] = { ...data[idx], ...updates }; save(data); }
  }

  function remove(id) {
    save(load().filter(a => a.id !== id));
  }

  return { getAll, getById, add, update, remove };
})();

// ── State ──────────────────────────────────────────────────────
let _autoEditingId = null;
let _selectedChannels = new Set(['email', 'notification']);

// ── Rendering ─────────────────────────────────────────────────
function renderRules() {
  const container = document.getElementById('rules-container');
  if (!container) return;

  const rules = AutoReportStore.getAll();
  
  if (rules.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:var(--space-10);color:var(--on-surface-variant);background:var(--surface-container);border-radius:var(--round-lg);">
        <span class="material-symbols-rounded" style="font-size:40px;opacity:0.3;margin-bottom:8px;display:block;">auto_timer</span>
        No automated reports configured.
      </div>`;
    return;
  }
  
  container.innerHTML = rules.map(r => `
    <div class="rule-card fade-in-up">
      <div class="rule-header">
        <div class="rule-title-group">
          <div>
            <div style="font-weight:600;font-size:16px;color:var(--on-surface);">${r.name}</div>
            <div style="font-size:13px;color:var(--on-surface-variant);display:flex;align-items:center;gap:6px;margin-top:2px;">
              <span class="badge ${r.status === 'Active' ? 'badge-success' : 'badge-neutral'}">${r.status}</span>
              <span>ID: ${r.id}</span>
            </div>
          </div>
        </div>
        <div style="display:flex;gap:var(--space-2);align-items:center;">
          <div class="rule-frequency" style="${r.frequency === 'daily' ? 'background:#e3f2fd;color:#1565c0;' : r.frequency === 'weekly' ? 'background:#f3e5f5;color:#6a1b9a;' : 'background:#e0f2f1;color:#00695c;'}">
            <span class="material-symbols-rounded">update</span>
            ${r.frequency.toUpperCase()}
          </div>
          <button class="btn btn-secondary btn-icon btn-sm" onclick="openAutoModal('${r.id}')" title="Edit Rule"><span class="material-symbols-rounded">edit</span></button>
          <button class="btn btn-error btn-icon btn-sm" onclick="deleteRule('${r.id}')" title="Delete"><span class="material-symbols-rounded">delete</span></button>
        </div>
      </div>
      <div class="rule-body">
        <div class="rule-meta">
          <span>Report Type</span>
          <strong>${r.reportType.charAt(0).toUpperCase() + r.reportType.slice(1)} Report</strong>
        </div>
        <div class="rule-meta">
          <span>Delivery Channels</span>
          <div style="display:flex;gap:4px;">
            ${r.channels.map(c => `<span class="material-symbols-rounded" style="font-size:18px;color:var(--on-surface-variant);" title="${c}">${c === 'email' ? 'mail' : c === 'sms' ? 'sms' : 'notifications'}</span>`).join('')}
          </div>
        </div>
        <div class="rule-meta">
          <span>Recipients</span>
          <strong>${r.recipients}</strong>
        </div>
        <div class="rule-meta">
          <span>Last Run</span>
          <strong style="font-size:12px;opacity:0.8;">${r.lastRun}</strong>
        </div>
      </div>
    </div>
  `).join('');
}

// ── Modal Handling ───────────────────────────────────────────
function openAddAutoModal() {
  _autoEditingId = null;
  document.getElementById('auto-modal-title').textContent = 'Create Scheduled Report';
  clearAutoForm();
  document.getElementById('automation-modal').classList.add('open');
}

function openAutoModal(id) {
  const r = AutoReportStore.getById(id);
  if (!r) return;
  _autoEditingId = id;
  document.getElementById('auto-modal-title').textContent = 'Edit Scheduled Report';
  
  document.getElementById('am-name').value = r.name;
  document.getElementById('am-type').value = r.reportType;
  document.getElementById('am-freq').value = r.frequency;
  document.getElementById('am-rcpt').value = r.recipients;
  document.getElementById('am-status').value = r.status || 'Active';
  
  _selectedChannels = new Set(r.channels);
  updateChannelUI();
  
  document.getElementById('automation-modal').classList.add('open');
}

function closeAutoModal() {
  document.getElementById('automation-modal').classList.remove('open');
  _autoEditingId = null;
  clearAutoForm();
}

function clearAutoForm() {
  ['am-name','am-rcpt'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  document.getElementById('am-type').value = 'sales';
  document.getElementById('am-freq').value = 'daily';
  document.getElementById('am-status').value = 'Active';
  _selectedChannels = new Set(['email', 'notification']);
  updateChannelUI();
}

function toggleChannel(chan) {
  if (_selectedChannels.has(chan)) _selectedChannels.delete(chan);
  else _selectedChannels.add(chan);
  updateChannelUI();
}

function updateChannelUI() {
  document.querySelectorAll('.channel-btn').forEach(btn => {
    btn.classList.toggle('active', _selectedChannels.has(btn.dataset.chan));
  });
}

function saveRule() {
  const name       = document.getElementById('am-name').value.trim();
  const reportType = document.getElementById('am-type').value;
  const frequency  = document.getElementById('am-freq').value;
  const recipients = document.getElementById('am-rcpt').value.trim();
  const status     = document.getElementById('am-status').value;
  const channels   = Array.from(_selectedChannels);
  
  if (!name || !recipients) { alert('Rule Name and Recipients are required.'); return; }
  if (channels.length === 0) { alert('Select at least one delivery channel.'); return; }
  
  const payload = { name, reportType, frequency, recipients, status, channels };
  
  if (_autoEditingId) AutoReportStore.update(_autoEditingId, payload);
  else AutoReportStore.add(payload);
  
  closeAutoModal();
  renderRules();
}

function deleteRule(id) {
  if (!confirm('Delete this automated report rule?')) return;
  AutoReportStore.remove(id);
  renderRules();
}

// ── Dummy Trigger for Testing ──
function runMockTrigger() {
  alert('Simulating Report Trigger... Checking active Outlets and formatting selected reports. Emails and SMS would be dispatched now.');
}

// ── Initialization ───────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('rules-container')) {
    initTitlebar();
    initNav('automations');
    renderRules();
  }
});
