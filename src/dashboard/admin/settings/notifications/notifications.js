/* ============================================================
   notifications.js — Notification Settings Panel
   ============================================================ */

const NotifSettings = (() => {
  const KEY = 'precision_pos_notifications';

  const DEFAULTS = { lowStock: true, dailySummary: true, supplierOrders: false, approvals: true, threshold: 10 };

  function load() {
    try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY)) }; } catch { return { ...DEFAULTS }; }
  }

  function init() {
    const prefs = load();
    const ids = {
      lowStock:       'toggle-low-stock',
      dailySummary:   'toggle-daily-summary',
      supplierOrders: 'toggle-supplier-orders',
      approvals:      'toggle-approvals',
    };
    for (const [key, id] of Object.entries(ids)) {
      const btn = document.getElementById(id);
      if (btn && prefs[key]) btn.classList.add('on');
    }
    const th = document.getElementById('n-threshold');
    if (th) th.value = prefs.threshold;
  }

  function toggle(key, btn) {
    const prefs = load();
    prefs[key] = !prefs[key];
    btn.classList.toggle('on', prefs[key]);
    localStorage.setItem(KEY, JSON.stringify(prefs));
  }

  function save() {
    const prefs = load();
    prefs.threshold = parseInt(document.getElementById('n-threshold')?.value) || 10;
    localStorage.setItem(KEY, JSON.stringify(prefs));
    const el = document.getElementById('notif-status');
    if (el) {
      el.textContent = '✓ Notification preferences saved.';
      el.className = 'region-status-msg success';
      el.style.display = 'inline-block';
      setTimeout(() => el.style.display = 'none', 3500);
    }
  }

  function getLowStockThreshold() { return load().threshold; }

  return { init, toggle, save, load, getLowStockThreshold };
})();

NotifSettings.init();
