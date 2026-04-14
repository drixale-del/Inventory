const codeReader = new ZXing.BrowserMultiFormatReader();
let selectedDeviceId;
let posEndpoint = '';

const setupView = document.getElementById('setup-view');
const scannerView = document.getElementById('scanner-view');
const posIpInput = document.getElementById('pos-ip');
const btnConnect = document.getElementById('btn-connect');
const btnStop = document.getElementById('btn-stop');
const connStatus = document.getElementById('conn-status');
const toast = document.getElementById('feedback-toast');
const toastMsg = document.getElementById('toast-msg');

// Load saved IP
const savedIp = localStorage.getItem('pos-ip');
if (savedIp) {
    posIpInput.value = savedIp;
}

btnConnect.addEventListener('click', () => {
    const ip = posIpInput.value.trim();
    if (!ip) {
        showToast('Please enter an IP address', 'error');
        return;
    }

    posEndpoint = `http://${ip}:3001/scan`;
    localStorage.setItem('pos-ip', ip);
    
    startScanner();
});

btnStop.addEventListener('click', () => {
    stopScanner();
});

async function startScanner() {
    try {
        const videoInputDevices = await codeReader.listVideoInputDevices();
        if (videoInputDevices.length === 0) {
            showToast('No camera found', 'error');
            return;
        }

        // Prefer back camera
        selectedDeviceId = videoInputDevices.find(device => 
            device.label.toLowerCase().includes('back') || 
            device.label.toLowerCase().includes('rear')
        )?.deviceId || videoInputDevices[0].deviceId;

        setupView.classList.add('hidden');
        scannerView.classList.remove('hidden');
        connStatus.textContent = 'Active';
        connStatus.classList.add('online');

        codeReader.decodeFromVideoDevice(selectedDeviceId, 'video', (result, err) => {
            if (result) {
                console.log('Scanned:', result.text);
                sendScan(result.text);
                // Vibrate for feedback
                if (navigator.vibrate) navigator.vibrate(100);
            }
        });

    } catch (err) {
        console.error(err);
        showToast('Camera error: ' + err.message, 'error');
    }
}

function stopScanner() {
    codeReader.reset();
    scannerView.classList.add('hidden');
    setupView.classList.remove('hidden');
    connStatus.textContent = 'Disconnected';
    connStatus.classList.remove('online');
}

async function sendScan(barcode) {
    try {
        const response = await fetch(posEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                barcode: barcode,
                deviceId: navigator.userAgent.split(' ')[0] || 'Mobile',
                method: 'Mobile'
            })
        });

        const data = await response.json();
        if (data.status === 'success') {
            showToast('Scan Sent: ' + barcode);
        } else {
            showToast('Server error: ' + data.message, 'error');
        }
    } catch (err) {
        console.error('Fetch error:', err);
        showToast('Failed to send scan. Check IP.', 'error');
    }
}

function showToast(message, type = 'success') {
    toastMsg.textContent = message;
    toast.style.background = type === 'success' ? '#22c55e' : '#ef4444';
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 2000);
}
