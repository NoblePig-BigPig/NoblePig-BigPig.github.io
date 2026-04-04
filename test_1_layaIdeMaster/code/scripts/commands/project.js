const cdp = require('../cdp-bridge');
const fs = require('fs');

module.exports = {
    commands: {
        'list-projects': async () => {
            let conn;
            try {
                conn = await cdp.connectLauncher();
                const rawProjects = await conn.evaluate(`(Launcher.config && Launcher.config._data && Launcher.config._data.recent_projects) || []`);
                const search = await conn.evaluate(`(Launcher.projectView && Launcher.projectView._searchTemplateStr) || ""`);
                const projects = rawProjects.filter(p => {
                    if (!p.path) return false;
                    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
                    try { return fs.existsSync(p.path); } catch(e) { return false; }
                });
                if (projects.length > 0) {
                    console.log('\n🔍 當前列表中的有效專案:');
                    projects.forEach((p, i) => console.log(`  [${i}] ${p.name} (${p.path})`));
                    return projects;
                } else {
                    console.log('\n⚠️ 當前列表中沒有有效專案。');
                    return [];
                }
            } catch (e) {
                console.error('❌ 無法讀取專案列表 (確認啟動器頁面是否開啟):', e.message);
                return [];
            } finally { if (conn) conn.close(); }
        },
        'open-project': async (args) => {
            const arg = args[0];
            let conn;
            try {
                conn = await cdp.connectLauncher();
                const rawProjects = await conn.evaluate(`(Launcher.config && Launcher.config._data && Launcher.config._data.recent_projects) || []`);
                const search = await conn.evaluate(`(Launcher.projectView && Launcher.projectView._searchTemplateStr) || ""`);
                const list = rawProjects.filter(p => {
                    if (!p.path) return false;
                    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
                    try { return fs.existsSync(p.path); } catch(e) { return false; }
                }).map(p => p.path);
                
                let projectPath = arg;
                if (arg !== undefined && !isNaN(arg)) {
                    const idx = parseInt(arg);
                    if (idx < list.length) projectPath = list[idx];
                }
                if (!projectPath) return;

                console.log(`🚀 正在開啟專案: ${projectPath}`);
                await conn.evaluate(`Launcher.projectView.openProject(${JSON.stringify(projectPath)})`);
                console.log('✅ 開啟指令已發送 (請等待編譯與載入)');
                return true;
            } catch(e) {
                console.error('❌ 無法開啟專案:', e.message);
                return false;
            } finally { if (conn) conn.close(); }
        }
    },
    menu: [
        { name: '🔍 列出專案清單', cmd: 'list-projects', order: 40 },
        { 
            name: '🎯 開啟指定專案', 
            handler: async (rl, runCommand) => {
                const list = await runCommand('list-projects');
                if (list && list.length > 0) {
                    await new Promise(resolve => {
                        rl.question('\n👉 請輸入專案編號或路徑: ', async (idx) => {
                            if (idx.trim() !== '') await runCommand('open-project', [idx]);
                            resolve();
                        });
                    });
                }
            },
            order: 50 
        }
    ]
};
