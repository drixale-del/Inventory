/**
 * window-manager/ui.js
 * Renderer-side window controls: sidebar toggle, resize handles, snap popup.
 * Loaded as a plain <script> in every page AFTER nav.js.
 * Exposes: initWindowControls()  ← called by each page.
 */

/* ═══════════════════════════════════════════════════════════════
   ENTRY POINT — call this from each page after DOM is ready
   ═══════════════════════════════════════════════════════════════ */
function initWindowControls() {
  _initTitlebarButtons();
  _injectSidebarToggle();
  _injectResizeHandles();
  _injectSnapPopup();
}

/* ───────────────────────────────────────────────────────────────
   TITLEBAR BUTTONS  (minimize / maximize / close)
   ─────────────────────────────────────────────────────────────── */
function _initTitlebarButtons() {
  const api = window.electronAPI;
  document.getElementById('btn-minimize')?.addEventListener('click', () => api?.minimizeWindow());
  document.getElementById('btn-maximize')?.addEventListener('click', () => api?.maximizeWindow());
  document.getElementById('btn-close')?.addEventListener('click',    () => api?.closeWindow());
}

/* ───────────────────────────────────────────────────────────────
   SIDEBAR TOGGLE  (hamburger button injected into titlebar)
   ─────────────────────────────────────────────────────────────── */
function _injectSidebarToggle() {
  const brand   = document.querySelector('.titlebar-brand');
  const sidebar = document.querySelector('.sidebar');
  const layout  = document.querySelector('.main-layout');
  if (!sidebar || !layout) return;

  // 1. Restore static titlebar brand if previously modified
  if (brand && (brand.querySelector('img') || brand.style.cursor === 'pointer')) {
    brand.innerHTML = `
      <span class="material-symbols-rounded filled">inventory_2</span>
      Precision POS
    `;
    brand.removeAttribute('title');
    // Using cloneNode to strip all previous event listeners from the brand
    const brandClone = brand.cloneNode(true);
    brand.parentNode.replaceChild(brandClone, brand);
  }

  // 2. Inject sidebar brand header if not already present
  if (!sidebar.querySelector('.sidebar-brand-header')) {
    const header = document.createElement('div');
    header.className = 'sidebar-brand-header';
    header.title = 'Toggle Sidebar';
    header.innerHTML = `
      <div class="sidebar-logo-wrapper">
        <img src="../../assets/Public/Images/logo.png" alt="Precision POS Portrait Logo">
      </div>
      <div class="connectivity-badge"></div>
    `;
    sidebar.prepend(header);
    
    header.addEventListener('click', () => {
      const isClosing = !layout.classList.contains('sidebar-collapsed');
      layout.classList.toggle('sidebar-collapsed', isClosing);
      localStorage.setItem('sidebar-collapsed', isClosing);
    });

    // Listen for sync status events to show brief toasts
    window.addEventListener('showSyncToast', (e) => {
      if (typeof showToast === 'function') showToast(e.detail.message);
      else console.log(`[Sync Notification] ${e.detail.message}`);
    });
  }

  // 3. Restore saved state without transition flash
  const collapsed = localStorage.getItem('sidebar-collapsed') === 'true';
  if (collapsed) {
    layout.style.transition = 'none';
    layout.classList.add('sidebar-collapsed');
    requestAnimationFrame(() => { layout.style.transition = ''; });
  }
}

/* ───────────────────────────────────────────────────────────────
   EDGE / CORNER RESIZE HANDLES
   8 transparent fixed divs on each edge and corner.
   Sends 'resize-start' / 'resize-end' to the main process.
   The main process polls screen.getCursorScreenPoint() at ~60fps
   and calls setBounds() — DPI-safe, no renderer math.
   ─────────────────────────────────────────────────────────────── */
