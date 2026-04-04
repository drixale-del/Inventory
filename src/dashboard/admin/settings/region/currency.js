/* ============================================================
   currency.js — Global Currency Formatter
   Reads the active region from localStorage and exposes:
     Currency.format(number)        → "₦1,234.56"
     Currency.symbol()              → "₦"
     Currency.code()                → "NGN"

   All pages load this before their own renderer files.
   Listens for the 'regionChanged' event to stay in sync.
   ============================================================ */

const Currency = (() => {
  const STORAGE_KEY = 'precision_pos_region';

  function _loadRegion() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  // Default: USD
  let _active = _loadRegion() || {
    currencyCode: 'USD',
    symbol:       '$',
    currency:     'US Dollar',
  };

  /* ── Public API ── */
  function format(number, opts = {}) {
    const {
      showSymbol   = true,
      decimals     = 2,
      prefix       = '',    // e.g. '-' for expenses
    } = opts;

    if (number == null || isNaN(number)) return '—';

    // Use Intl.NumberFormat when the currencyCode is valid ISO 4217
    try {
      const formatted = new Intl.NumberFormat('en-US', {
        style:                 'currency',
        currency:              _active.currencyCode,
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(Math.abs(number));

      return prefix + (number < 0 ? '−' : '') + formatted;
    } catch (_) {
      // Fallback for non-standard codes
      const abs = Math.abs(number).toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
      const sym = showSymbol ? (_active.symbol || _active.currencyCode) : '';
      return prefix + (number < 0 ? '−' : '') + sym + abs;
    }
  }

  function symbol()  { return _active.symbol || _active.currencyCode || '$'; }
  function code()    { return _active.currencyCode || 'USD'; }
  function name()    { return _active.currency || 'US Dollar'; }
  function country() { return _active.country || 'United States'; }

  /* ── Listen for region changes from Settings ── */
  window.addEventListener('regionChanged', (e) => {
    _active = e.detail;
    // Notify app to re-render all currency-bearing components
    window.dispatchEvent(new CustomEvent('currencyUpdated'));
  });

  return { format, symbol, code, name, country };
})();
