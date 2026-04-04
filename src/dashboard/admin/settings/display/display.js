/* ============================================================
   display.js — Display Preferences Settings Panel
   ============================================================ */

const DisplaySettings = (() => {
  const KEY = 'precision_pos_display';

  const DEFAULTS = {
    dark:       false,
    compact:    true,
    animations: true,
    sidebar:    false,
  };

  function load() {
    try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY)) }; } catch { return { ...DEFAULTS }; }
  }

  function save(prefs) {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  }

  function init() {
    const prefs = load();
    const ids = { dark: 'toggle-dark', compact: 'toggle-compact', animations: 'toggle-animations', sidebar: 'toggle-sidebar' };
    for (const [key, id] of Object.entries(ids)) {
      const btn = document.getElementById(id);
      if (btn && prefs[key]) btn.classList.add('on');
    }
  }

  function toggle(key, btn) {
    const prefs = load();
    prefs[key] = !prefs[key];
    btn.classList.toggle('on', prefs[key]);
    save(prefs);
  }

  function getPrefs() { return load(); }

  return { init, toggle, getPrefs };
})();

DisplaySettings.init();
