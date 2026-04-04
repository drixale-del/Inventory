/* ============================================================
   receipts.js — Receipt Settings Panel
   ============================================================ */

const ReceiptSettings = (() => {
  const KEY = 'precision_pos_receipts';

  const DEFAULTS = { autoprint: false, emailReceipt: true, includeLogo: true };

  function load() {
    try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY)) }; } catch { return { ...DEFAULTS }; }
  }

  function init() {
    const prefs = load();
    const ids = { autoprint: 'toggle-autoprint', emailReceipt: 'toggle-email-receipt', includeLogo: 'toggle-logo' };
    for (const [key, id] of Object.entries(ids)) {
      const btn = document.getElementById(id);
      if (btn && prefs[key]) btn.classList.add('on');
    }
    const footer = document.getElementById('r-footer');
    const header = document.getElementById('r-header');
    if (footer && prefs.footer) footer.value = prefs.footer;
    if (header && prefs.header) header.value = prefs.header;
  }

  function toggle(key, btn) {
    const prefs = load();
    prefs[key] = !prefs[key];
    btn.classList.toggle('on', prefs[key]);
    localStorage.setItem(KEY, JSON.stringify(prefs));
  }

  function save() {
    const prefs = load();
    prefs.footer = document.getElementById('r-footer')?.value.trim() || '';
    prefs.header = document.getElementById('r-header')?.value.trim() || '';
    localStorage.setItem(KEY, JSON.stringify(prefs));
    const el = document.getElementById('receipt-status');
    if (el) {
      el.textContent = '✓ Receipt settings saved.';
      el.className = 'region-status-msg success';
      el.style.display = 'inline-block';
      setTimeout(() => el.style.display = 'none', 3500);
    }
  }

  return { init, toggle, save, load };
})();

ReceiptSettings.init();
