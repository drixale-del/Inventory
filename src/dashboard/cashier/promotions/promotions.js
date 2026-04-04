/* ============================================================
   promotions.js — Campaign & Bundle Manager hook
   ============================================================ */

const PromoStore = (() => {
  const KEY = 'precision_pos_promotions';

  const SAMPLE = [
    { id: 'PR-100', code: 'SUMMER26', type: 'cart_discount', value: 15, status: 'Active', desc: '15% Off entire cart total for summer campaign.' },
    { id: 'PR-101', code: 'BUNDLE_TECH', type: 'bundle', skus: ['ELEC-MOU-001', 'ELEC-KEY-002'], value: 45.00, status: 'Active', desc: 'Buy the Wireless Mouse and Mechanical Keyboard together for a flat $45.00.' },
    { id: 'PR-102', code: 'CLEARANCE', type: 'cart_discount', value: 30, status: 'Inactive', desc: '30% Off Clearance items.' }
  ];

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : SAMPLE;
    } catch { return SAMPLE; }
  }

  function save(data) { localStorage.setItem(KEY, JSON.stringify(data)); }
  function getAll() { return load(); }
  
  function add(promo) {
    const data = load();
    const newId = 'PR-' + (100 + data.length);
    data.unshift({ id: newId, ...promo });
    save(data);
    return newId;
  }
  
  function toggleStatus(id) {
    const data = load();
    const idx = data.findIndex(p => p.id === id);
    if(idx !== -1) {
      data[idx].status = data[idx].status === 'Active' ? 'Inactive' : 'Active';
      save(data);
    }
  }

  function remove(id) { save(load().filter(p => p.id !== id)); }

  return { load, getAll, add, toggleStatus, remove };
})();

