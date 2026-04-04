/* margins.js — Profit Margin Alerts Logic */

const MarginModule = (() => {
  const container = document.getElementById('margin-list');

  function getMockMargins() {
    return [
      {
        id: 'margin_001',
        productName: 'Bulk Screws (500pk)',
        currentMargin: 12,
        threshold: 15,
        advice: 'Adjust pricing to min $12.50'
      },
      {
        id: 'margin_002',
        productName: 'Economy HVAC Filter',
        currentMargin: 8,
        threshold: 15,
        advice: 'Discontinue or re-negotiate'
      }
    ];
  }

  function render() {
    if (!container) return;

    const margins = getMockMargins();

    container.innerHTML = margins.map(m => `
      <div class="margin-card fade-in-up">
        <div class="margin-header">
          <div class="margin-product-name">${m.productName}</div>
          <div class="margin-value">
            ${m.currentMargin}%
            <span>Margin</span>
          </div>
        </div>
        <div class="margin-progress-bar">
          <div class="margin-progress-fill" style="width: ${m.currentMargin}%"></div>
        </div>
        <div class="margin-advice">
          ${m.advice}
        </div>
        <div class="margin-footer">
          <button class="btn btn-secondary btn-sm" style="width: 100%" onclick="alert('Opening price editor for ${m.productName}...')">
            Refactor Pricing
          </button>
        </div>
      </div>
    `).join('');
  }

  return { init: render };
})();

document.addEventListener('DOMContentLoaded', MarginModule.init);
