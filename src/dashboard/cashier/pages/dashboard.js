/* ============================================================
   PRECISION POS — DASHBOARD RENDERER
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initTitlebar();
  initNav('cashier-dash');
  initLiveClock();
  renderKPIs();
  renderSalesChart();
  renderStockStatus();
  renderBestSellers();
  renderIntelligence();
});

// Re-render when currency changes
window.addEventListener('currencyUpdated', () => {
  renderSalesChart();
  renderBestSellers();
});

function initLiveClock() {
  const el = document.getElementById('live-time');
  function update() {
    if (!el) return;
    const now = new Date();
    el.textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
  update();
  setInterval(update, 1000);
}

function renderKPIs() {
  const lowStock = Store.getLowStockProducts();
  const lowEl = document.getElementById('kpi-low-stock');
  if (lowEl) lowEl.textContent = lowStock.length;
}

function renderSalesChart() {
  const ctx = document.getElementById('sales-chart');
  if (!ctx) return;

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Store.weekLabels,
      datasets: [{
        label: 'Revenue',
        data: Store.weeklyRevenue,
        backgroundColor: (ctx) => {
          const chart = ctx.chart;
          const { ctx: c, chartArea } = chart;
          if (!chartArea) return '#004655';
          const gradient = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, '#005f73');
          gradient.addColorStop(1, 'rgba(0,70,85,0.15)');
          return gradient;
        },
        borderRadius: 6,
        borderSkipped: false,
        hoverBackgroundColor: '#13677b',
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#2d3133',
          titleColor: '#eff1f3',
          bodyColor: '#bfc8cc',
          padding: 12,
          callbacks: {
            label: (ctx) => ` ${Currency.format(ctx.parsed.y)}`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: {
            color: '#6f797c',
            font: { family: 'Inter', size: 11, weight: '600' },
          },
        },
        y: {
          grid: { color: 'rgba(25,28,30,0.05)' },
          border: { display: false, dash: [4, 4] },
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

function renderStockStatus() {
  const container = document.getElementById('stock-status-list');
  if (!container) return;

  const items = [
    { name: 'Titanium Drill Bit Set', stock: 142, max: 200 },
    { name: 'LED Industrial Panel',   stock: 58,  max: 100 },
    { name: 'Carbon Steel Fasteners', stock: 7,   max: 200 },
    { name: 'Aura Beats Pro',         stock: 4,   max: 50 },
  ];

  container.innerHTML = items.map(item => {
    const pct = Math.round((item.stock / item.max) * 100);
    const level = pct > 40 ? 'high' : pct > 15 ? 'medium' : 'low';
    return `
      <div class="stock-item">
        <span style="font-size:var(--text-body-sm);font-weight:600;color:var(--on-surface);flex:1;">${item.name}</span>
        <span style="font-size:var(--text-label-sm);color:var(--on-surface-variant);margin-right:12px;">${item.stock}</span>
        <div class="stock-bar-track">
          <div class="stock-bar-fill ${level}" style="width:${pct}%;"></div>
        </div>
      </div>
    `;
  }).join('');
}

function renderBestSellers() {
  const container = document.getElementById('best-sellers-list');
  if (!container) return;

  const sellers = [
    { rank: '01', name: 'Titanium Drill Bit Set', sku: 'IND-9230-T', revenue: 12786 },
    { rank: '02', name: 'LED Industrial Panel',   sku: 'LIT-4421-P', revenue: 8442  },
    { rank: '03', name: 'Carbon Steel Fasteners', sku: 'FAS-1102-S', revenue: 5201  },
  ];

  container.innerHTML = sellers.map(s => `
    <div class="best-seller-item">
      <div class="best-seller-rank">${s.rank}</div>
      <div class="best-seller-info">
        <div class="best-seller-name">${s.name}</div>
        <div class="best-seller-sku">${s.sku}</div>
      </div>
      <div class="best-seller-revenue">${Currency.format(s.revenue)}</div>
    </div>
  `).join('');
}

function renderIntelligence() {
  if (!Store.products) return;
  
  // 1. Dead Stock Calc (Lightweight)
  const deadCount = Store.products.filter(p => p.stock > 0 && p.stock < 10).length; // Simplified for dash
  const elDead = document.getElementById('dash-dead-count');
  if (elDead) elDead.textContent = deadCount;

  // 2. Markup Opps (Velocity > high, Margin < target)
  const markupCount = Store.products.filter(p => {
    const margin = p.price > 0 ? (p.price - p.cost) / p.price : 0;
    return p.stock > 20 && margin < 0.45; // Simplified logic
  }).length;
  const elMarkup = document.getElementById('dash-markup-count');
  if (elMarkup) elMarkup.textContent = markupCount;
}
