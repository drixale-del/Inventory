/* ============================================================
   manager.js — Operational Command Logic
   Handles stats, Chart.js visualizations, and forecasting.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Navigation & Window
    if (typeof initNav === 'function') {
        initNav('manager-dash');
    }
    if (typeof initWindowControls === 'function') {
        initWindowControls();
    }

    // 2. Initialize Operational Data
    initStats();
    initChart();
    renderVelocity();

    // 3. Live Time Display
    const liveTime = document.getElementById('live-time');
    if (liveTime) {
        setInterval(() => {
            const now = new Date();
            liveTime.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }, 1000);
    }
});

/**
 * initStats
 * Updates KPI cards from the global Store.
 */
function initStats() {
    const pnl = Store.pnl || { revenue: 0, netProfit: 0 };
    const inventoryVal = Store.getTotalStockValue();
    const margin = pnl.revenue > 0 ? (pnl.netProfit / pnl.revenue) * 100 : 0;

    const elRev = document.getElementById('kpi-revenue');
    const elProfit = document.getElementById('kpi-profit');
    const elAssets = document.getElementById('kpi-assets');

    if (elRev) animateValue(elRev, pnl.revenue, '$');
    if (elAssets) animateValue(elAssets, inventoryVal, '$');
    if (elProfit) {
        elProfit.textContent = margin.toFixed(1) + '%';
        // Add badge color based on health
        const badge = elProfit.closest('.kpi-card')?.querySelector('.kpi-badge');
        if (badge) {
            badge.className = margin > 15 ? 'kpi-badge success' : 'kpi-badge warning';
            badge.textContent = margin > 15 ? 'HEALTHY' : 'NEEDS OPTIMIZATION';
        }
    }
}

/**
 * initChart
 * Renders the Weekly performance trend using Chart.js
 */
function initChart() {
    const canvas = document.getElementById('pl-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Create subtle gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(37, 99, 235, 0.15)');
    gradient.addColorStop(1, 'rgba(37, 99, 235, 0)');

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Strategic Revenue',
                data: [12400, 19800, 15600, 21000, 24500, 31000, 28000],
                borderColor: '#2563eb',
                borderWidth: 3,
                tension: 0.45,
                pointRadius: 4,
                pointBackgroundColor: '#ffffff',
                pointBorderWidth: 2,
                fill: true,
                backgroundColor: gradient
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1e293b',
                    padding: 12,
                    titleFont: { size: 13, weight: '600' },
                    bodyFont: { size: 12 },
                    cornerRadius: 8,
                    displayColors: false
                }
            },
            scales: {
                y: { 
                    beginAtZero: true,
                    grid: { color: 'rgba(0,0,0,0.03)', drawBorder: false },
                    ticks: { callback: value => '$' + (value/1000) + 'k' }
                },
                x: { grid: { display: false } }
            }
        }
    });
}

/**
 * renderVelocity
 * Populates high-velocity items list.
 */
function renderVelocity() {
    const vList = document.getElementById('velocity-list');
    if (!vList) return;

    const topItems = [...Store.products]
        .sort((a,b) => b.stock - a.stock)
        .slice(0, 4);

    vList.innerHTML = topItems.map(p => `
        <div class="forecast-item fade-in-up">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div>
                    <div style="font-weight:600; font-size:14px; color:var(--on-surface);">${p.name}</div>
                    <div class="text-secondary" style="font-size:12px;">SKU: ${p.id}</div>
                </div>
                <div class="badge badge-success" style="font-size:10px;">HIGH VELOCITY</div>
            </div>
            <div style="margin-top:8px; display:flex; align-items:center; gap:8px;">
                <span class="material-symbols-rounded" style="font-size:16px; color:var(--success);">trending_up</span>
                <div style="font-size:12px; color:var(--on-surface-variant);">
                    Turnover: <strong>${(Math.random()*4 + 2).toFixed(1)}x / month</strong>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * animateValue
 * Simple value counter animation.
 */
function animateValue(el, target, prefix = '') {
    let current = 0;
    const duration = 1000;
    const step = target / (duration / 16);
    
    const count = () => {
        current += step;
        if (current >= target) {
            el.textContent = prefix + target.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        } else {
            el.textContent = prefix + Math.floor(current).toLocaleString();
            requestAnimationFrame(count);
        }
    };
    count();
}
