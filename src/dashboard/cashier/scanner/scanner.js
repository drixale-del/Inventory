/* ============================================================
   scanner.js — Global Barcode/QR Scanning Listener
   ============================================================ */

const BarcodeScanner = (() => {
  let sequence = '';
  let lastTime = 0;
  const DELAY_THRESHOLD = 50; // Max ms between keystrokes typical of a hardware scanner

  let indicatorEl = null;

  function initIndicator() {
    if (document.getElementById('scanner-status')) return;
    indicatorEl = document.createElement('div');
    indicatorEl.id = 'scanner-status';
    indicatorEl.className = 'scanner-status';
    indicatorEl.innerHTML = `
      <span class="material-symbols-rounded">qr_code_scanner</span>
      <span id="scanner-text">Scanner Ready</span>
    `;
    document.body.appendChild(indicatorEl);
  }

  function setStatus(state, msg) {
    if (!indicatorEl) return;
    const textEl = document.getElementById('scanner-text');
    indicatorEl.className = 'scanner-status'; // reset
    if (state) indicatorEl.classList.add(state);
    if (msg) textEl.textContent = msg;

    // Reset back to ready after 2 seconds
    if (state === 'success' || state === 'error') {
      setTimeout(() => {
        indicatorEl.className = 'scanner-status';
        textEl.textContent = 'Scanner Ready';
      }, 2000);
    }
  }

  // Hook globally to capture keystrokes not explicitly typed slowly by a human
  document.addEventListener('keydown', (e) => {
    // Ignore input if user is actively typing in a form field (unless they are doing it very fast, but usually human typing is slower)
    const isInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable;
    
    // We optionally capture even in inputs IF it's fast enough, but to be safe, we usually append.
    // Real scanners send 'Enter' at the end.
    
    const now = Date.now();
    
    // If it's been a while, reset the sequence (assume it's humam)
    if (now - lastTime > DELAY_THRESHOLD && e.key !== 'Enter') {
      sequence = '';
    }

    lastTime = now;

    // Build the scan
    if (e.key.length === 1) { // Normal character
      sequence += e.key;
      if (sequence.length > 3) setStatus('active', 'Scanning...');
    } else if (e.key === 'Enter') {
      // If sequence is long enough, it's probably a barcode scan
      if (sequence.length >= 4) {
        
        // Prevent default form submission if focused inside an input when scanning
        if (isInput) e.preventDefault();
        
        // Fire custom global event
        const scanEvent = new CustomEvent('barcodeScanned', { detail: { code: sequence, element: e.target } });
        window.dispatchEvent(scanEvent);
        
        console.log(`[Scanner] Barcode detected: ${sequence}`);
        setStatus('success', `Scanned: ${sequence}`);
        sequence = ''; // Clear for next
      } else {
        sequence = ''; // Reset if just normal enter
      }
    }
  });

  return { init: initIndicator, setStatus };
})();

// Auto-initialize when loaded
document.addEventListener('DOMContentLoaded', () => {
  BarcodeScanner.init();
});
