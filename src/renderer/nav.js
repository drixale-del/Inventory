/* ============================================================
   nav.js — Navigation only.
   Window controls (resize, snap, sidebar) live in
   src/window-manager/ui.js which is loaded separately.
   ============================================================ */

const NAV_ITEMS = [
  // --- CASHIER HUB ---
  { id: 'cashier-dash', label: 'Cashier Hub', icon: 'dashboard', groups: ['cashier'], path: '../dashboard/cashier/pages/cashier.html' },
  { id: 'pos',        label: 'POS',        icon: 'point_of_sale',   groups: ['cashier'], path: '../dashboard/cashier/sales-processing/sales-processing.html'  },
  { id: 'inventory',  label: 'Inventory',  icon: 'inventory_2',     groups: ['cashier'], path: '../dashboard/cashier/pages/inventory.html'  },
  { id: 'reports',    label: 'Reports',    icon: 'analytics',       groups: ['cashier'], path: '../dashboard/cashier/pages/reports.html'    },
  { id: 'suppliers',  label: 'Suppliers',  icon: 'local_shipping',  groups: ['manager'], path: '../dashboard/manager/suppliers/suppliers.html'  },
  { id: 'outlets',    label: 'Branches',   icon: 'storefront',      groups: ['cashier', 'admin'], path: '../dashboard/cashier/outlets/outlets.html'  },
  { id: 'customers',  label: 'Customers',  icon: 'groups',          groups: ['cashier'], path: '../dashboard/cashier/customers/customers.html' },
  { id: 'returns',    label: 'Returns',    icon: 'assignment_return', groups: ['cashier'], path: '../dashboard/cashier/returns/returns.html' },
  { id: 'automations',label: 'Automated Reports', icon: 'auto_timer', groups: ['cashier'], path: '../dashboard/cashier/automation/automation.html' },
  { id: 'smart_notifications', label: 'Smart Alerts Hub', icon: 'notifications_active', groups: ['cashier'], path: '../dashboard/cashier/smart-notifications/index.html' },
  { id: 'alerts',     label: 'Direct Alerts',   icon: 'notification_important', groups: ['cashier'], path: '../dashboard/cashier/alerts/alerts.html' },
  { id: 'lifecycle',  label: 'Product Lifecycle', icon: 'auto_graph', groups: ['cashier'], path: '../dashboard/cashier/lifecycle/lifecycle.html'},
  { id: 'pricing',    label: 'Dynamic Pricing', icon: 'price_check', groups: ['cashier'], path: '../dashboard/cashier/pricing/pricing.html'},
  { id: 'promotions', label: 'Bundles & Promos', icon: 'loyalty', groups: ['cashier'], path: '../dashboard/cashier/promotions/promotions.html'},
  { id: 'accounting', label: 'Accounting Sync', icon: 'account_balance_wallet', groups: ['cashier'], path: '../dashboard/cashier/accounting/accounting.html'},
  { id: 'ecommerce',  label: 'E-commerce Sync', icon: 'cloud_sync', groups: ['cashier'], path: '../dashboard/cashier/ecommerce/ecommerce.html'},
  { id: 'comms',      label: 'Automation & Comms', icon: 'hub', groups: ['cashier'], path: '../dashboard/cashier/comms/comms.html'},
  { id: 'notifications', label: 'Push Notifications', icon: 'notification_add', groups: ['cashier'], path: '../dashboard/cashier/Push_notifications/notifications.html' },
  
  // --- ADMIN NEXUS ---
  { id: 'admin-dash',   label: 'Admin Hub', icon: 'grid_view', groups: ['admin'], path: '../dashboard/admin/admin.html' },
  { id: 'revenue',      label: 'Revenue',   icon: 'payments', groups: ['admin'], path: '../dashboard/admin/pages/revenue.html' },
  { id: 'employees',    label: 'Employees', icon: 'badge',    groups: ['admin'], path: '../dashboard/admin/pages/employees.html' },
  { id: 'billing',      label: 'Billing',   icon: 'receipt_long', groups: ['admin'], path: '../dashboard/admin/pages/billing.html' },
  { id: 'settings',     label: 'Settings',  icon: 'settings_suggest', groups: ['admin'], path: '../dashboard/admin/pages/settings.html' },
  
  // --- MANAGER OPS ---
  { id: 'manager-dash', label: 'Manager Ops', icon: 'insights', groups: ['manager'], path: '../dashboard/manager/manager.html' },
];

