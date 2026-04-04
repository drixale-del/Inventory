/**
 * role-selection/launcher.js
 * Handles role selection events and redirects to the correct hub.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Window Controls (defined in src/window-manager/ui.js)
    if (typeof initWindowControls === 'function') {
        initWindowControls();
        console.log('Launcher: Window controls initialized.');
    } else {
        console.warn('Launcher: ui.js (initWindowControls) not loaded yet.');
    }

    // 2. Add subtle entrance animations to cards
    const cards = document.querySelectorAll('.role-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 300 + (index * 100));
    });
});

/**
 * selectRole
 * Triggered by role card click. Redirects to the corresponding dashboard.
 * @param {string} pageId - The ID of the page to navigate to (e.g. 'admin-dash')
 */
function selectRole(pageId) {
    console.log(`Entering portal: ${pageId}`);
    
    // Add a quick feedback animation before navigating
    const selectedCard = document.getElementById(`${pageId.split('-')[0]}-card`);
    if (selectedCard) {
        selectedCard.style.transform = 'scale(0.98) translateY(-4px)';
        selectedCard.style.opacity = '0.5';
        selectedCard.style.filter = 'blur(10px)';
    }

    // Navigate using the Electron API (exposed in preload.js)
    if (window.electronAPI && typeof window.electronAPI.navigate === 'function') {
        // Navigation slight delay for visual feedback
        setTimeout(() => {
            window.electronAPI.navigate(pageId);
        }, 150);
    } else {
        console.error('Electron API not found. Are you running in a web browser?');
        // Fallback or warning
        alert(`Navigating to ${pageId} (Dev Fallback)`);
    }
}
