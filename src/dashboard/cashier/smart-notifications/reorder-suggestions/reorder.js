/* reorder.js — Smart Reorder Suggestions Logic */

const ReorderModule = (() => {
  const container = document.getElementById('reorder-list');

  function getMockSuggestions() {
    return [
      {
        id: 'reorder_001',
        productName: 'Titanium Drill Bit Set',
        quantity: 50,
        supplierName: 'Steel Masters Ltd',
        urgency: 'high'
      },
      {
        id: 'reorder_002',
        productName: 'Cordless Impact Driver',
        quantity: 20,
        supplierName: 'PowerTools Co.',
        urgency: 'medium'
      }
    ];
  }

  function render() {
    if (!container) return;

    const suggestions = getMockSuggestions();

    if (suggestions.length === 0) {
      container.innerHTML = `
        <div class="reorder-empty-state">
          <span class="material-symbols-rounded" style="font-size: 48px; margin-bottom: 16px;">check_circle</span>
          <h3>All stock levels are healthy</h3>
          <p>No reorder suggestions at this time.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = suggestions.map(s => `
      <div class="reorder-card fade-in-up">
        <div class="reorder-icon-box">
          <span class="material-symbols-rounded">inventory_2</span>
        </div>
        <div class="reorder-details">
          <div class="reorder-meta">${s.urgency.toUpperCase()} PRIORITY</div>
          <div class="reorder-suggestion">
            Order <span>${s.quantity} units</span> of '${s.productName}' from <strong>${s.supplierName}</strong> now.
          </div>
        </div>
        <div class="reorder-actions">
          <button class="btn btn-primary" onclick="alert('Drafting order for ${s.productName}...')">
            <span class="material-symbols-rounded">shopping_cart_checkout</span>
            Draft Order
          </button>
          <button class="btn btn-secondary btn-icon" onclick="alert('Dismissed')">
            <span class="material-symbols-rounded">close</span>
          </button>
        </div>
      </div>
    `).join('');
  }

  return { init: render };
})();

document.addEventListener('DOMContentLoaded', ReorderModule.init);
