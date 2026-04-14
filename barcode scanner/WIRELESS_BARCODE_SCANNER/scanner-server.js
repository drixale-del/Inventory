const http = require('http');
const os = require('os');
const { ipcMain } = require('electron');

class ScannerServer {
    constructor(port = 3001) {
        this.port = port;
        this.server = null;
        this.localIp = this.getInternalIp();
    }

    getInternalIp() {
        const interfaces = os.networkInterfaces();
        for (const devName in interfaces) {
            const iface = interfaces[devName];
            for (let i = 0; i < iface.length; i++) {
                const alias = iface[i];
                if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                    return alias.address;
                }
            }
        }
        return '0.0.0.0';
    }

    start() {
        this.server = http.createServer((req, res) => {
            // Enable CORS
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

            if (req.method === 'OPTIONS') {
                res.writeHead(204);
                res.end();
                return;
            }

            if (req.method === 'POST' && req.url === '/scan') {
                let body = '';
                req.on('data', chunk => {
                    body += chunk.toString();
                });
                req.on('end', () => {
                    try {
                        const data = JSON.parse(body);
                        console.log('Wireless Scan Received:', data);
                        
                        // data should be { barcode: "...", deviceId: "...", method: "..." }
                        if (data.barcode) {
                            // Send to main process IPC which will forward to renderer
                            ipcMain.emit('wireless-scan-received', null, data);
                            
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ status: 'success', message: 'Scan received' }));
                        } else {
                            throw new Error('Missing barcode');
                        }
                    } catch (err) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ status: 'error', message: err.message }));
                    }
                });
            } else if (req.method === 'GET' && req.url === '/info') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    status: 'online',
                    ip: this.localIp,
                    port: this.port,
                    endpoint: `http://${this.localIp}:${this.port}/scan`
                }));
            } else {
                res.writeHead(404);
                res.end();
            }
        });

        this.server.listen(this.port, '0.0.0.0', () => {
            console.log(`Wireless Scanner Server running at http://${this.localIp}:${this.port}`);
            console.log(`Scanning Endpoint: http://${this.localIp}:${this.port}/scan`);
        });

        this.server.on('error', (e) => {
            if (e.code === 'EADDRINUSE') {
                console.error(`Port ${this.port} is already in use. Wireless server failed to start.`);
            } else {
                console.error('Wireless server error:', e);
            }
        });
    }

    stop() {
        if (this.server) {
            this.server.close();
            console.log('Wireless Scanner Server stopped.');
        }
    }
}

module.exports = ScannerServer;
