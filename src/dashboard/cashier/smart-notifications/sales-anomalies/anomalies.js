/* anomalies.js — Sales Anomalies Detection Logic */

const AnomalyModule = (() => {
  const container = document.getElementById('anomaly-list');

  function getMockAnomalies() {
    return [
      {
        id: 'anomaly_001',
        type: 'drop',
        productName: 'Cordless Drills',
        value: '25%',
        trend: 'down',
        desc: 'Unexpected 25% drop in sales compared to the last 7-day average. Check for competitive pricing or inventory issues.',
        urgency: 'high'
      },
      {
        id: 'anomaly_002',
        type: 'surge',
        productName: 'Industrial Fasteners',
        value: 'Active Monitoring',
        trend: 'up',
        desc: 'Significant surge in demand detected. Daily volume is 140% higher than standard moving average.',
        urgency: 'medium'
      }
    ];
  }

  function render() {
    if (!container) return;

    const anomalies = getMockAnomalies();

    container.innerHTML = anomalies.map(a => `
      <div class="anomaly-card ${a.type} fade-in-up">
        <div class="anomaly-header">
          <span class="anomaly-type">${a.type.toUpperCase()} DETECTED</span>
          <div class="anomaly-badge">
            <span class="material-symbols-rounded" style="font-size: 16px;">trending_${a.trend}</span>
            ${a.value}
          </div>
        </div>
        <div class="anomaly-content">
          <h3>${a.productName}</h3>
          <p class="anomaly-desc">${a.desc}</p>
        </div>
        <div class="anomaly-footer">
          <button class="btn btn-secondary btn-sm" onclick="alert('Viewing detailed analytics for ${a.productName}...')">
            Review Analytics
          </button>
        </div>
      </div>
    `).join('');
  }

  return { init: render };
})();

document.addEventListener('DOMContentLoaded', AnomalyModule.init);
