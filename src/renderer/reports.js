/* ============================================================
   PRECISION POS — REPORTS RENDERER
   ============================================================ */

let expenses = [];

document.addEventListener('DOMContentLoaded', () => {
  initTitlebar();
  initNav('reports');
  renderPnL();
  renderRevenueChart();
  renderSlowMoving();
  renderApprovals();
});

// Re-render when currency changes
window.addEventListener('currencyUpdated', () => {
  renderPnL();
  renderRevenueChart();
  renderExpenseList();
  renderApprovals();
});

// ── P&L STATEMENT ────────────────────────────────────────────

function renderPnL() {
  const { revenue, cogs, grossProfit, opex, taxes, netProfit, prevRevenue } = Store.pnl;
  const growth = ((revenue - prevRevenue) / prevRevenue * 100).toFixed(1);

  const fmt = (n) => Currency.format(n);

  const rows = [
    { label: 'Total Revenue',   value: fmt(revenue),     cls: '' },
    { label: 'Cost of Goods Sold (COGS)', value: `(${fmt(cogs)})`, cls: 'negative' },
    { label: 'Gross Profit',    value: fmt(grossProfit), cls: 'positive' },
    { label: 'Operating Expenses', value: `(${fmt(opex)})`, cls: 'negative' },
    { label: 'Taxes & Levies',  value: `(${fmt(taxes)})`, cls: 'negative' },
    { label: 'Net Profit',      value: fmt(netProfit),   cls: 'positive', total: true },
  ];

  const container = document.getElementById('pnl-table');
  if (!container) return;

  container.innerHTML = rows.map(r => `
    <div class="pnl-row ${r.total ? 'total-row' : ''}">
      <span class="pnl-label">${r.label}</span>
      <span class="pnl-value ${r.cls}">${r.value}</span>
    </div>
  `).join('');
}

// ── REVENUE VS EXPENSES CHART ─────────────────────────────────

function renderRevenueChart() {
  const ctx = document.getElementById('rev-exp-chart');
  if (!ctx) return;

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: Store.weekLabels,
      datasets: [
        {
          label: 'Revenue',
          data: Store.weeklyRevenue,
          borderColor: '#005f73',
          backgroundColor: 'rgba(0,95,115,0.08)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#005f73',
          pointRadius: 4,
          pointHoverRadius: 6,
          borderWidth: 2.5,
        },
        {
          label: 'Expenses',
          data: Store.weeklyExpenses,
          borderColor: '#ba1a1a',
          backgroundColor: 'rgba(186,26,26,0.05)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#ba1a1a',
          pointRadius: 4,
          pointHoverRadius: 6,
          borderWidth: 2,
          borderDash: [5, 3],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          align: 'end',
          labels: {
            color: '#3f484c',
            font: { family: 'Inter', size: 12 },
            boxWidth: 12,
            boxHeight: 12,
            usePointStyle: true,
          },
        },
        tooltip: {
          backgroundColor: '#2d3133',
          titleColor: '#eff1f3',
          bodyColor: '#bfc8cc',
          padding: 12,
          callbacks: { label: (ctx) => ` ${ctx.dataset.label}: ${Currency.format(ctx.parsed.y)}` },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: { color: '#6f797c', font: { family: 'Inter', size: 11, weight: '600' } },
        },
        y: {
          grid: { color: 'rgba(25,28,30,0.05)' },
          border: { display: false },
          ticks: {
            color: '#6f797c',
            font: { family: 'Inter', size: 11 },
            callback: (v) => Currency.symbol() + (v / 1000).toFixed(0) + 'k',
          },
        },
      },
    },
  });
}

// ── SLOW MOVING ──────────────────────────────────────────────

