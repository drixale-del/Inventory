/* ============================================================
   lifecycle.js — Product Age and Phase-Out logic
   ============================================================ */

const LifecycleEngine = (() => {

  // Auto-fill missing mock dates
  function initProductDates() {
    if (typeof Store === 'undefined' || !Store.products) return;

    const baseData = Store.products;
    let modified = false;
    
    baseData.forEach((p, idx) => {
      if (!p.dateAdded) {
        // Mock a staggered historical date anywhere from 10 days ago to 200 days ago
        const randomDays = Math.floor(Math.random() * 180) + 10;
        const d = new Date();
        d.setDate(d.getDate() - randomDays);
        
        // Force specific SKUs to be "Dead Stock" for demo purposes
        if (idx === 3 || idx === 7) d.setDate(d.getDate() - 150);
        // Force some to be "New"
        if (idx === 1) d.setDate(d.getDate() - 5);

        p.dateAdded = d.toISOString().split('T')[0];
        modified = true;
      }
    });

    if (modified && typeof Store.saveProducts === 'function') {
      Store.saveProducts(baseData);
    }
  }

  function getProductSalesVolume(sku) {
    if (typeof Store === 'undefined' || !Store.ledger) return 0;
    let count = 0;
    Store.ledger.forEach(tx => {
      tx.items.forEach(item => {
        if (item.sku === sku || item.id === sku) count += item.qty;
      });
    });
    return count;
  }

  function calculateLifecycles() {
    initProductDates();
    if (typeof Store === 'undefined' || !Store.products) return [];

    const now = new Date();

    return Store.products.map(p => {
      let ageDays = 0;
      if (p.dateAdded) {
        const added = new Date(p.dateAdded);
        ageDays = Math.floor((now - added) / (1000 * 60 * 60 * 24));
      }

      const salesVolume = getProductSalesVolume(p.sku);
      
      let phase = 'Core Product';
      if (ageDays < 30) {
        phase = 'New Arrival';
      } else if (ageDays > 120 && salesVolume === 0) {
        phase = 'Dead Stock';
      } else if (ageDays > 90 && salesVolume < 5) {
        phase = 'Aging Phase-Out';
      } else if (salesVolume > 20) {
        phase = 'Core Product'; // High velocity overrides age
      }

      return {
        ...p,
        ageDays,
        salesVolume,
        phase
      };
    });
  }

  function renderDashboard() {
    const kpiNew   = document.getElementById('lc-kpi-new');
    const kpiCore  = document.getElementById('lc-kpi-core');
    const kpiAging = document.getElementById('lc-kpi-aging');
    const kpiDead  = document.getElementById('lc-kpi-dead');
    
    if (!kpiNew) return; // Not on lifecycle page

    const data = calculateLifecycles();

    const newArr = data.filter(d => d.phase === 'New Arrival');
    const coreArr = data.filter(d => d.phase === 'Core Product');
    const agingArr = data.filter(d => d.phase === 'Aging Phase-Out');
    const deadArr = data.filter(d => d.phase === 'Dead Stock');

    kpiNew.textContent = newArr.length;
    kpiCore.textContent = coreArr.length;
    kpiAging.textContent = agingArr.length;
    kpiDead.textContent = deadArr.length;

    calculateDeadValue(deadArr);
    initCharts(newArr.length, coreArr.length, agingArr.length, deadArr.length);

    renderMatrixList('lc-list-dead', deadArr, 'Remove or heavily discount immediately.');
    renderMatrixList('lc-list-aging', agingArr, 'Consider promotions or slight discounts.');
    renderMatrixList('lc-list-new', newArr, 'Monitor initial sales velocity closely.');
  }

  function calculateDeadValue(deadArr) {
    const el = document.getElementById('lc-dead-val');
    if (!el) return;
    const total = deadArr.reduce((sum, p) => sum + (p.cost * (p.stock || 0)), 0);
    el.textContent = Currency ? Currency.format(total) : `$${total.toFixed(2)}`;
  }

  let distChartSource = null;
  let trendChartSource = null;

  function initCharts(n, c, a, d) {
    if (typeof Chart === 'undefined') return;

    // 1. Distribution Doughnut
    const ctxDist = document.getElementById('lc-chart-dist');
    if (ctxDist) {
      if (distChartSource) distChartSource.destroy();
      distChartSource = new Chart(ctxDist, {
        type: 'doughnut',
        data: {
          labels: ['New', 'Core', 'Aging', 'Dead'],
          datasets: [{
            data: [n, c, a, d],
            backgroundColor: ['#2196f3', '#4caf50', '#ffb300', '#f44336'],
            borderWidth: 0,
            hoverOffset: 10
          }]
        },
        options: {
          cutout: '70%',
          plugins: { legend: { display: false } },
          responsive: true,
          maintainAspectRatio: false
        }
      });
    }

    // 2. Health Trend (Mocked based on spread)
    const ctxTrend = document.getElementById('lc-chart-timeline');
    if (ctxTrend) {
      if (trendChartSource) trendChartSource.destroy();
      const pct = (d / (n+c+a+d || 1)) * 100;
      trendChartSource = new Chart(ctxTrend, {
        type: 'line',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [{
            label: 'Dead Stock % of Catalog',
            data: [2, 3, 5, 4, 3, pct.toFixed(1)],
            borderColor: '#f44336',
            backgroundColor: 'rgba(244, 67, 54, 0.1)',
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, grid: { display: false } },
            x: { grid: { display: false } }
          },
          responsive: true,
          maintainAspectRatio: false
        }
      });
    }
  }

  function renderMatrixList(containerId, items, emptyMsg) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (items.length === 0) {
      container.innerHTML = `<div style="padding:var(--space-4);text-align:center;color:var(--on-surface-variant);font-style:italic;">${emptyMsg}</div>`;
      return;
    }

    // Sort by age descending
    items.sort((a,b) => b.ageDays - a.ageDays);

    container.innerHTML = items.map(p => `
      <div class="matrix-list-item fade-in-up">
        <div class="matrix-prod-meta">
          <div style="font-size:20px;">${p.emoji || '📦'}</div>
          <div>
            <div class="matrix-prod-name">${p.name}</div>
            <div class="matrix-prod-sku">${p.sku}</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:var(--space-4);">
          <div class="matrix-prod-age">${p.ageDays} Days Old</div>
        <div style="display:flex;align-items:center;gap:var(--space-4);">
          <div class="matrix-prod-age">${p.ageDays} Days Old</div>
          <button class="btn btn-secondary btn-icon btn-sm" onclick="LifecycleEngine.openDetailsModal('${p.sku}')" title="Analyze">
            <span class="material-symbols-rounded">troubleshoot</span>
          </button>
        </div>
      </div>
    `).join('');
  }

  function openDetailsModal(sku) {
    const data = calculateLifecycles();
    const p = data.find(item => item.sku === sku);
    if (!p) return;

    const modal = document.getElementById('lc-modal');
    const body = document.getElementById('lc-modal-body');
    if (!modal || !body) return;

    const fCost = Currency ? Currency.format(p.cost) : `$${p.cost.toFixed(2)}`;
    const fPrice = Currency ? Currency.format(p.price) : `$${p.price.toFixed(2)}`;
    
    body.innerHTML = `
      <div style="display:flex; gap:var(--space-4); margin-bottom:var(--space-6); align-items:center;">
        <div style="font-size:48px; background:var(--surface-container-highest); padding:16px; border-radius:var(--round-lg);">${p.emoji || '📦'}</div>
        <div>
          <div style="font-size:var(--text-headline-sm); font-weight:700;">${p.name}</div>
          <div style="color:var(--on-surface-variant);">${p.sku} | ${p.category}</div>
        </div>
      </div>

      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:var(--space-4); margin-bottom:var(--space-6);">
        <div style="background:var(--surface-container-low); padding:12px; border-radius:var(--round-md);">
          <div style="font-size:12px; opacity:0.7; text-transform:uppercase;">Entry Date</div>
          <div style="font-weight:600;">${p.dateAdded}</div>
        </div>
        <div style="background:var(--surface-container-low); padding:12px; border-radius:var(--round-md);">
          <div style="font-size:12px; opacity:0.7; text-transform:uppercase;">Inventory Age</div>
          <div style="font-weight:600;">${p.ageDays} Days</div>
        </div>
        <div style="background:var(--surface-container-low); padding:12px; border-radius:var(--round-md);">
          <div style="font-size:12px; opacity:0.7; text-transform:uppercase;">Sales Velocity</div>
          <div style="font-weight:600;">${p.salesVolume} Units</div>
        </div>
        <div style="background:var(--surface-container-low); padding:12px; border-radius:var(--round-md);">
          <div style="font-size:12px; opacity:0.7; text-transform:uppercase;">Current Margin</div>
          <div style="font-weight:600;">${(((p.price - p.cost)/p.price)*100).toFixed(1)}%</div>
        </div>
      </div>

      <div style="padding:16px; border-radius:var(--round-lg); background: ${p.phase === 'Dead Stock' ? '#ffebee' : '#f5f5f5'}; border: 1px solid ${p.phase === 'Dead Stock' ? '#ef9a9a' : '#e0e0e0'};">
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px; font-weight:700; color:${p.phase === 'Dead Stock' ? '#c62828' : 'inherit'};">
          <span class="material-symbols-rounded">analytics</span>
          Engine Verdict: ${p.phase}
        </div>
        <div style="font-size:var(--text-body-sm); color:var(--on-surface-variant);">
          ${p.phase === 'Dead Stock' ? 'This item is occupying physical floor space with zero yield for over 120 days. Recommended action: Liquidate or Bundle.' : 'This item is performing within expected variance. No urgent action required.'}
        </div>
      </div>
    `;

    modal.classList.add('open');
  }

  function closeModal() {
    document.getElementById('lc-modal').classList.remove('open');
  }

  function getEngineData() {
    return calculateLifecycles();
  }

  return { renderDashboard, getEngineData, openDetailsModal, closeModal };
})();

// Auto-init dashboard if active
document.addEventListener('DOMContentLoaded', () => {
  LifecycleEngine.renderDashboard();
});

// Refresh hooks
window.addEventListener('currencyUpdated', () => {
  LifecycleEngine.renderDashboard();
});