// Active Hook for POS.js
const PromotionEngine = (() => {
  
  // Applies loaded array of promos against the active cart
  // Modifies original cart array/total reference via callback or returning structured sub-totals
  function calculateDiscounts(cartItems) {
    const activePromos = PromoStore.getAll().filter(p => p.status === 'Active');
    let subtotal = 0;
    cartItems.forEach(item => subtotal += (item.qty * item.price));
    
    let discountAmount = 0;
    let appliedCodes = [];

    // 1. Process Bundles First (specific SKUs)
    const bundles = activePromos.filter(p => p.type === 'bundle');
    bundles.forEach(b => {
      // Check if ALL SKUs in bundle exist in cart
      const hasAll = b.skus.every(sku => cartItems.some(ci => ci.sku === sku));
      if (hasAll) {
        // Find current price of those items
        let currentBundlePrice = 0;
        b.skus.forEach(sku => {
          const matched = cartItems.find(ci => ci.sku === sku);
          if (matched) currentBundlePrice += matched.price; // Applies to 1 set
        });
        
        // If the bundle flat price is less than current retail, apply discount
        if (b.value < currentBundlePrice) {
          discountAmount += (currentBundlePrice - b.value);
          appliedCodes.push(b.code);
        }
      }
    });

    // 2. Process Cart-wide Discounts %
    const globalDiscounts = activePromos.filter(p => p.type === 'cart_discount');
    globalDiscounts.forEach(gd => {
      const remainingTotal = subtotal - discountAmount;
      if (remainingTotal > 0) {
        const off = remainingTotal * (gd.value / 100);
        discountAmount += off;
        appliedCodes.push(gd.code);
      }
    });

    return {
      subtotal: subtotal,
      discount: discountAmount,
      total: subtotal - discountAmount,
      codes: appliedCodes
    };
  }

  // UI Rendering
  function renderDashboard() {
    const grid = document.getElementById('promo-grid');
    if (!grid) return;

    const promos = PromoStore.getAll();
    grid.innerHTML = promos.map(p => {
      const isActive = p.status === 'Active';
      const badgeCls = isActive ? 'badge-primary' : 'badge-neutral';
      
      let valStr = '';
      if (p.type === 'cart_discount') valStr = `${p.value}% OFF Cart`;
      if (p.type === 'bundle') valStr = `Flat Bundle: ${Currency ? Currency.format(p.value) : '$'+p.value}`;

      return `
        <div class="promo-card fade-in-up">
          <div class="promo-card-header">
            <span class="promo-code">${p.code}</span>
            <span class="badge ${badgeCls}">${p.status}</span>
          </div>
          <div class="promo-title" style="margin-bottom:8px;">${valStr}</div>
          <div class="promo-details">${p.desc}</div>
          ${p.type === 'bundle' ? `<div style="font-size:12px;margin-bottom:12px;font-family:monospace;color:var(--primary);">SKUs: ${p.skus.join(' + ')}</div>` : ''}
          <div class="promo-footer">
            <button class="btn btn-secondary btn-icon" onclick="PromotionEngine.deletePromo('${p.id}')" title="Delete Promo"><span class="material-symbols-rounded">delete</span></button>
            <button class="btn ${isActive ? 'btn-error' : 'btn-primary'}" onclick="PromotionEngine.togglePromo('${p.id}')">
              ${isActive ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        </div>
      `;
    }).join('');

    initPerformanceChart();
  }

  let perfChartSource = null;

  function initPerformanceChart() {
    if (typeof Chart === 'undefined') return;
    const ctx = document.getElementById('pm-chart-performance');
    if (!ctx) return;

    if (perfChartSource) perfChartSource.destroy();

    const promos = PromoStore.getAll().filter(p => p.status === 'Active');
    const labels = promos.map(p => p.code);
    // Mocking redemption data for visual impact
    const redemptions = promos.map(() => Math.floor(Math.random() * 50) + 10);

    perfChartSource = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Valid Redemptions',
          data: redemptions,
          backgroundColor: '#6750a4',
          borderRadius: 8,
          barThickness: 32
        }]
      },
      options: {
        indexAxis: 'y',
        plugins: { legend: { display: false } },
        scales: {
          x: { beginAtZero: true, grid: { display: false } },
          y: { grid: { display: false } }
        },
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }

  function deletePromo(id) {
    if(confirm('Delete this promotion?')) {
      PromoStore.remove(id);
      renderDashboard();
    }
  }
  function togglePromo(id) {
    PromoStore.toggleStatus(id);
    renderDashboard();
  }

  function openModal() {
    document.getElementById('promo-modal').classList.add('open');
  }

  function closeModal() {
    document.getElementById('promo-modal').classList.remove('open');
    clearForm();
  }

  function clearForm() {
    ['pm-code', 'pm-value', 'pm-skus', 'pm-desc'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    document.getElementById('pm-type').value = 'cart_discount';
    toggleTypeFields();
  }

  function toggleTypeFields() {
    const type = document.getElementById('pm-type').value;
    const gVal = document.getElementById('group-value');
    const gSku = document.getElementById('group-skus');
    const lVal = document.getElementById('label-value');

    if (type === 'bundle') {
      lVal.textContent = 'Flat Bundle Price (Total)';
      gSku.style.display = 'block';
    } else {
      lVal.textContent = 'Discount Percentage (%)';
      gSku.style.display = 'none';
    }
  }

  function savePromo() {
    const code = document.getElementById('pm-code').value.trim().toUpperCase();
    const type = document.getElementById('pm-type').value;
    const val = parseFloat(document.getElementById('pm-value').value) || 0;
    const skusRaw = document.getElementById('pm-skus').value.trim();
    const desc = document.getElementById('pm-desc').value.trim();

    if (!code || !val) {
      alert('Missing required fields.');
      return;
    }

    const payload = {
      code,
      type,
      value: val,
      desc,
      status: 'Active'
    };

    if (type === 'bundle') {
      payload.skus = skusRaw.split(',').map(s => s.trim()).filter(s => s);
    }

    PromoStore.add(payload);
    closeModal();
    renderDashboard();
  }

  return { calculateDiscounts, renderDashboard, deletePromo, togglePromo, openModal, closeModal, toggleTypeFields, savePromo };
})();

// Init DOM
document.addEventListener('DOMContentLoaded', () => {
  PromotionEngine.renderDashboard();
});
window.addEventListener('currencyUpdated', () => {
  PromotionEngine.renderDashboard();
});
