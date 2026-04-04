const cdp = require('./cdp-bridge');

async function search() {
    let conn;
    try {
        conn = await cdp.connectLauncher();
        const found = await conn.evaluate(`
            (function(){
                var results = [];
                function find(obj, path, depth) {
                    if (depth > 5) return;
                    if (!obj || typeof obj !== 'object') return;
                    try {
                        for (var key in obj) {
                            var val = obj[key];
                            var newPath = path + "." + key;
                            if (typeof val === 'string' && val.indexOf('cli_test') !== -1) {
                                results.push(newPath + " = " + val);
                            } else if (typeof val === 'object') {
                                find(val, newPath, depth + 1);
                            }
                        }
                    } catch(e) {}
                }
                find(Launcher, "Launcher", 0);
                return results;
            })()
        `);
        console.log('🔍 Search Results:', found);
    } catch (e) {
        console.error('❌ Search Error:', e.message);
    } finally {
        if (conn) conn.close();
    }
}

search();
