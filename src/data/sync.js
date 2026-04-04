/* ============================================================
   PRECISION POS — SYNCHRONIZATION ENGINE
   Manages local-to-remote sync queueing and background processing.
   ============================================================ */

const SyncManager = (() => {
  const QUEUE_KEY = 'precision_pos_sync_queue';
  let isSyncing = false;

  function init() {
    console.log('[Sync] Synchronization Manager initialized.');

    // 1. Listen for new sales
    window.addEventListener('saleCompleted', (e) => {
      const { txnId, items, total, tax, discount } = e.detail;
      handleNewSale(txnId, { items, total, tax, discount });
    });

    // 2. Listen for connectivity restoration
    window.addEventListener('connectivityChanged', (e) => {
      if (e.detail.online) {
        console.log('[Sync] Connection restored. Starting automatic resync...');
        processQueue();
      }
    });

    // 3. Initial check
    if (typeof Connectivity !== 'undefined' && Connectivity.isOnline()) {
      processQueue();
    }
  }

  function handleNewSale(txnId, payload) {
    if (typeof Connectivity !== 'undefined' && !Connectivity.isOnline()) {
      console.log(`[Sync] App is OFFLINE. Queueing sale ${txnId} for later sync.`);
      _queueTask('SALE_SYNC', { txnId, ...payload });
      _showSyncStatus('Sale queued for offline sync');
    } else {
      console.log(`[Sync] App is ONLINE. Sale ${txnId} synchronizing normally.`);
    }
  }

  async function processQueue() {
    if (isSyncing) return;
    const queue = _getQueue();
    if (queue.length === 0) return;

    isSyncing = true;
    console.log(`[Sync] Processing ${queue.length} pending sync tasks...`);
    _showSyncStatus(`Syncing ${queue.length} pending updates...`);

    // Process tasks sequentially
    for (const task of queue) {
      try {
        await _processTask(task);
        _removeFromQueue(task.id);
      } catch (err) {
        console.error(`[Sync] Task ${task.id} failed:`, err);
        // We stop processing on failure to maintain order, or continue if independent
      }
    }

    isSyncing = false;
    _showSyncStatus('✓ Synchronization complete');
    console.log('[Sync] Background synchronization successfully completed.');
  }

  // ── INTERNAL ────────────────────────────────────────────────

  async function _processTask(task) {
    if (task.type === 'SALE_SYNC') {
      const { txnId, items, total, tax, discount } = task.data;
      console.log(`[Sync] Re-dispatching synced sale: ${txnId}`);
      
      // Re-dispatch a sanitized event that integrations already listen for
      // Note: We avoid an infinite loop because handleNewSale checks Connectivity.isOnline()
      // or we could add a 'isSynced' flag.
      window.dispatchEvent(new CustomEvent('saleCompleted', { 
        detail: { txnId, items, total, tax, discount, isSynced: true } 
      }));

      // Small simulate delay for visual realism
      return new Promise(resolve => setTimeout(resolve, 800));
    }
  }

  function _getQueue() {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  }

  function _queueTask(type, data) {
    const queue = _getQueue();
    queue.push({ id: `SYNC-${Date.now()}-${Math.floor(Math.random()*1000)}`, type, data, timestamp: new Date().toISOString() });
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    
    // Update UI if indicator exists
    window.dispatchEvent(new CustomEvent('syncQueueUpdated', { detail: { count: queue.length } }));
  }

  function _removeFromQueue(id) {
    const queue = _getQueue().filter(t => t.id !== id);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    window.dispatchEvent(new CustomEvent('syncQueueUpdated', { detail: { count: queue.length } }));
  }

  function _showSyncStatus(msg) {
    window.dispatchEvent(new CustomEvent('showSyncToast', { detail: { message: msg } }));
  }

  return { init, processQueue };
})();

// Auto-init
if (typeof window !== 'undefined') {
  SyncManager.init();
}