function initNav(activePage) {
  const sidebar = document.getElementById('sidebar-nav');
  if (!sidebar) return;

  // 1. Get stored hub from session, fallback to URL detection if missing
  let currentGroup = sessionStorage.getItem('active_hub');
  
  if (!currentGroup) {
      const isAdminContext = activePage.startsWith('admin') || activePage === 'revenue' || activePage === 'employees' || activePage === 'billing' || activePage === 'settings' || window.location.href.includes('/admin/');
      currentGroup = isAdminContext ? 'admin' : 'cashier';
      sessionStorage.setItem('active_hub', currentGroup);
  }
  
  // Filter items based on the active role group
  const filteredItems = NAV_ITEMS.filter(item => item.groups && item.id !== 'manager-dash' && item.groups.includes(currentGroup));

  const navHtml = filteredItems.map(item => `
    <button
      class="nav-item ${item.id === activePage ? 'active' : ''}"
      onclick="navigateTo('${item.id}')"
      id="nav-${item.id}"
      title="${item.label}"
    >
      <span class="material-symbols-rounded">${item.icon}</span>
      <span class="nav-label">${item.label}</span>
    </button>
  `).join('');

  // Add "Switch Role" button at the bottom
  const switchRoleHtml = `
    <div class="sidebar-divider"></div>
    <button class="nav-item logout" onclick="navigateTo('launcher')" title="Switch Hub">
      <span class="material-symbols-rounded">logout</span>
      <span class="nav-label">Switch Role</span>
    </button>
  `;

  sidebar.innerHTML = navHtml + switchRoleHtml;
}

// Absolute page paths relative to src/
const PAGE_PATHS = {
  launcher:     'role-selection/launcher.html',
  'cashier-dash': 'dashboard/cashier/pages/cashier.html',
  'manager-dash': 'dashboard/manager/manager.html',
  'admin-dash':   'dashboard/admin/admin.html',
  pos:        'dashboard/cashier/sales-processing/sales-processing.html',
  inventory:  'dashboard/cashier/pages/inventory.html',
  reports:    'dashboard/cashier/pages/reports.html',
  suppliers:  'dashboard/manager/suppliers/suppliers.html',
  outlets:    'dashboard/cashier/outlets/outlets.html',
  settings:   'dashboard/admin/pages/settings.html',
  revenue:    'dashboard/admin/pages/revenue.html',
  employees:  'dashboard/admin/pages/employees.html',
  billing:    'dashboard/admin/pages/billing.html',
  customers:  'dashboard/cashier/customers/customers.html',
  returns:    'dashboard/cashier/returns/returns.html',
  automations: 'dashboard/cashier/automation/automation.html',
  smart_notifications: 'dashboard/cashier/smart-notifications/index.html',
  alerts:     'dashboard/cashier/alerts/alerts.html',
  lifecycle:  'dashboard/cashier/lifecycle/lifecycle.html',
  pricing:    'dashboard/cashier/pricing/pricing.html',
  promotions: 'dashboard/cashier/promotions/promotions.html',
  accounting: 'dashboard/cashier/accounting/accounting.html',
  ecommerce:  'dashboard/cashier/ecommerce/ecommerce.html',
  comms:      'dashboard/cashier/comms/comms.html',
  notifications: 'dashboard/cashier/Push_notifications/notifications.html',
};


function navigateTo(page) {
  // Update persistence if navigating to a primary hub
  if (page === 'admin-dash') sessionStorage.setItem('active_hub', 'admin');
  if (page === 'cashier-dash') sessionStorage.setItem('active_hub', 'cashier');
  if (page === 'manager-dash') sessionStorage.setItem('active_hub', 'manager');

  // In Electron, always send the page ID — ipc.js uses the full PAGE_MAP
  if (window.electronAPI) {
    window.electronAPI.navigate(page);
    return;
  }
  // Browser fallback: find the src/ root, then append the target path
  const relPath = PAGE_PATHS[page];
  if (relPath) {
    const href   = window.location.href;
    const srcIdx = href.lastIndexOf('/src/');
    if (srcIdx !== -1) {
      window.location.href = href.substring(0, srcIdx + 5) + relPath;
      return;
    }
  }
  window.location.href = `${page}.html`;
}


