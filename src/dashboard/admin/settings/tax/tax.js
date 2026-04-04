/* ============================================================
   tax.js — Tax & Currency Settings Panel
   ============================================================ */

const TaxSettings = (() => {
  const KEY = 'precision_pos_tax';

  const DEFAULTS = { rate: 8, name: 'Sales Tax', reg: '', taxInclusive: false, showOnReceipt: true };

  function load() {
    try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY)) }; } catch { return { ...DEFAULTS }; }
  }

  function init() {
    const prefs = load();

    const rate = document.getElementById('t-rate');
    const name = document.getElementById('t-name');
    const reg  = document.getElementById('t-reg');
    if (rate) rate.value = prefs.rate;
    if (name) name.value = prefs.name;
    if (reg  && prefs.reg) reg.value = prefs.reg;

    const ids = { taxInclusive: 'toggle-tax-inclusive', showOnReceipt: 'toggle-tax-receipt' };
    for (const [key, id] of Object.entries(ids)) {
      const btn = document.getElementById(id);
      if (btn && prefs[key]) btn.classList.add('on');
    }
  }

  function toggle(key, btn) {
    const prefs = load();
    prefs[key] = !prefs[key];
    btn.classList.toggle('on', prefs[key]);
    localStorage.setItem(KEY, JSON.stringify(prefs));
  }

  function save() {
    const prefs = load();
    prefs.rate = parseFloat(document.getElementById('t-rate')?.value) || 0;
    prefs.name = document.getElementById('t-name')?.value.trim() || 'Sales Tax';
    prefs.reg  = document.getElementById('t-reg')?.value.trim()  || '';
    localStorage.setItem(KEY, JSON.stringify(prefs));
    // Broadcast so POS picks up new rate
    window.dispatchEvent(new CustomEvent('taxUpdated', { detail: prefs }));
    const el = document.getElementById('tax-status');
    if (el) {
      el.textContent = `✓ Tax rate set to ${prefs.rate}%.`;
      el.className = 'region-status-msg success';
      el.style.display = 'inline-block';
      setTimeout(() => el.style.display = 'none', 3500);
    }
  }

  function getRate() { return load().rate / 100; }

  return { init, toggle, save, load, getRate };
})();

TaxSettings.init();