function renderSlowMoving() {
  const container = document.getElementById('slow-moving-list');
  if (!container) return;

  const slowItems = [
    { name: 'Titanium Chronograph', sku: 'WCH-1145-T', sales: 0,  days: 30 },
    { name: 'Studio Headphones Pro', sku: 'AUD-3312-S', sales: 2,  days: 30 },
    { name: 'Iron Grip 5kg Dumbbell', sku: 'FIT-9901-I', sales: 0, days: 45 },
  ];

  container.innerHTML = slowItems.map(item => `
    <div class="alert-item">
      <span class="material-symbols-rounded">warning</span>
      <div class="alert-item-info">
        <div class="alert-item-name">${item.name}</div>
        <div class="alert-item-detail">${item.sku} · ${item.sales} sales in ${item.days} days</div>
      </div>
      <button class="btn btn-sm btn-secondary" onclick="alert('Markdown action for ${item.name}')">
        Mark Down
      </button>
    </div>
  `).join('');
}

// ── EXPENSE RECORDER ─────────────────────────────────────────

function recordExpense() {
  const desc   = document.getElementById('exp-desc')?.value.trim();
  const amount = parseFloat(document.getElementById('exp-amount')?.value) || 0;
  const cat    = document.getElementById('exp-category')?.value.trim() || 'General';

  if (!desc || amount <= 0) { alert('Please provide a description and amount.'); return; }

  expenses.unshift({ desc, amount, cat, date: new Date().toLocaleDateString() });
  ['exp-desc', 'exp-amount', 'exp-category'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  renderExpenseList();
}

function renderExpenseList() {
  const container = document.getElementById('expense-list');
  if (!container) return;
  if (expenses.length === 0) { container.innerHTML = ''; return; }

  container.innerHTML = `
    <div style="font-size:var(--text-label-sm);font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--on-surface-variant);margin-bottom:8px;">Recent Expenses</div>
    ${expenses.slice(0, 5).map(e => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--surface-container-high);">
        <div>
          <div style="font-size:var(--text-body-sm);font-weight:600;color:var(--on-surface);">${e.desc}</div>
          <div style="font-size:var(--text-label-sm);color:var(--on-surface-variant);">${e.cat} · ${e.date}</div>
        </div>
        <span style="font-weight:700;font-size:var(--text-body-sm);color:var(--error);">−${Currency.format(e.amount)}</span>
      </div>
    `).join('')}
  `;
}

// ── PENDING APPROVALS ─────────────────────────────────────────

function renderApprovals() {
  const container = document.getElementById('approvals-list');
  if (!container) return;

  container.innerHTML = Store.pendingApprovals.map(a => `
    <div class="approval-item">
      <div class="approval-icon">
        <span class="material-symbols-rounded">pending_actions</span>
      </div>
      <div class="approval-info">
        <div class="approval-id">${a.id} · ${a.type}</div>
        <div class="approval-desc">${a.item}</div>
        <div class="approval-by">Requested by: ${a.requestedBy}</div>
        <div class="approval-actions">
          <button class="btn btn-sm btn-primary" onclick="approveItem('${a.id}', this)">
            <span class="material-symbols-rounded">check</span> Approve
          </button>
          <button class="btn btn-sm btn-error" onclick="rejectItem('${a.id}', this)">
            <span class="material-symbols-rounded">close</span> Reject
          </button>
        </div>
      </div>
      <div class="approval-amount">${Currency.format(a.amount)}</div>
    </div>
  `).join('');
}

function approveItem(id, btn) {
  const item = btn.closest('.approval-item');
  if (item) {
    item.style.opacity = '0.5';
    item.style.pointerEvents = 'none';
    const actions = item.querySelector('.approval-actions');
    if (actions) actions.innerHTML = `<span class="badge badge-success"><span class="material-symbols-rounded" style="font-size:12px;">check</span> Approved</span>`;
  }
}

function rejectItem(id, btn) {
  const item = btn.closest('.approval-item');
  if (item) {
    item.style.opacity = '0.5';
    item.style.pointerEvents = 'none';
    const actions = item.querySelector('.approval-actions');
    if (actions) actions.innerHTML = `<span class="badge badge-error"><span class="material-symbols-rounded" style="font-size:12px;">close</span> Rejected</span>`;
  }
}
