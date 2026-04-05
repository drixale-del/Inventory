/* ============================================================
   admin-dashboard.js
   Logic for administrative overview metrics and actions.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize navigation
    if (typeof initNav === 'function') {
        initNav('admin-dash');
    }

    // Initialize window controls (minimize, maximize, close)
    if (typeof initWindowControls === 'function') {
        initWindowControls();
    }

    // Live clock update
    const timeDisplay = document.getElementById('live-time');
    if (timeDisplay) {
        setInterval(() => {
            const now = new Date();
            timeDisplay.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        }, 1000);
    }

    // Mock KPI Animation (optional, for visual polish)
    animateKPIs();
});

function animateKPIs() {
    const kpis = [
        { id: 'kpi-total-revenue', target: 1245600, prefix: '$' },
        { id: 'kpi-branches', target: 12, prefix: '' },
        { id: 'kpi-employees', target: 48, prefix: '' },
        { id: 'kpi-billing', target: 24, prefix: '' }
    ];

    kpis.forEach(kpi => {
        const el = document.getElementById(kpi.id);
        if (el) {
            let current = 0;
            const increment = kpi.target / 50;
            const interval = setInterval(() => {
                current += increment;
                if (current >= kpi.target) {
                    current = kpi.target;
                    clearInterval(interval);
                }
                el.textContent = kpi.prefix + Math.floor(current).toLocaleString();
            }, 20);
        }
    });
}
