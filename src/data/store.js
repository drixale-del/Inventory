/* ============================================================
   PRECISION POS — IN-MEMORY DATA STORE
   ============================================================ */

const Store = (() => {

  // ── PRODUCTS ──────────────────────────────────────────────
  const products = [
    { id: 'P001', sku: 'IND-9230-T', name: 'Titanium Drill Bit Set', category: 'Tools', stock: 142, price: 89.99,  cost: 42.00, status: 'In Stock',   emoji: '🔩' },
    { id: 'P002', sku: 'LIT-4421-P', name: 'LED Industrial Panel',   category: 'Lighting', stock: 58,  price: 234.50, cost: 110.00, status: 'In Stock',   emoji: '💡' },
    { id: 'P003', sku: 'FAS-1102-S', name: 'Carbon Steel Fasteners', category: 'Hardware', stock: 7,   price: 12.99,  cost: 5.50,  status: 'Low Stock',  emoji: '⚙️' },
    { id: 'P004', sku: 'ELX-8831-C', name: 'UltraBoost X-20',        category: 'Footwear', stock: 34,  price: 179.99, cost: 72.00, status: 'In Stock',   emoji: '👟' },
    { id: 'P005', sku: 'ACC-2210-W', name: 'Chronos Minimal Watch',   category: 'Accessories', stock: 22, price: 299.00, cost: 130.00, status: 'In Stock', emoji: '⌚' },
    { id: 'P006', sku: 'AUD-5540-B', name: 'Aura Beats Pro',         category: 'Audio',    stock: 4,   price: 149.99, cost: 60.00, status: 'Low Stock',  emoji: '🎧' },
    { id: 'P007', sku: 'EYW-3320-H', name: 'Horizon Aviators',       category: 'Eyewear',  stock: 45,  price: 89.00,  cost: 32.00, status: 'In Stock',   emoji: '🕶️' },
    { id: 'P008', sku: 'CAM-7712-R', name: 'RetroSnap Camera',       category: 'Electronics', stock: 12, price: 449.00, cost: 200.00, status: 'In Stock', emoji: '📷' },
    { id: 'P009', sku: 'FIT-9901-I', name: 'Iron Grip 5kg Dumbbell', category: 'Fitness',  stock: 0,   price: 39.99,  cost: 15.00, status: 'Out of Stock', emoji: '🏋️' },
    { id: 'P010', sku: 'BAG-6643-N', name: 'Nomad Urban Pack',       category: 'Bags',     stock: 31,  price: 129.00, cost: 55.00, status: 'In Stock',   emoji: '🎒' },
    { id: 'P011', sku: 'WCH-1145-T', name: 'Titanium Chronograph',   category: 'Accessories', stock: 3, price: 879.00, cost: 400.00, status: 'Low Stock', emoji: '⌚' },
    { id: 'P012', sku: 'AUD-3312-S', name: 'Studio Headphones Pro',  category: 'Audio',    stock: 8,   price: 599.00, cost: 260.00, status: 'In Stock',   emoji: '🎧' },
  ];

  // ── SALES DATA (weekly) ───────────────────────────────────
  const weeklyRevenue = [18200, 21400, 19800, 24592, 22100, 26300, 17500];
  const weeklyExpenses = [9100, 10200, 9500, 11800, 10500, 12400, 8300];
  const weekLabels = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  // ── SUPPLIERS ─────────────────────────────────────────────
  const suppliers = [
    { id: 'S001', name: 'TechCore Distributors', contact: 'Mark Jensen', email: 'mark@techcore.com', phone: '+1 555-0142', category: 'Electronics', status: 'Active',   lastOrder: '2026-03-28' },
    { id: 'S002', name: 'IndustrialPro Supply',  contact: 'Lena Zhao',   email: 'lena@indpro.com',  phone: '+1 555-0287', category: 'Tools',       status: 'Active',   lastOrder: '2026-03-25' },
    { id: 'S003', name: 'LightsOn Global',       contact: 'Sam Okafor',  email: 'sam@lightson.com', phone: '+1 555-0391', category: 'Lighting',    status: 'Pending',  lastOrder: '2026-03-10' },
    { id: 'S004', name: 'FastenWorld Co.',       contact: 'Rita Park',   email: 'rita@fastenw.com', phone: '+1 555-0455', category: 'Hardware',    status: 'Active',   lastOrder: '2026-03-22' },
    { id: 'S005', name: 'StyleFirst Imports',    contact: 'Dave Owens',  email: 'dave@stylefirst.com', phone: '+1 555-0510', category: 'Footwear', status: 'Inactive', lastOrder: '2026-02-14' },
  ];

  // ── TRANSACTIONS ──────────────────────────────────────────
  const transactions = [
    { id: 'TXN-008923', date: '2026-03-31', total: 469.98, items: 2, customer: 'Walk-in Customer', status: 'Complete' },
    { id: 'TXN-008922', date: '2026-03-31', total: 234.50, items: 1, customer: 'Alex T.',          status: 'Complete' },
    { id: 'TXN-008921', date: '2026-03-31', total: 899.00, items: 3, customer: 'Sarah K.',         status: 'Complete' },
    { id: 'TXN-008920', date: '2026-03-30', total: 129.00, items: 1, customer: 'Walk-in Customer', status: 'Complete' },
    { id: 'TXN-008919', date: '2026-03-30', total:  39.99, items: 1, customer: 'Mike J.',          status: 'Refunded' },
  ];

  // ── P&L DATA ──────────────────────────────────────────────
  const pnl = {
    revenue:    89420.00,
    cogs:       41530.00,
    grossProfit: 47890.00,
    opex:       18240.00,
    taxes:       7320.00,
    netProfit:  22330.00,
    prevRevenue: 82100.00,
  };

  // ── PENDING APPROVALS ─────────────────────────────────────
  const pendingApprovals = [
    { id: 'APR-041', type: 'Restock Order',  item: 'Carbon Steel Fasteners', amount: 1200.00, requestedBy: 'Warehouse Team' },
    { id: 'APR-042', type: 'Supplier Credit', item: 'LightsOn Global',        amount: 340.00,  requestedBy: 'Accounts Dept.' },
    { id: 'APR-043', type: 'Expense Claim',   item: 'Logistics - March',      amount: 875.50,  requestedBy: 'Alex Sterling' },
  ];

  // ── CART STATE ────────────────────────────────────────────
  let cart = [];
  let cartListeners = [];

  const cartAPI = {
    items: () => cart,
    add(productId) {
      const product = products.find(p => p.id === productId);
      if (!product || product.stock === 0) return false;
      const existing = cart.find(i => i.productId === productId);
      if (existing) {
        existing.qty++;
      } else {
        cart.push({ productId, name: product.name, price: product.price, qty: 1, emoji: product.emoji });
      }
      cartListeners.forEach(fn => fn([...cart]));
      return true;
    },
    remove(productId) {
      cart = cart.filter(i => i.productId !== productId);
      cartListeners.forEach(fn => fn([...cart]));
    },
    updateQty(productId, qty) {
      const item = cart.find(i => i.productId === productId);
      if (!item) return;
      if (qty <= 0) { this.remove(productId); return; }
      item.qty = qty;
      cartListeners.forEach(fn => fn([...cart]));
    },
    clear() {
      cart = [];
      cartListeners.forEach(fn => fn([...cart]));
    },
    subtotal: () => cart.reduce((sum, i) => sum + i.price * i.qty, 0),
    onChange(fn) { cartListeners.push(fn); },
  };

  return {
    products,
    weeklyRevenue,
    weeklyExpenses,
    weekLabels,
    suppliers,
    transactions,
    pnl,
    pendingApprovals,
    cart: cartAPI,

    getProduct: (id) => products.find(p => p.id === id),
    getLowStockProducts: () => products.filter(p => p.stock > 0 && p.stock < 10),
    getOutOfStock: () => products.filter(p => p.stock === 0),
    getTotalStockValue: () => products.reduce((sum, p) => sum + p.stock * p.cost, 0),

    // ── TRANSACTIONAL CORE ──────────────────────────────────
    recordTransaction: (cartItems, subtotal, tax, discount) => {
      const total = subtotal + tax - discount;
      const newTxn = {
        id: `TXN-${Math.floor(Math.random() * 100000).toString().padStart(6, '0')}`,
        date: new Date().toISOString().split('T')[0],
        total,
        items: cartItems.length,
        customer: 'POS Checkout',
        status: 'Complete'
      };

      // 1. Update Inventory
      cartItems.forEach(item => {
        const product = products.find(p => p.id === item.productId || p.sku === item.sku);
        if (product) {
          product.stock -= item.qty;
          if (product.stock < 0) product.stock = 0;
          // Update status
          if (product.stock === 0) {
            product.status = 'Out of Stock';
            window.dispatchEvent(new CustomEvent('stockAlert', {
                detail: { productId: product.id, productName: product.name, sku: product.sku, currentStock: 0 }
            }));
          }
          else if (product.stock < 10) product.status = 'Low Stock';
        }
      });

      // 2. Update Transactions
      transactions.unshift(newTxn);

      // 3. Update P&L
      pnl.revenue += total;
      pnl.taxes += tax;
      pnl.grossProfit = pnl.revenue - pnl.cogs;
      pnl.netProfit = pnl.grossProfit - pnl.opex - pnl.taxes;

      console.log(`[Store] Transaction ${newTxn.id} recorded. Stock updated.`);
      return newTxn.id;
    },

    updateStock: (sku, delta) => {
      const p = products.find(x => x.sku === sku);
      if (p) {
        p.stock += delta;
        if (p.stock < 0) p.stock = 0;
        return true;
      }
      return false;
    }
  };
})();

if (typeof module !== 'undefined') module.exports = Store;
