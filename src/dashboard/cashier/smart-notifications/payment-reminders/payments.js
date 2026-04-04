/* payments.js — Payment Reminders Logic */

const PaymentModule = (() => {
  const container = document.getElementById('payment-list');

  function getMockPayments() {
    return [
      {
        id: 'pay_001',
        invoiceRef: 'INV-902',
        client: 'EcoBuild Supplies',
        amount: '$1,240.00',
        dueDate: '3 days overdue',
        status: 'overdue'
      },
      {
        id: 'pay_002',
        invoiceRef: 'PAY-441',
        client: 'Prime Logistics',
        amount: '$850.00',
        dueDate: 'Due tomorrow',
        status: 'upcoming'
      }
    ];
  }

  function render() {
    if (!container) return;

    const payments = getMockPayments();

    container.innerHTML = payments.map(p => `
      <div class="payment-item ${p.status} fade-in-up">
        <div class="payment-status-dot"></div>
        <div class="payment-info">
          <div class="payment-header">
            <span class="invoice-number">${p.invoiceRef}</span>
            <span class="payment-amount">${p.amount}</span>
          </div>
          <div class="payment-desc">Invoice for <strong>${p.client}</strong></div>
        </div>
        <div class="payment-due">${p.dueDate}</div>
        <div class="payment-actions">
          <button class="btn btn-secondary btn-sm" onclick="alert('Sending reminder to ${p.client}...')">
            <span class="material-symbols-rounded">mail</span>
            Remind
          </button>
        </div>
      </div>
    `).join('');
  }

  return { init: render };
})();

document.addEventListener('DOMContentLoaded', PaymentModule.init);
