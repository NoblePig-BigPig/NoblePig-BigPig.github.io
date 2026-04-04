/**
 * CDP Bridge for LayaAir IDE
 */
const http = require('http');
const WebSocket = require('ws');

const CDP_PORT = 9222;

function cdpHTTP(path) {
    return new Promise((resolve, reject) => {
        const req = http.get(`http://127.0.0.1:${CDP_PORT}${path}`, { timeout: 5000 }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch (e) { reject(new Error(`Invalid JSON: ${data.substring(0, 200)}`)); }
            });
        });
        req.on('error', (err) => {
            if (err.code === 'ECONNREFUSED') reject(new Error('Cannot connect to LayaIDE. Ensure port 9222 is open.'));
            else reject(err);
        });
        req.on('timeout', () => { req.destroy(); reject(new Error('CDP connection timeout')); });
    });
}

function connectToTarget(target) {
    return new Promise((resolve, reject) => {
        const wsUrl = target.webSocketDebuggerUrl;
        if (!wsUrl) return reject(new Error('Target has no webSocketDebuggerUrl'));
        
        const ws = new WebSocket(wsUrl);
        let msgId = 0;
        const pending = new Map();
        
        ws.on('open', () => {
            const conn = {
                ws,
                target,
                send(method, params = {}) {
                    return new Promise((res, rej) => {
                        const id = ++msgId;
                        pending.set(id, { resolve: res, reject: rej });
                        ws.send(JSON.stringify({ id, method, params }));
                    });
                },
                // Alias for semantic clarity
                async sendCommand(method, params = {}) {
                    return await this.send(method, params);
                },
                async evaluate(expression, awaitPromise = true) {
                    const result = await conn.send('Runtime.evaluate', { expression, awaitPromise, returnByValue: true });
                    if (result.exceptionDetails) {
                        const exc = result.exceptionDetails;
                        throw new Error(`JS Error: ${exc.text || exc.exception?.description || JSON.stringify(exc)}`);
                    }
                    return result.result?.value;
                },
                close() { ws.close(); },
            };
            ws.on('message', (data) => {
                const msg = JSON.parse(data.toString());
                if (msg.id && pending.has(msg.id)) {
                    const { resolve: res, reject: rej } = pending.get(msg.id);
                    pending.delete(msg.id);
                    if (msg.error) rej(new Error(`CDP Error: ${msg.error.message}`));
                    else res(msg.result);
                }
            });
            resolve(conn);
        });
        ws.on('error', (err) => reject(err));
        setTimeout(() => reject(new Error('WebSocket timeout')), 5000);
    });
}

async function connect() {
    const targets = await cdpHTTP('/json');
    // 優先找 sceneEditor.html
    const editor = targets.find(t => t.url?.includes('sceneEditor.html'));
    if (editor) return connectToTarget(editor);
    
    const candidates = targets.filter(t => t.webSocketDebuggerUrl);
    for (const target of candidates) {
        try {
            const conn = await connectToTarget(target);
            const hasEditor = await conn.evaluate('typeof Editor !== "undefined" && !!Editor.panelManager');
            if (hasEditor) return conn;
            conn.close();
        } catch (e) {}
    }
    throw new Error('Editor not found. Wait for IDE to load project.');
}

async function connectLauncher() {
    const targets = await cdpHTTP('/json');
    const launcher = targets.find(t => t.type === 'page' && (t.title?.includes('LayaAir') || t.url?.includes('index.html')) && !t.url?.includes('editor.html'));
    if (!launcher) throw new Error('Launcher target not found');
    return connectToTarget(launcher);
}

async function connectByUrl(pattern) {
    const targets = await cdpHTTP('/json');
    const target = targets.find(t => t.url?.includes(pattern));
    if (!target) throw new Error(`Target matching URL "${pattern}" not found.`);
    return connectToTarget(target);
}

module.exports = {
    connect,
    connectLauncher,
    connectByUrl,
    cdpHTTP,
    connectToTarget
};
