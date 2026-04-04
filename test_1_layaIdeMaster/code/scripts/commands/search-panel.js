const cdp = require('../cdp-bridge');

module.exports = {
    commands: {
        'search-ui': async () => {
            let conn;
            try {
                conn = await cdp.connect();
                console.log('🔍 正在 IDE 中注入 Alt+P 快速搜尋面板...');

                const result = await conn.evaluate(`
                    (function(){
                        if (!Editor.assetDb) return false;
                        
                        var panelId = 'ide-master-search-panel';
                        if (document.getElementById(panelId)) {
                            // Already injected, just show it
                            var exist = document.getElementById(panelId);
                            exist.style.display = 'flex';
                            exist.querySelector('input').focus();
                            return true;
                        }
                        
                        // 1. 建立 UI 結構
                        var container = document.createElement('div');
                        container.id = panelId;
                        container.innerHTML = \`
                            <style>
                                #ide-master-search-panel {
                                    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                                    background: rgba(0,0,0,0.5); z-index: 999999;
                                    display: none; align-items: flex-start; justify-content: center;
                                    padding-top: 100px; backdrop-filter: blur(2px);
                                }
                                #ide-master-search-box {
                                    width: 600px; background: #252526; border: 1px solid #454545;
                                    border-radius: 6px; box-shadow: 0 5px 15px rgba(0,0,0,0.5);
                                    display: flex; flex-direction: column; overflow: hidden;
                                }
                                #ide-master-search-input {
                                    width: 100%; box-sizing: border-box; padding: 12px 15px;
                                    background: #252526; border: none; border-bottom: 1px solid #007acc;
                                    color: #cccccc; font-size: 16px; outline: none;
                                }
                                #ide-master-search-results {
                                    max-height: 400px; overflow-y: auto; list-style: none; margin: 0; padding: 0;
                                }
                                .search-item {
                                    padding: 8px 15px; color: #cccccc; font-size: 13px; cursor: pointer;
                                    display: flex; align-items: center; border-bottom: 1px solid #333;
                                }
                                .search-item:hover, .search-item.active {
                                    background: #094771; color: #ffffff;
                                }
                                .search-item .icon { margin-right: 10px; font-size: 16px; min-width: 20px; }
                                .search-item .path { opacity: 0.6; margin-left: auto; font-size: 11px; }
                            </style>
                            <div id="ide-master-search-box">
                                <input type="text" id="ide-master-search-input" placeholder="搜尋專案中的場景與預製體 (按 Enter 開啟)..." autocomplete="off" />
                                <ul id="ide-master-search-results"></ul>
                            </div>
                        \`;
                        document.body.appendChild(container);
                        
                        var input = document.getElementById('ide-master-search-input');
                        var resultsUl = document.getElementById('ide-master-search-results');
                        var activeIndex = -1;
                        var currentAssets = [];
                        
                        // 2. 獲取所有資源清單
                        function getAssets() {
                            var assets = [];
                            var db = Editor.assetDb;
                            for (var p in db._assetsByPath) {
                                if (!p.startsWith('~/') && (p.endsWith('.ls') || p.endsWith('.lh'))) {
                                    assets.push({ path: p, id: db._assetsByPath[p].id, name: p.split('/').pop() });
                                }
                            }
                            return assets;
                        }
                        
                        // 3. 渲染列表
                        function renderList(query) {
                            var assets = getAssets();
                            var tokens = query.toLowerCase().split(' ').filter(Boolean);
                            
                            currentAssets = assets.filter(function(a) { 
                                var tp = a.path.toLowerCase();
                                return tokens.every(function(tk) { return tp.includes(tk); });
                            }).slice(0, 50); // 最多 50 筆
                            
                            resultsUl.innerHTML = '';
                            activeIndex = currentAssets.length > 0 ? 0 : -1;
                            
                            currentAssets.forEach(function(a, idx) {
                                var li = document.createElement('li');
                                li.className = 'search-item' + (idx === 0 ? ' active' : '');
                                li.innerHTML = '<span class="icon">' + (a.path.endsWith('.ls') ? '🎬' : '📦') + '</span>' + 
                                               '<span>' + a.name + '</span>' + 
                                               '<span class="path">' + a.path + '</span>';
                                li.onclick = function() { window.__ideMasterOpenAsset(a.id, a.path); };
                                resultsUl.appendChild(li);
                            });
                        }
                        
                        // 4. 開啟資源 (預設邏輯，可被 context-menu 覆蓋)
                        window.__ideMasterOpenAsset = async function(id, pathStr) {
                            container.style.display = 'none';
                            try {
                                var db = Editor.assetDb;
                                var asset = db._assetsByPath[pathStr];
                                if (!asset && typeof db.getAssetById === 'function') asset = db.getAssetById(id);
                                if(asset) {
                                    var pp = Editor.panelManager.getPanel('ProjectPanel');
                                    if(pp && typeof pp.onOpen === 'function') {
                                        pp.onOpen({ flags: 0, file: asset.file });
                                    }
                                }
                            } catch(e) { console.error('快捷開啟資源錯誤', e); }
                        };
                        // 5. 事件綁定
                        window.addEventListener('keydown', function(e) {
                            // Alt + Q 開啟面板
                            if (e.altKey && e.key.toLowerCase() === 'q') {
                                e.preventDefault();
                                container.style.display = 'flex';
                                input.value = '';
                                renderList('');
                                setTimeout(function(){ input.focus(); }, 10);
                            }
                            // ESC 關閉面板
                            if (e.key === 'Escape' && container.style.display === 'flex') {
                                container.style.display = 'none';
                            }
                        });
                        
                        input.addEventListener('input', function(e) {
                            renderList(e.target.value);
                        });
                        
                        input.addEventListener('keydown', function(e) {
                            if(currentAssets.length === 0) return;
                            var items = resultsUl.children;
                            
                            if (e.key === 'ArrowDown') {
                                e.preventDefault();
                                if(activeIndex >= 0) items[activeIndex].classList.remove('active');
                                activeIndex = (activeIndex + 1) % currentAssets.length;
                                items[activeIndex].classList.add('active');
                                items[activeIndex].scrollIntoView({block: 'nearest'});
                            } else if (e.key === 'ArrowUp') {
                                e.preventDefault();
                                if(activeIndex >= 0) items[activeIndex].classList.remove('active');
                                activeIndex = (activeIndex - 1 + currentAssets.length) % currentAssets.length;
                                items[activeIndex].classList.add('active');
                                items[activeIndex].scrollIntoView({block: 'nearest'});
                            } else if (e.key === 'Enter') {
                                e.preventDefault();
                                if(activeIndex >= 0 && currentAssets[activeIndex]) {
                                    window.__ideMasterOpenAsset(currentAssets[activeIndex].id, currentAssets[activeIndex].path);
                                }
                            }
                        });
                        
                        // 點擊背景關閉
                        container.addEventListener('click', function(e){
                            if(e.target === container) container.style.display = 'none';
                        });

                        return true;
                    })()
                `);

                if (result) {
                    console.log('✅ VSCode 風格 Search 面板已在 IDE 內啟動！');
                    console.log('👉 請回到 LayaAir IDE 畫面，按下 【Alt + Q】 即可體驗。');
                } else {
                    console.error('❌ 注入失敗: 找不到 Editor 實例。');
                }
            } catch (e) {
                console.error('❌ 注入例外:', e.message);
            } finally { if (conn) conn.close(); }
        }
    },
    menu: [
        { name: '🔍 注入 IDE 內部快捷搜尋 (支援 Alt+Q)', cmd: 'search-ui', order: 85 }
    ]
};