/* initTitlebar — kept so all existing page scripts work unchanged.
   Delegates to initWindowControls() which is defined in
   window-manager/ui.js (loaded right after this file). */
function initTitlebar() {
  // ui.js is loaded after nav.js, so initWindowControls is available here.
  if (typeof initWindowControls === 'function') {
    initWindowControls();
  }
}

/* ============================================================
   Profile Menu System (Delegated Implementation)
   ============================================================ */
// Listen for ALL profile button clicks across the whole document
document.addEventListener('click', (event) => {
  const btn = event.target.closest('.profile-btn');
  if (btn) {
    event.preventDefault();
    event.stopPropagation();
    handleProfileToggle(event, btn);
  }
});

function handleProfileToggle(event, btn) {
  let menu = document.getElementById('global-profile-menu');
  
  if (!menu) {
    menu = document.createElement('div');
    menu.id = 'global-profile-menu';
    menu.className = 'profile-menu fade-in-up';
    menu.style.position = 'fixed';
    
    menu.innerHTML = `
      <button class="profile-menu-item" onclick="alert('Terms & Conditions')">
        <span class="material-symbols-rounded">description</span> Terms & Conditions
      </button>
      <button class="profile-menu-item" onclick="alert('Privacy Policy')">
        <span class="material-symbols-rounded">verified_user</span> Privacy Policy
      </button>
      <button class="profile-menu-item" onclick="navigateTo('settings')">
        <span class="material-symbols-rounded">settings</span> Settings
      </button>
      <div class="profile-menu-divider"></div>
      <button class="profile-menu-item" onclick="alert('Copyright © 2026 Precision Architect')">
        <span class="material-symbols-rounded">copyright</span> Copyright
      </button>
    `;
    
    document.body.appendChild(menu);
  }

  // Check if WE are the ones currently open
  const wasOpen = btn.getAttribute('data-profile-open') === 'true';

  // Force close all open profile menus and reset all buttons
  document.querySelectorAll('.profile-menu').forEach(m => m.classList.remove('show'));
  document.querySelectorAll('.profile-btn').forEach(b => b.setAttribute('data-profile-open', 'false'));
  document.removeEventListener('click', closeProfileMenu);

  // If we were closed, open now. If we were open, we stay closed (toggle effect).
  if (!wasOpen) {
    const btnRect = btn.getBoundingClientRect();
    menu.style.left = btnRect.left + 'px';
    menu.style.bottom = (window.innerHeight - btnRect.top + 8) + 'px';
    
    void menu.offsetWidth; // Force reflow
    menu.classList.add('show');
    btn.setAttribute('data-profile-open', 'true');
    
    // Add global listener to close when clicking outside
    setTimeout(() => {
      document.addEventListener('click', closeProfileMenu);
    }, 10);
  }
}

// Function to keep HTML compatibility
function toggleProfileMenu(event) {
  const btn = event.currentTarget || event.target.closest('.profile-btn');
  if (btn) {
    event.preventDefault();
    event.stopPropagation();
    handleProfileToggle(event, btn);
  }
}

function closeProfileMenu(e) {
  const menu = document.getElementById('global-profile-menu');
  if (!menu || !menu.classList.contains('show')) return;
  
  // Ignore clicks inside the menu content
  if (e.target.closest('.profile-menu')) {
    if (!e.target.closest('.profile-menu-item')) return;
  }
  
  // If clicking the profile button, let the main handler handle it (or ignore)
  if (e.target.closest('.profile-btn')) {
    return;
  }
  
  // Close menu
  menu.classList.remove('show');
  document.querySelectorAll('.profile-btn').forEach(b => b.setAttribute('data-profile-open', 'false'));
  document.removeEventListener('click', closeProfileMenu);
}