function _injectResizeHandles() {
  const E = 5;   // edge strip thickness (px)
  const C = 12;  // corner zone size (px)

  const handles = [
    { dir: 'n',  cur: 'n-resize',  css: `top:0;left:${C}px;right:${C}px;height:${E}px` },
    { dir: 's',  cur: 's-resize',  css: `bottom:0;left:${C}px;right:${C}px;height:${E}px` },
    { dir: 'e',  cur: 'e-resize',  css: `top:${C}px;right:0;bottom:${C}px;width:${E}px` },
    { dir: 'w',  cur: 'w-resize',  css: `top:${C}px;left:0;bottom:${C}px;width:${E}px` },
    { dir: 'nw', cur: 'nw-resize', css: `top:0;left:0;width:${C}px;height:${C}px` },
    { dir: 'ne', cur: 'ne-resize', css: `top:0;right:0;width:${C}px;height:${C}px` },
    { dir: 'sw', cur: 'sw-resize', css: `bottom:0;left:0;width:${C}px;height:${C}px` },
    { dir: 'se', cur: 'se-resize', css: `bottom:0;right:0;width:${C}px;height:${C}px` },
  ];

  // Shared styles
  const style = document.createElement('style');
  style.textContent = `
    .wm-rh {
      position: fixed;
      z-index: 9998;
      -webkit-app-region: no-drag;
    }
    html.wm-resizing,
    html.wm-resizing * { user-select: none !important; }
    html.wm-resizing *:not(.wm-rh) { pointer-events: none !important; }
  `;
  document.head.appendChild(style);

  handles.forEach(({ dir, cur, css }) => {
    const el = document.createElement('div');
    el.className = 'wm-rh';
    el.style.cssText = `${css};cursor:${cur};`;
    document.body.appendChild(el);

    el.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();

      // Lock pointer to this handle so we ALWAYS get the pointerup event
      // even if the mouse cursor leaves the Electron window.
      el.setPointerCapture(e.pointerId);

      // Tell main process to start polling cursor + updating bounds
      window.electronAPI?.resizeStart(dir);

      // Lock cursor style and freeze UI interactions
      document.documentElement.style.cursor = cur;
      document.documentElement.classList.add('wm-resizing');

      function onUp(ev) {
        if (ev.pointerId !== e.pointerId) return;
        window.electronAPI?.resizeEnd();
        document.documentElement.style.cursor = '';
        document.documentElement.classList.remove('wm-resizing');
        el.releasePointerCapture(e.pointerId);
        el.removeEventListener('pointerup', onUp);
      }
      el.addEventListener('pointerup', onUp);
    });
  });
}

/* ───────────────────────────────────────────────────────────────
   SNAP LAYOUT POPUP  (Fully Interactive Zones)
   Replicates the exact 4-group grid from the reference image.
   Each individual sub-zone is clickable.
   ─────────────────────────────────────────────────────────────── */

