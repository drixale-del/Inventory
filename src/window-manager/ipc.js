/**
 * window-manager/ipc.js
 * Main-process IPC handlers for all window management operations.
 * Usage in main.js: require('./src/window-manager/ipc')(mainWindow, ipcMain, screen)
 */

module.exports = function setupWindowIPC(mainWindow, ipcMain, screen) {
  /* ── Navigation ───────────────────────────────────────────── */
  const path = require('path');

  const PAGE_MAP = {
    launcher:   path.join(__dirname, '../../src/role-selection/launcher.html'),
    'cashier-dash': path.join(__dirname, '../../src/dashboard/cashier/pages/cashier.html'),
    'manager-dash': path.join(__dirname, '../../src/dashboard/manager/manager.html'),
    'admin-dash':   path.join(__dirname, '../../src/dashboard/admin/admin.html'),
    pos:        path.join(__dirname, '../../src/dashboard/cashier/pages/pos.html'),
    inventory:  path.join(__dirname, '../../src/dashboard/cashier/pages/inventory.html'),
    reports:    path.join(__dirname, '../../src/dashboard/cashier/pages/reports.html'),
    suppliers:  path.join(__dirname, '../../src/dashboard/cashier/suppliers/suppliers.html'),
    outlets:    path.join(__dirname, '../../src/dashboard/cashier/outlets/outlets.html'),
    settings:   path.join(__dirname, '../../src/dashboard/admin/pages/settings.html'),
    customers:  path.join(__dirname, '../../src/dashboard/cashier/customers/customers.html'),
    returns:    path.join(__dirname, '../../src/dashboard/cashier/returns/returns.html'),
    automations:path.join(__dirname, '../../src/dashboard/cashier/automation/automation.html'),
    alerts:     path.join(__dirname, '../../src/dashboard/cashier/alerts/alerts.html'),
    lifecycle:  path.join(__dirname, '../../src/dashboard/cashier/lifecycle/lifecycle.html'),
    pricing:    path.join(__dirname, '../../src/dashboard/cashier/pricing/pricing.html'),
    promotions: path.join(__dirname, '../../src/dashboard/cashier/promotions/promotions.html'),
    accounting: path.join(__dirname, '../../src/dashboard/cashier/accounting/accounting.html'),
    ecommerce:  path.join(__dirname, '../../src/dashboard/cashier/ecommerce/ecommerce.html'),
    comms:      path.join(__dirname, '../../src/dashboard/cashier/comms/comms.html'),
    smart_notifications: path.join(__dirname, '../../src/dashboard/cashier/smart-notifications/index.html'),
  };

  ipcMain.on('navigate', (event, page) => {
    const filePath = PAGE_MAP[page];
    if (!filePath) return;
    mainWindow.loadFile(filePath);
  });

  /* ── Window Controls ──────────────────────────────────────── */
  ipcMain.on('window-minimize', () => mainWindow.minimize());

  ipcMain.on('window-maximize', () => {
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else                          mainWindow.maximize();
  });

  ipcMain.on('window-close', () => mainWindow.close());

  /* ── Snap Layouts ─────────────────────────────────────────── */
  ipcMain.on('window-snap', (event, layout) => {
    const { workArea } = screen.getPrimaryDisplay();
    const { x, y, width: sw, height: sh } = workArea;

    const half       = Math.floor(sw / 2);
    const halfH      = Math.floor(sh / 2);
    const twoThirds  = Math.floor(sw * 0.6666);
    const third      = sw - twoThirds;

    const LAYOUTS = {
      // Group 1: 50/50
      halfLeft:     { x,              y,          width: half,       height: sh         },
      halfRight:    { x: x+half,      y,          width: sw - half,  height: sh         },
      
      // Group 2: 66/33
      largeLeft:    { x,              y,          width: twoThirds,  height: sh         },
      smallRight:   { x: x+twoThirds, y,          width: third,      height: sh         },
      
      // Group 3: 50 | 25/25
      halfLeftTall: { x,              y,          width: half,       height: sh         },
      quadTopRight: { x: x+half,      y,          width: sw - half,  height: halfH      },
      quadBotRight: { x: x+half,      y: y+halfH, width: sw - half,  height: sh - halfH },

      // Group 4: 2x2 Grid
      quadTL:       { x,              y,          width: half,       height: halfH      },
      quadTR:       { x: x+half,      y,          width: sw - half,  height: halfH      },
      quadBL:       { x,              y: y+halfH, width: half,       height: sh - halfH },
      quadBR:       { x: x+half,      y: y+halfH, width: sw - half,  height: sh - halfH },
    };

    const bounds = LAYOUTS[layout];
    if (bounds) mainWindow.setBounds(bounds, true);
  });

  /* ── Edge Resize (main-process polling — DPI-safe) ─────────
   *
   * The renderer sends 'resize-start' with the drag direction when the
   * user presses a resize handle.  From that point, the main process polls
   * screen.getCursorScreenPoint() every ~16 ms (≈60 fps) and calls
   * setBounds() directly.  This avoids DPI scaling issues that arise when
   * calculating bounds in the renderer with window.screenX/outerWidth.
   * ─────────────────────────────────────────────────────────── */

  const MIN_W = 400;
  const MIN_H = 300;

  let resizeSession  = null;   // { dir, startCursor, startBounds }
  let resizeInterval = null;

  ipcMain.on('resize-start', (event, { dir }) => {
    // Cancel any existing session
    if (resizeInterval) { clearInterval(resizeInterval); resizeInterval = null; }

    resizeSession = {
      dir,
      startCursor: screen.getCursorScreenPoint(),
      startBounds: mainWindow.getBounds(),
    };

    resizeInterval = setInterval(() => {
      if (!resizeSession) { clearInterval(resizeInterval); return; }

      const cursor = screen.getCursorScreenPoint();
      const dx = cursor.x - resizeSession.startCursor.x;
      const dy = cursor.y - resizeSession.startCursor.y;
      const { x: sx, y: sy, width: sw, height: sh } = resizeSession.startBounds;
      const { dir } = resizeSession;

      let x = sx, y = sy, w = sw, h = sh;

      if (dir.includes('e')) w = sw + dx;
      if (dir.includes('s')) h = sh + dy;

      if (dir.includes('w')) {
        const nw = Math.max(MIN_W, sw - dx);
        x = sx + (sw - nw);
        w = nw;
      }

      if (dir.includes('n')) {
        const nh = Math.max(MIN_H, sh - dy);
        y = sy + (sh - nh);
        h = nh;
      }

      w = Math.max(MIN_W, Math.round(w));
      h = Math.max(MIN_H, Math.round(h));

      mainWindow.setBounds({ x: Math.round(x), y: Math.round(y), width: w, height: h });
    }, 16);
  });

  ipcMain.on('resize-end', () => {
    resizeSession = null;
    if (resizeInterval) { clearInterval(resizeInterval); resizeInterval = null; }
  });
};
