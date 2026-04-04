/* ============================================================
   PRECISION POS — PUSH NOTIFICATIONS ENGINE
   Native OS integration and event-driven business alerts.
   ============================================================ */

const NotificationEngine = (() => {
  const SETTINGS_KEY = 'precision_pos_notification_settings';
  
  let settings = {
    enabled: true,
    bigSaleThreshold: 1000,
    notifyStockouts: true,
    notifyTasks: true
  };

  function init() {
    _loadSettings();
    _requestPermission();
    
    console.log('[Notifications] Push Engine initialized.');

    // 1. Listen for Sales (Big Sale Alert)
    window.addEventListener('saleCompleted', (e) => {
      const { txnId, total, isSynced } = e.detail;
      // We only notify on the first completion (if not already synced via Offline Mode logic)
      if (!isSynced && total >= settings.bigSaleThreshold) {
        _push(`🚀 Big Sale! ${Currency?.format(total) || '$' + total}`, `Transaction #${txnId} just processed. High volume alert.`);
      }
    });

    // 2. Listen for Stock Alerts (Stockouts)
    window.addEventListener('stockAlert', (e) => {
      if (settings.notifyStockouts) {
        const { productName, sku, currentStock } = e.detail;
        if (currentStock === 0) {
          _push(`⚠️ Stockout: ${productName}`, `SKU: ${sku} is completely out of stock. Reorder immediately.`);
        }
      }
    });

    // 3. Listen for Critical System Alerts
    window.addEventListener('criticalAlert', (e) => {
      if (settings.notifyTasks) {
        _push(`🚨 Critical: ${e.detail.title}`, e.detail.message);
      }
    });
  }

  function _requestPermission() {
    if (!("Notification" in window)) {
      console.warn("[Notifications] Browser/Electron does not support desktop notifications.");
      return;
    }

    if (Notification.permission !== "granted" && Notification.permission !== "denied") {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') console.log("[Notifications] Permission granted.");
      });
    }
  }

  function _push(title, body) {
    if (!settings.enabled || Notification.permission !== "granted") return;

    try {
      const n = new Notification(title, {
        body: body,
        icon: '../../assets/Public/Images/logo.png', // Branding
        silent: false
      });

      n.onclick = () => {
        window.focus();
        n.close();
      };
    } catch (err) {
      console.error("[Notifications] Error pushing alert:", err);
    }
  }

  // ── SETTINGS ────────────────────────────────────────────────
  function _loadSettings() {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) settings = { ...settings, ...JSON.parse(saved) };
  }

  function saveSettings(newSettings) {
    settings = { ...settings, ...newSettings };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    console.log("[Notifications] Settings updated:", settings);
  }

  return { init, saveSettings, getSettings: () => settings };
})();

// Auto-init
if (typeof window !== 'undefined') {
  NotificationEngine.init();
}
