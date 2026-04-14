/* ============================================================ */
/* PRECISION POS — CAMERA SCANNER LOGIC                         */
/* Optimized for integration: Pure Emitter Pattern              */
/* Powered by ZXing and WebRTC                                  */
/* ============================================================ */

class CameraScanner {
    constructor() {
        this.video = document.getElementById('video');
        this.btnStart = document.getElementById('btn-start-camera');
        this.btnStop = document.getElementById('btn-stop-camera');
        this.statusText = document.getElementById('camera-status');
        this.flash = document.getElementById('scan-flash');
        
        // ZXing Reader
        this.codeReader = new ZXing.BrowserMultiFormatReader();
        this.selectedDeviceId = null;
        
        // State
        this.isScanning = false;
        this.lastScannedCode = null;
        this.scanCooldown = 2000; // 2 seconds between identical scans
        this.lastScanTime = 0;
        
        this.init();
    }

    async init() {
        try {
            const videoInputDevices = await this.codeReader.listVideoInputDevices();
            if (videoInputDevices.length === 0) {
                this.handleError("No camera found");
                return;
            }
            this.selectedDeviceId = videoInputDevices[0].deviceId;
            
            this.btnStart.addEventListener('click', () => this.startScanning());
            this.btnStop.addEventListener('click', () => this.stopScanning());
            
            console.log("Camera Scanner: Initialized with device:", this.selectedDeviceId);
        } catch (err) {
            this.handleError("Setup error", err);
        }
    }

    async startScanning() {
        if (this.isScanning) return;
        
        try {
            this.isScanning = true;
            this.btnStart.style.display = 'none';
            this.btnStop.style.display = 'inline-flex';
            this.statusText.textContent = "Status: Scanning...";
            
            this.codeReader.decodeFromVideoDevice(this.selectedDeviceId, 'video', (result, err) => {
                if (result) {
                    this.emitBarcode(result.getText());
                }
                if (err && !(err instanceof ZXing.NotFoundException)) {
                    console.error("Decoding Error:", err);
                }
            });

        } catch (err) {
            this.handleError("Camera access denied", err);
        }
    }

    stopScanning() {
        this.isScanning = false;
        this.codeReader.reset();
        this.btnStart.style.display = 'inline-flex';
        this.btnStop.style.display = 'none';
        this.statusText.textContent = "Status: Standby";
    }

    emitBarcode(barcode) {
        const now = Date.now();
        
        // Debounce / Cooldown Logic
        if (barcode === this.lastScannedCode && (now - this.lastScanTime) < this.scanCooldown) {
            return;
        }
        
        this.lastScannedCode = barcode;
        this.lastScanTime = now;
        
        // Visual local feedback
        this.triggerFlash();
        console.log("Camera Scanner: Barcode Detected ->", barcode);
        
        // Bridge to parent window (POS Terminal)
        if (window.parent && window.parent !== window) {
            window.parent.postMessage({
                type: 'RAW_BARCODE_SCANNED',
                barcode: barcode,
                method: 'CAMERA'
            }, '*');
        }
    }

    triggerFlash() {
        if (this.flash) {
            this.flash.classList.add('active');
            setTimeout(() => this.flash.classList.remove('active'), 100);
        }
    }

    handleError(msg, err) {
        this.statusText.textContent = `Error: ${msg}`;
        console.error(msg, err);
    }
}

// Global instance
document.addEventListener('DOMContentLoaded', () => {
    window.Camera_Scanner = new CameraScanner();
});
