/* ============================================================ */
/* PRECISION POS — USB BARCODE SCANNER MODULE                   */
/* Optimized for integration: Pure Emitter Pattern              */
/* ============================================================ */

class BarcodeScanner {
    constructor() {
        this.inputField = document.getElementById('barcode-input');
        this.container = document.getElementById('barcode-scanner-container');
        this.statusText = document.querySelector('.status-text');
        
        // Emulation Logic
        this.lastCharTime = 0;
        this.charTimes = [];
        this.SCAN_SPEED_THRESHOLD = 50; // ms between keystrokes to consider as scanner
        
        this.init();
    }

    init() {
        if (!this.inputField) {
            console.error("USB Scanner: inputField not found!");
            return;
        }

        // Listen for Input
        this.inputField.addEventListener('keydown', (e) => {
            const currentTime = Date.now();
            
            if (this.lastCharTime > 0) {
                this.charTimes.push(currentTime - this.lastCharTime);
            }
            this.lastCharTime = currentTime;

            if (e.key === 'Enter') {
                const barcode = this.inputField.value.trim();
                if (barcode) {
                    this.emitScan(barcode);
                }
                this.inputField.value = '';
                this.charTimes = [];
                this.lastCharTime = 0;
            }
        });

        console.log("USB Scanner: Initialized & Listening");
    }

    emitScan(barcode) {
        // Detect Scan Speed vs Human Typing (Metadata)
        const avgSpeed = this.charTimes.length > 0 
            ? this.charTimes.reduce((a, b) => a + b, 0) / this.charTimes.length 
            : 0;
            
        const isHardwareScanner = avgSpeed < this.SCAN_SPEED_THRESHOLD;

        // Dispatch raw event for the POS system to handle
        const event = new CustomEvent('raw-barcode-scanned', { 
            detail: { 
                barcode: barcode,
                method: 'USB',
                isHardware: isHardwareScanner,
                avgSpeed: avgSpeed
            } 
        });
        document.dispatchEvent(event);
        
        // Visual feedback for scan capture
        this.flashCapture();
    }

    flashCapture() {
        this.container.classList.add('capturing');
        setTimeout(() => this.container.classList.remove('capturing'), 150);
    }

    // This method can be called by the parent to force focus
    focus() {
        if (this.inputField) this.inputField.focus();
    }
}

// Initialize on Load
document.addEventListener('DOMContentLoaded', () => {
    window.USB_Scanner = new BarcodeScanner();
});
