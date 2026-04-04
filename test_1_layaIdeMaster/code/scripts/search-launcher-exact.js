const cdp = require('./cdp-bridge');

async function search() {
    let conn;
    try {
        conn = await cdp.connectLauncher();
        const found = await conn.evaluate(`
            (function(){
                var results = [];
                var visited = new Set();
                function find(obj, path, depth) {
                    if (depth > 6 || !obj || typeof obj !== 'object' || visited.has(obj)) return;
                    visited.add(obj);
                    try {
                        for (var key in obj) {
                            var val = obj[key];
                            var newPath = path + "." + key;
                            if (typeof val === 'string' && val === 'cli_test') {
                                results.push(newPath);
                            } else if (val && typeof val === 'object') {
                                find(val, newPath, depth + 1);
                            }
                        }
                    } catch(e) {}
                }
                find(Launcher, "Launcher", 0);
                return results;
            })()
        `);
        console.log('🔍 Paths containing "cli_test":', found);
    } catch (e) {
        console.error('❌ Search Error:', e.message);
    } finally {
        if (conn) conn.close();
    }
}

search();
