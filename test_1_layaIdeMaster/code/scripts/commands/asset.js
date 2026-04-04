const cdp = require('../cdp-bridge');
const fs = require('fs');
const path = require('path');

function scanAssetsDeep(dir, projectRoot) {
    let results = [];
    if(!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    for(let file of list) {
        let fullPath = path.resolve(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            if(!file.startsWith('.')) results = results.concat(scanAssetsDeep(fullPath, projectRoot));
        } else if (fullPath.endsWith('.ls') || fullPath.endsWith('.lh')) {
            try {
                let id = fullPath; 
                let metaPath = fullPath + '.meta';
                if(fs.existsSync(metaPath)) {
                    let meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
                    if(meta && meta.uuid) id = meta.uuid;
                }
                
                // 轉化為相對於 assets/ 或 src/ 的路徑 (Laya 內部 DB 不包含 assets/ 前綴)
                let relPath = fullPath.substring(projectRoot.length + 1).replace(/\\/g, '/');
                if (relPath.startsWith('assets/')) relPath = relPath.substring(7);
                else if (relPath.startsWith('src/')) relPath = relPath.substring(4);
                
                results.push({ path: relPath, id: id, name: file });
            } catch(e) {}
        }
    }
    return results;
}

module.exports = {
    commands: {
        'list-assets': async () => {
            let conn;
            try {
                conn = await cdp.connect();
                const projectDir = await conn.evaluate(`Editor.projectPath || ""`);
                
                let fsAssets = [];
                if (projectDir) {
                    const assetsDir = path.join(projectDir, 'assets');
                    const srcDir = path.join(projectDir, 'src');
                    fsAssets = fsAssets.concat(scanAssetsDeep(assetsDir, projectDir));
                    fsAssets = fsAssets.concat(scanAssetsDeep(srcDir, projectDir));
                }
                
                const ideAssets = await conn.evaluate(`
                    (function(){
                        if (!Editor.assetDb) return [];
                        var db = Editor.assetDb;
                        return Object.keys(db._assetsByPath)
                            .filter(p => !p.startsWith('~/') && (p.endsWith('.ls') || p.endsWith('.lh')))
                            .map(p => ({ path: p, id: db._assetsByPath[p].id, name: p.split('/').pop() }));
                    })()
                `);
                
                let combined = {};
                for(let a of fsAssets) combined[a.id] = a;
                for(let a of ideAssets) {
                    if(!combined[a.id]) combined[a.id] = a;
                }
                
                let finalAssets = Object.values(combined);
                // 必須排序，否則每次索引都會跳掉 (Object.values 不保證順序)
                finalAssets.sort((a, b) => a.path.localeCompare(b.path));
                
                if (finalAssets.length > 0) {
                    console.log('\n🎬 專案中遞迴掃描到的所有場景與預製體清單:');
                    finalAssets.forEach((s, i) => console.log(`  [${i}] ${s.name} (${s.path})`));
                    return finalAssets;
                } else {
                    console.log('\n⚠️ 專案中沒有任何 .ls / .lh 檔案。');
                    return [];
                }
            } catch (e) {
                console.error('❌ 無法讀取資源列表:', e.message);
                return [];
            } finally { if (conn) conn.close(); }
        },
        'open-asset': async (args) => {
            const arg = args[0];
            let conn;
            try {
                conn = await cdp.connect();
                let assetItem = null;
                
                if (arg !== undefined && !isNaN(arg)) {
                    const projectDir = await conn.evaluate(`Editor.projectPath || ""`);
                    let list = [];
                    if (projectDir) {
                        list = list.concat(scanAssetsDeep(path.join(projectDir, 'assets'), projectDir));
                        list = list.concat(scanAssetsDeep(path.join(projectDir, 'src'), projectDir));
                    }
                    var ideData = await conn.evaluate(`(function(){ var db=Editor.assetDb; return db?Object.keys(db._assetsByPath).filter(p=>!p.startsWith('~/')&&(p.endsWith('.ls')||p.endsWith('.lh'))).map(p=>({path:p,id:db._assetsByPath[p].id})):[]; })()`);
                    if(ideData && ideData.length) {
                         var c={}; list.forEach(x=>c[x.id]=x); ideData.forEach(x=>{if(!c[x.id])c[x.id]=x}); list=Object.values(c);
                    }
                    // 再次排序確保索引與 list-assets 一致
                    list.sort((a, b) => a.path.localeCompare(b.path));

                    const idx = parseInt(arg);
                    if (idx < list.length) assetItem = list[idx];
                } else if (arg !== undefined) {
                    assetItem = { id: arg };
                }
                
                if (!assetItem || !assetItem.id) return false;

                console.log(`📂 準備開啟資源: ${assetItem.name || assetItem.id}`);
                
                const result = await conn.evaluate(`
                    (async function(){
                        try {
                            var db = Editor.assetDb;
                            var asset = null;
                            if(db) {
                                 // 優先用 UUID 找，最準
                                 if(typeof db.getAssetById === 'function') asset = db.getAssetById(${JSON.stringify(assetItem.id)});
                                 // 找不到再用路徑找 (注意：這裡的路徑必須跟 DB Key 完全一致)
                                 if(!asset && db._assetsByPath) asset = db._assetsByPath[${JSON.stringify(assetItem.path)}];
                            }
                            
                            // 重要：如果 asset 存在，必須傳入 asset.file (這是官方接口要的字串標識)
                            // 如果 asset 暫時不存在 (剛掃出來還沒進 DB)，才傳入相對路徑嘗試
                            var targetFile = asset ? asset.file : ${JSON.stringify(assetItem.path)};
                            
                            var pp = Editor.panelManager.getPanel('ProjectPanel');
                            if(pp && typeof pp.onOpen === 'function') {
                                pp.onOpen({ flags: 0, file: targetFile });
                                return { success: true, target: targetFile };
                            } else {
                                return { error: "找不到 ProjectPanel 的 onOpen 正規接口" };
                            }
                        } catch(err) {
                            return { error: "場景切換腳本異常: " + err.message };
                        }
                    })()
                `);
                
                if (result && result.success) {
                    console.log(`✅ 資源已透過官方原生介面流成功開啟: ${result.target}`);
                    return true;
                } else {
                    console.error(`❌ 開啟失敗 (${assetItem.name||assetItem.id}): ${result ? result.error : '未知錯誤'}`);
                    return false;
                }
            } catch (e) {
                console.error('❌ 開啟資源異常:', e.message);
                return false;
            } finally { if (conn) conn.close(); }
        }
    },
    menu: [
        { 
            name: '📂 開啟場景或預製體 (Scene/Prefab)', 
            handler: async (rl, runCommand) => {
                const list = await runCommand('list-assets');
                if (list && list.length > 0) {
                    await new Promise(resolve => {
                        rl.question('\n👉 請輸入資源編號: ', async (idx) => {
                            if (idx.trim() !== '') await runCommand('open-asset', [idx]);
                            resolve();
                        });
                    });
                }
            },
            order: 55 
        }
    ]
};
