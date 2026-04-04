/* ============================================================
   store.js — Store Info Settings Panel
   ============================================================ */

const StoreSettings = (() => {
  const KEY = 'precision_pos_store_info';

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
  }

  function init() {
    const saved = load();
    const set = (id, val) => { const el = document.getElementById(id); if (el && val) el.value = val; };
    set('s-store-name', saved.storeName);
    set('s-store-id',   saved.storeId);
    set('s-manager',    saved.manager);
    set('s-address',    saved.address);
    set('s-phone',      saved.phone);
    set('s-email',      saved.email);
  }

  function save() {
    const get = (id) => document.getElementById(id)?.value.trim() || '';
    const data = {
      storeName: get('s-store-name'),
      storeId:   get('s-store-id'),
      manager:   get('s-manager'),
      address:   get('s-address'),
      phone:     get('s-phone'),
      email:     get('s-email'),
    };
    localStorage.setItem(KEY, JSON.stringify(data));
    const el = document.getElementById('store-status');
    if (el) {
      el.textContent = '✓ Store info saved successfully.';
      el.className = 'region-status-msg success';
      el.style.display = 'inline-block';
      setTimeout(() => el.style.display = 'none', 3500);
    }
  }

  return { init, save, load };
})();

StoreSettings.init();
