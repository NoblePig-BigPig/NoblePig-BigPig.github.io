const cdp = require('../cdp-bridge');

module.exports = {
    commands: {
        'context-menu-hack': async () => {
             let conn;
             try {
                conn = await cdp.connect();
                console.log('🔗 正在 IDE Hierarchy 面板中注入快速添加 Prefab 按鈕 (因原生右鍵無效而改用飄浮按鈕)...');
                
                const result = await conn.evaluate(`
                    (function(){
                        if(window.__ideMasterPrefabBtnInjected) return true;
                        
                        // 1. 尋找 HierarchyPanel
                        var panel = Editor.panelManager.getPanel('HierarchyPanel');
                        if (!panel) return false;
                        
                        var header = panel.panelContent.querySelector('.layout-dock-title') || panel.panelContent.querySelector('.title') || panel.panelContent;
                        
                        // 2. 建立按鈕
                        var btn = document.createElement('button');
                        btn.innerHTML = '🐷+Prefab';
                        btn.style.position = 'absolute';
                        btn.style.right = '40px';
                        btn.style.top = '4px';
                        btn.style.background = '#d42426';
                        btn.style.color = '#fff';
                        btn.style.border = '1px solid #ff4d4f';
                        btn.style.borderRadius = '4px';
                        btn.style.padding = '2px 8px';
                        btn.style.fontSize = '12px';
                        btn.style.fontWeight = 'bold';
                        btn.style.cursor = 'pointer';
                        btn.style.zIndex = '9999';
                        btn.style.boxShadow = '0 2px 5px rgba(0,0,0,0.5)';
                        
                        btn.onclick = function(e) {
                            e.stopPropagation();
                            window.__ideMasterSearchMode = 'insert';
                            var searchPanel = document.getElementById('ide-master-search-panel');
                            if(!searchPanel) {
                                alert('⚠️ 請先在 IDEMaster CLI 選單中執行 [注入 IDE 內部快捷搜尋] (選項 11) 才能使用此功能！');
                                return;
                            }
                            searchPanel.style.display = 'flex';
                            setTimeout(function(){ document.getElementById('ide-master-search-input').focus(); }, 10);
                        };
                        
                        header.style.position = 'relative'; 
                        header.appendChild(btn);
                        window.__ideMasterPrefabBtnInjected = true;
                        
                        // 3. 攔截並修改 原本 search-panel 開啟邏輯
                        var originalOpen = window.__ideMasterOpenAsset;
                        window.__ideMasterOpenAsset = async function(id, pathStr) {
                            if (window.__ideMasterSearchMode === 'insert' && pathStr && pathStr.endsWith('.lh')) {
                                window.__ideMasterSearchMode = 'open'; // 重置模式
                                
                                // 獲取當前選中的節點
                                var sel = Editor.selection ? Editor.selection.getSelection('node') : [];
                                var parentId = (sel && sel.length > 0) ? sel[0] : null;
                                
                                try {
                                    // 加入 Prefab
                                    if (Editor.sceneManager && Editor.sceneManager.createPrefabNode) {
                                        await Editor.sceneManager.createPrefabNode(id, parentId);
                                    } else if (Editor.sceneManager && Editor.sceneManager.createNodeFromPrefab) {
                                        var nodeData = await Editor.sceneManager.createNodeFromPrefab(id, parentId);
                                        if (Editor.history) Editor.history.addRecord(nodeData);
                                    } else {
                                        alert('無法找到適合的 createPrefab 方法 (LayaAir 內部 API 有變動)');
                                    }
                                    
                                    // 關閉搜尋面板
                                    var sp = document.getElementById('ide-master-search-panel');
                                    if(sp) sp.style.display = 'none';
                                    
                                } catch(err) { console.error('插入 Prefab 面板失敗', err); }
                            } else {
                                // 呼叫原本的開啟場景邏輯
                                if (originalOpen) {
                                    window.__ideMasterSearchMode = 'open';
                                    await originalOpen(id, pathStr);
                                }
                            }
                        };
                        
                        return true;
                    })()
                `);
                
                if (result) {
                    console.log('✅ Hierarchy 快速插入 Prefab 按鈕已成功注入！');
                    console.log('👉 請回到 IDE，在場景層級面板 (Hierarchy) 標題列右上角尋找「🐷+Prefab」按鈕。');
                } else {
                    console.error('❌ 注入失敗: 找不到 Hierarchy 面板。請確認您已開啟一個場景。');
                }
             } catch(e) {
                 console.error('❌ 注入按鈕失敗:', e.message);
             } finally { if (conn) conn.close(); }
        }
    },
    menu: [
        { name: '🪄 注入層級面板「+Prefab 按鈕」外掛 (原右鍵功能)', cmd: 'context-menu-hack', order: 88 }
    ]
};
