/* ============================================================
   pricing.js — Dynamic Pricing Engine
   ============================================================ */

const PricingEngine = (() => {

  function getSalesVolume(sku) {
    if (typeof Store === 'undefined' || !Store.ledger) return 0;
    let count = 0;
    Store.ledger.forEach(tx => {
      tx.items.forEach(item => {
        if (item.sku === sku || item.id === sku) count += item.qty;
      });
    });
    return count;
  }

  function analyzePrices() {
    if (typeof Store === 'undefined' || !Store.products) return [];
    
    const suggestions = [];
    
    Store.products.forEach(p => {
      const vol = getSalesVolume(p.sku);
      
      // Calculate Margin mathematically
      const margin = p.price > 0 ? (p.price - p.cost) / p.price : 0;
      
      // SCENARIO 1: High Demand, Low Margin -> Increase Price
      if (vol > 20 && margin < 0.40) {
        const newPrice = p.price * 1.15; // +15%
        suggestions.push({
          id: p.id,
          sku: p.sku,
          name: p.name,
          emoji: p.emoji,
          type: 'increase',
          rationale: `High Sales Velocity (${vol} units). Demand is out-pacing margin. Marking up captures lost intrinsic value securely.`,
          oldPrice: p.price,
          newPrice: newPrice,
          marginDiff: ((newPrice - p.cost) / newPrice) - margin
        });
      }
      
      // SCENARIO 2: Zero Demand, High Stock -> Decrease Price
      else if (vol === 0 && p.stock > 5) {
        // Only decrease if we don't breach safety cost limits (-5% markup min)
        const newPrice = p.price * 0.85; // -15%
        if (newPrice > p.cost * 1.05) {
          suggestions.push({
            id: p.id,
            sku: p.sku,
            name: p.name,
            emoji: p.emoji,
            type: 'decrease',
            rationale: `Stagnant. Zero ledger movement despite having ${p.stock} units sitting. A fast 15% discount clears physical inventory.`,
            oldPrice: p.price,
            newPrice: newPrice,
            marginDiff: ((newPrice - p.cost) / newPrice) - margin
          });
        }
      }
    });

    return suggestions;
  }

  function applySuggestion(prodId, newPrice) {
    if (typeof Store === 'undefined' || !Store.products) return;
    const idx = Store.products.findIndex(p => p.id === prodId);
    if (idx !== -1) {
      Store.products[idx].price = newPrice;
      if (typeof Store.saveProducts === 'function') {
        Store.saveProducts(Store.products);
      }
      window.dispatchEvent(new Event('currencyUpdated')); // Global re-render hook wrapper
      renderDashboard();
    }
  }

  function rejectSuggestion(prodId) {
    // Optionally we could track "Ignored" suggestions, but for now we simply visually dismiss.
    const el = document.getElementById(`sug-card-${prodId}`);
    if (el) {
      el.style.display = 'none';
      checkEmptyState();
    }
  }

  function checkEmptyState() {
    const list = document.getElementById('suggestion-list');
    if (!list) return;
    const visibleCards = list.querySelectorAll('.suggestion-card:not([style*="display: none"])');
    if (visibleCards.length === 0) {
      list.innerHTML = `
        <div class="suggestion-empty fade-in-up">
          <span class="material-symbols-rounded" style="font-size: 48px; opacity: 0.5; margin-bottom: 8px; display:block;">query_stats</span>
          <div style="font-size:18px; font-weight:600; color:var(--on-surface);">Catalog Optimized</div>
          <div>No outstanding dynamic pricing recommendations exist currently based on present velocity models.</div>
        </div>
      `;
    }
  }

  function renderDashboard() {
    const list = document.getElementById('suggestion-list');
    if (!list) return;

    const suggestions = analyzePrices();
    
    // Update KPI counters
    const upCount = suggestions.filter(s => s.type === 'increase').length;
    const downCount = suggestions.filter(s => s.type === 'decrease').length;
    
    const kTot = document.getElementById('pr-kpi-total');
    const kUp  = document.getElementById('pr-kpi-up');
    const kDn  = document.getElementById('pr-kpi-down');
    if (kTot) kTot.textContent = suggestions.length;
    if (kUp)  kUp.textContent = upCount;
    if (kDn)  kDn.textContent = downCount;

    initMarginChart();

    if (suggestions.length === 0) {
      checkEmptyState();
      return;
    }

    list.innerHTML = suggestions.map(s => {
      const isUp = s.type === 'increase';
      const upClass = isUp ? 'sug-up' : 'sug-down';
      const icon = isUp ? 'trending_up' : 'trending_down';
      const priceClass = isUp ? 'up' : 'down';
      const fOld = Currency ? Currency.format(s.oldPrice) : `$${s.oldPrice.toFixed(2)}`;
      const fNew = Currency ? Currency.format(s.newPrice) : `$${s.newPrice.toFixed(2)}`;
      
      return `
        <div class="suggestion-card fade-in-up" id="sug-card-${s.id}">
          <div class="sug-icon ${upClass}">
            <span class="material-symbols-rounded">${icon}</span>
          </div>
          <div class="sug-details">
            <div class="sug-title">${s.emoji || '📦'} ${s.name} <span style="font-weight:400;color:var(--on-surface-variant);font-size:var(--text-body-sm);margin-left:8px;">${s.sku}</span></div>
            <div class="sug-desc">${s.rationale}</div>
          </div>
          <div class="sug-numbers">
            <div class="sug-old-price">${fOld}</div>
            <span class="material-symbols-rounded sug-arrow">arrow_forward</span>
            <div class="sug-new-price ${priceClass}">${fNew}</div>
            <div style="font-size:12px;color:var(--on-surface-variant);display:flex;flex-direction:column;align-items:flex-end;">
               <span style="color:${isUp ? '#2e7d32' : '#c62828'}; font-weight:700;">${isUp ? '+' : ''}${(s.marginDiff * 100).toFixed(1)}% margin</span>
            </div>
          </div>
          <div class="sug-actions">
            <button class="btn btn-secondary btn-icon" onclick="PricingEngine.rejectSuggestion('${s.id}')" title="Dismiss">
              <span class="material-symbols-rounded">close</span>
            </button>
            <button class="btn btn-primary" onclick="PricingEngine.applySuggestion('${s.id}', ${s.newPrice.toFixed(2)})">
              Apply Update
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderDashboard() {
    // (Previous logic remains the same, I'm just adding the chart hook above)
  }

  let marginChartSource = null;

  function initMarginChart() {
    if (typeof Chart === 'undefined' || !Store.products) return;
    const ctx = document.getElementById('pr-chart-margins');
    if (!ctx) return;

    if (marginChartSource) marginChartSource.destroy();

    const labels = Store.products.map(p => p.sku);
    const margins = Store.products.map(p => {
      const m = p.price > 0 ? (p.price - p.cost) / p.price : 0;
      return (m * 100).toFixed(1);
    });

    marginChartSource = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Margin %',
          data: margins,
          backgroundColor: margins.map(m => m < 40 ? '#f44336' : '#4caf50'),
          borderRadius: 4
        }]
      },
      options: {
        plugins: { legend: { display: false } },
        scales: {
          y: { 
            beginAtZero: true, 
            max: 100, 
            ticks: { callback: v => v + '%' },
            grid: { color: 'rgba(0,0,0,0.05)' }
          },
          x: { display: false }
        },
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }

  return { renderDashboard, applySuggestion, rejectSuggestion };
})();

document.addEventListener('DOMContentLoaded', () => {
  PricingEngine.renderDashboard();
});
