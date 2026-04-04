/* ============================================================
   PRECISION POS — CONNECTIVITY MONITOR
   Monitoring network status and managing offline states.
   ============================================================ */

const Connectivity = (() => {
  let isOnline = navigator.onLine;

  function init() {
    window.addEventListener('online',  () => _updateStatus(true));
    window.addEventListener('offline', () => _updateStatus(false));
    _updateStatus(isOnline);
    console.log(`[Connectivity] Monitor initialized. Initial state: ${isOnline ? 'ONLINE' : 'OFFLINE'}`);
  }

  function _updateStatus(online) {
    isOnline = online;
    document.body.classList.toggle('is-offline', !online);
    
    // Notify the system
    window.dispatchEvent(new CustomEvent('connectivityChanged', { 
      detail: { online } 
    }));
    
    console.log(`[Connectivity] Status changed: ${online ? 'ONLINE' : 'OFFLINE'}`);
  }

  return {
    init,
    isOnline: () => isOnline
  };
})();

// Auto-init
if (typeof window !== 'undefined') {
  Connectivity.init();
}
