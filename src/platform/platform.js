/* ============================================================
   PRECISION POS — PLATFORM ABSTRACTION MODULE
   ============================================================ */

(function initPlatform() {
  if (document.getElementById('platform-css')) return;

  const os = window.env?.OS || 'win32';
  document.body.classList.add(`os-${os}`);

  // Inject Platform CSS overrides based on the detected native OS
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.id = 'platform-css';
  link.href = '../platform/platform.css';
  document.head.appendChild(link);
})();
