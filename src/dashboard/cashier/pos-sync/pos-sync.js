/* ============================================================
   pos-sync.js — Real-time Transaction Synchronization
   ============================================================ */

const POSSyncEngine = (() => {
  
  function init() {
    console.log('[POS-Sync] Listening for sale completion events...');
    window.addEventListener('saleCompleted', (e) => {
      const { txnId, items, total, tax, discount } = e.detail;
      handleSync(txnId, items, total, tax, discount);
    });
  }

  async function handleSync(txnId, items, total, tax, discount) {
    // Check if we should skip this (if offline, SyncManager will queue it)
    if (typeof Connectivity !== 'undefined' && !Connectivity.isOnline()) {
      console.log(`[POS-Sync] App is offline. Deferring sync for ${txnId} to SyncManager.`);
      return;
    }

    console.log(`[POS-Sync] Processing transaction: ${txnId}`);
    
    // 1. Log to Persistence (Simulated)
    const logEntry = {
      type: 'SYNC_TRANSACTION',
      timestamp: new Date().toISOString(),
      payload: { txnId, items, total, tax, discount },
      status: 'SUCCESS'
    };
    
    // 2. Trigger Communication Hooks
    if (typeof CommsEngine !== 'undefined') {
      CommsEngine.trigger('onSale', { txnId, total });
    }

    // 3. Trigger E-commerce Sync (Push stock levels)
    if (typeof EcommEngine !== 'undefined') {
      EcommEngine.pushStockUpdates(items.map(i => i.sku));
    }

    console.log(`[POS-Sync] Completed synchronization for ${txnId}.`);
  }

  return { init };
})();

// Auto-init if in a renderer context
if (typeof window !== 'undefined') {
  POSSyncEngine.init();
}
