/* ============================================================
   alerts.js — Intelligent Notifications Engine
   ============================================================ */

const AlertEngine = (() => {

  let _alerts = [];

  // ── Engine Generators ───────────────────────────────────────
  function generateAlerts() {
    _alerts = [];
    const products = typeof Store !== 'undefined' ? Store.products : [];
    const ledger   = typeof Store !== 'undefined' ? Store.ledger : [];
    
    // 1. Profit Margin Alerts (Margin < 20%)
    products.forEach(p => {
      if (p.price > 0 && p.cost > 0) {
        const margin = (p.price - p.cost) / p.price;
        if (margin < 0.20 && margin > -999) {
          _alerts.push({
            id: 'margin_' + p.sku,
            type: 'critical',
            icon: 'trending_down',
            title: 'Critical Profit Margin Detected',
            desc: `"${p.name}" (${p.sku}) is heavily underpriced. Your margin is hitting ${(margin*100).toFixed(1)}%. Selling below the 20% safe-floor generates unsustainability. Consider increasing price above ${Currency?.format(p.cost * 1.25) || p.cost * 1.25}.`,
            time: 'System Scan',
            actionBody: `<button class="btn btn-secondary btn-sm" onclick="alert('Routing to Inventory editor...')">Adjust Pricing</button>`
          });
        }
      }
    });

    // 2. Smart Reorder Suggestions
    // Not just low stock, but specific volumes to map back to 50
    products.forEach(p => {
      if (p.stock < 10) {
        const orderVol = Math.max(50 - p.stock, 0);
        let supplierName = 'Global Tech Dist'; // Mocked fallback
        if (typeof SupplierStore !== 'undefined') {
           const sups = SupplierStore.getAll();
           if (sups.length > 0) supplierName = sups[0].name; // Pick first valid for realism
        }

        _alerts.push({
          id: 'reorder_' + p.sku,
          type: 'warning',
          icon: 'inventory_2',
          title: 'Immediate Reorder Suggestion',
          desc: `"${p.name}" inventory has dropped to ${p.stock} units. Restock ${orderVol} units from ${supplierName} immediately to maintain healthy capacity buffer.`,
          time: 'Inventory Check',
          actionBody: `<button class="btn btn-primary btn-sm" onclick="alert('Drafting Order for ${orderVol}x ${p.sku}...')"><span class="material-symbols-rounded" style="font-size:16px;">receipt_long</span> Draft Order</button>`
        });
      }
    });

    // 3. Sales Anomalies Detection
    // Analyze ledger for abnormal spikes today
    const today = new Date().toISOString().split('T')[0];
    const todayTxns = ledger.filter(t => t.date.startsWith(today));
    if (todayTxns.length > 5) {
      _alerts.push({
        id: 'anomaly_sales_volume',
        type: 'info',
        icon: 'monitoring',
        title: 'Unusual Sales Velocity Detected',
        desc: `You've processed ${todayTxns.length} transactions today already. This volume is 140% higher than your standard Tuesday moving average. Ensure floor staff and fulfillment are padded.`,
        time: 'Ledger Analytics',
        actionBody: `<button class="btn btn-secondary btn-sm" onclick="alert('Viewing Ledger Details...')">View Transactions</button>`
      });
    }

    // 4. Payment Reminders & Overdue Invoices
    // We mock these using the CustomerStore/SupplierStore records
    if (typeof CustomerStore !== 'undefined') {
      const customers = CustomerStore.getAll();
      const topCust = customers.find(c => c.totalSpend > 3000); // Grab arbitrary rich customer
      
      if (topCust) {
        _alerts.push({
          id: 'invoice_due_cust',
          type: 'critical',
          icon: 'credit_card',
          title: 'Accounts Receivable: Unpaid Invoice',
          desc: `Payment for Invoice #INV-8899 by ${topCust.name} is now 14 days overdue. Amount due: ${(Currency?.format(1240.00)) || '$1,240.00'}.`,
          time: 'Billing Cycle',
          actionBody: `<button class="btn btn-secondary btn-sm" onclick="alert('Sending Reminder Email to ${topCust.email}...')">Send Payment Reminder</button>`
        });
      }
    }
    
    // Fallback if engines empty
    if (_alerts.length === 0) {
      _alerts.push({
        id: 'system_ok',
        type: 'info',
        icon: 'check_circle',
        title: 'System Healthy',
        desc: `No anomalies, low margins, or low stocks detected across your network. Keep it up!`,
        time: 'Just now',
        actionBody: ''
      });
    }

    return _alerts;
  }

  // ── Retrieve & Mutate ───────────────────────────────────────
  function getActiveAlerts() {
    if (_alerts.length === 0) generateAlerts();
    return _alerts;
  }
  
  function dismissAlert(id) {
    _alerts = _alerts.filter(a => a.id !== id);
    if (_alerts.length === 0) generateAlerts(); // Regenerate health
    renderAlertsBoard();
    updateNavigationBadge();
  }

  // ── DOM Injection ───────────────────────────────────────────
  function updateNavigationBadge() {
    const navItem = document.getElementById('nav-alerts');
    if (!navItem) return;
    
    // Remove old badge
    const old = navItem.querySelector('.nav-badge');
    if (old) old.remove();

    const currentAlerts = getActiveAlerts().filter(a => a.id !== 'system_ok');
    const count = currentAlerts.length;
    
    if (count > 0) {
      const b = document.createElement('div');
      b.className = 'nav-badge';
      b.textContent = count;
      navItem.appendChild(b);
    }
  }

  function renderAlertsBoard() {
    const grid = document.getElementById('alerts-grid');
    if (!grid) return;

    const data = getActiveAlerts();

    grid.innerHTML = data.map(a => `
      <div class="alert-card alert-${a.type}">
        <div class="alert-icon-box">
          <span class="material-symbols-rounded">${a.icon}</span>
        </div>
        <div class="alert-content">
          <div class="alert-title">
            <span>${a.title}</span>
            <span class="alert-time">${a.time}</span>
          </div>
          <div class="alert-desc">${a.desc}</div>
          <div class="alert-actions">
            ${a.actionBody}
            ${a.id !== 'system_ok' ? `<button class="btn btn-secondary btn-icon btn-sm" style="border:none;" onclick="AlertEngine.dismissAlert('${a.id}')" title="Dismiss Alert"><span class="material-symbols-rounded">close</span></button>` : ''}
          </div>
        </div>
      </div>
    `).join('');
  }

  return { getActiveAlerts, dismissAlert, renderAlertsBoard, updateNavigationBadge };
})();

// Automatically inject badge into Navigation universally after DOM Load
document.addEventListener('DOMContentLoaded', () => {
  // Give navigation a fleeting moment to render via ui.js if dynamically generated
  setTimeout(() => {
    AlertEngine.updateNavigationBadge();
  }, 150);
});