function _injectSnapPopup() {
  const maximizeBtn = document.getElementById('btn-maximize');
  if (!maximizeBtn) return;

  const style = document.createElement('style');
  style.textContent = `
    .wm-snap-popup {
      position: fixed;
      background: #1f1f1f;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px;
      padding: 16px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      z-index: 99999;
      pointer-events: none;
      opacity: 0;
      transform: translateY(-4px) scale(0.97);
      transform-origin: top right;
      transition: opacity 120ms ease, transform 120ms ease;
      box-shadow: 0 12px 32px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4);
      -webkit-app-region: no-drag;
      min-width: max-content;
    }
    .wm-snap-popup.open {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: all;
    }
    /* Little triangle pointer */
    .wm-snap-popup::before {
      content: '';
      position: absolute;
      top: -5px; right: 18px;
      width: 9px; height: 9px;
      background: #1f1f1f;
      border-left: 1px solid rgba(255,255,255,0.1);
      border-top:  1px solid rgba(255,255,255,0.1);
      transform: rotate(45deg);
    }
    
    /* Layout Group Container */
    .wm-snap-group {
      width: 82px;
      height: 56px;
      display: flex;
      gap: 3px;
    }
    .wm-snap-group.grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 1fr 1fr;
    }
    .wm-snap-col {
      display: flex;
      flex-direction: column;
      gap: 3px;
      flex: 1;
    }

    /* Individual Clickable Zones */
    .wm-snap-zone {
      background: rgba(255,255,255,0.12);
      border: 1px solid rgba(255,255,255,0.18);
      transition: background 120ms ease, border-color 120ms ease;
      cursor: pointer;
      -webkit-app-region: no-drag;
    }
    
    /* Specific inner-flush border radii per layout to identically match the image */
    [data-layout="halfLeft"], [data-layout="largeLeft"], [data-layout="halfLeftTall"] { border-radius: 5px 1px 1px 5px; }
    [data-layout="halfRight"], [data-layout="smallRight"] { border-radius: 1px 5px 5px 1px; }
    
    [data-layout="quadTopRight"] { border-radius: 1px 5px 1px 1px; }
    [data-layout="quadBotRight"] { border-radius: 1px 1px 5px 1px; }
    
    [data-layout="quadTL"] { border-radius: 5px 1px 1px 1px; }
    [data-layout="quadTR"] { border-radius: 1px 5px 1px 1px; }
    [data-layout="quadBL"] { border-radius: 1px 1px 1px 5px; }
    [data-layout="quadBR"] { border-radius: 1px 1px 5px 1px; }
    
    /* Group Hover Effect: dim unhovered zones, highlight hovered zone */
    .wm-snap-group:hover .wm-snap-zone {
      background: rgba(255,255,255,0.06);
    }
    .wm-snap-group .wm-snap-zone:hover {
      background: rgba(139, 209, 232, 0.85); /* Primary highlight */
      border-color: rgba(255,255,255,0.6);
    }
  `;
  document.head.appendChild(style);

  const popup = document.createElement('div');
  popup.className = 'wm-snap-popup';
  document.body.appendChild(popup);

  /* 
   * Define the 4 exact groups from the image using standard HTML structure.
   */
  const groupsHTML = `
    <!-- Group 1: 50/50 -->
    <div class="wm-snap-group">
      <div class="wm-snap-zone" style="flex: 1;" data-layout="halfLeft"></div>
      <div class="wm-snap-zone" style="flex: 1;" data-layout="halfRight"></div>
    </div>
    
    <!-- Group 2: 66/33 -->
    <div class="wm-snap-group">
      <div class="wm-snap-zone" style="flex: 2;" data-layout="largeLeft"></div>
      <div class="wm-snap-zone" style="flex: 1;" data-layout="smallRight"></div>
    </div>
    
    <!-- Group 3: 50 | 25/25 -->
    <div class="wm-snap-group">
      <div class="wm-snap-zone" style="flex: 1;" data-layout="halfLeftTall"></div>
      <div class="wm-snap-col">
        <div class="wm-snap-zone" style="flex: 1;" data-layout="quadTopRight"></div>
        <div class="wm-snap-zone" style="flex: 1;" data-layout="quadBotRight"></div>
      </div>
    </div>
    
    <!-- Group 4: 4 Quadrants -->
    <div class="wm-snap-group grid">
      <div class="wm-snap-zone" data-layout="quadTL"></div>
      <div class="wm-snap-zone" data-layout="quadTR"></div>
      <div class="wm-snap-zone" data-layout="quadBL"></div>
      <div class="wm-snap-zone" data-layout="quadBR"></div>
    </div>
  `;
  popup.innerHTML = groupsHTML;

  // Attach click listeners to all zones
  const zones = popup.querySelectorAll('.wm-snap-zone');
  zones.forEach(zone => {
    zone.addEventListener('click', (e) => {
      e.stopPropagation();
      const layoutId = zone.getAttribute('data-layout');
      if (layoutId) window.electronAPI?.snapWindow(layoutId);
      hide();
    });
  });

  // Positioning
  function reposition() {
    const r = maximizeBtn.getBoundingClientRect();
    popup.style.top   = (r.bottom + 6) + 'px';
    popup.style.right = (window.innerWidth - r.right - 4) + 'px';
  }

  let hideTimer = null;
  function show() { clearTimeout(hideTimer); reposition(); popup.classList.add('open'); }
  function hide() { hideTimer = setTimeout(() => popup.classList.remove('open'), 120); }

  maximizeBtn.addEventListener('mouseenter', show);
  maximizeBtn.addEventListener('mouseleave', hide);
  popup.addEventListener('mouseenter', () => clearTimeout(hideTimer));
  popup.addEventListener('mouseleave', hide);
  document.addEventListener('click', (e) => {
    if (!popup.contains(e.target) && e.target !== maximizeBtn) hide();
  });
}
