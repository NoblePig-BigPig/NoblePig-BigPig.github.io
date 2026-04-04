const cdp = require('../cdp-bridge');

module.exports = {
    commands: {
        'play': async () => {
            let conn;
            try {
                conn = await cdp.connect();
                console.log('▶️ 正在啟動精準預覽 (High-Speed Sync)...');
                
                const result = await conn.evaluate(`
                    (async function(){
                        // 高效精準導航：直接從 Toolbar 開始搜尋，避免全卷掃描
                        function getFastBtn(selector) {
                            var toolbar = document.querySelector('laya-toolbar');
                            if(!toolbar || !toolbar.shadowRoot) return document.querySelector(selector);
                            return toolbar.shadowRoot.querySelector(selector);
                        }

                        try {
                            var s = Editor.scene || (Editor.sceneManager && Editor.sceneManager._activeScene);
                            var sceneId = s ? (s.id || s.sceneId) : null;
                            if (sceneId === 'playing') sceneId = s.url || null;

                            var gp = Editor.panelManager.getPanel('GamePanel');
                            if(gp && gp.startGame) {
                                // 同時發出：引擎啟動 + UI 同步
                                var startTask = gp.startGame(sceneId);
                                
                                var btn = getFastBtn('#btn-play');
                                if(btn) {
                                    // 檢查是否需要同步 UI (如果 icon 還是 play 三角形)
                                    var icon = btn.querySelector('laya-icon, .icon, i');
                                    if(!icon || !icon.classList.contains('stop')) {
                                        btn.click();
                                    }
                                }
                                
                                await startTask;
                                return "SUCCESS_ID_" + (sceneId || "AUTO");
                            }
                            return "ERROR: GamePanel 找不到";
                        } catch(e) {
                            return "ERROR: " + e.message;
                        }
                    })()
                `);
                
                if (result.startsWith("SUCCESS")) {
                    console.log('✅ 預覽已啟動 (' + result + ')。');
                    return true;
                } else {
                    console.error(`❌ 啟動預覽失敗: ${result}`);
                    return false;
                }
            } catch(e) {
                console.error('❌ 預覽控制異常:', e.message);
                return false;
            } finally { if (conn) conn.close(); }
        },
        'stop-play': async () => {
            let conn;
            try {
                conn = await cdp.connect();
                console.log('⏹️ 正在停止預覽 (High-Speed Stop)...');
                const result = await conn.evaluate(`
                    (async function(){
                        function getFastBtn(selector) {
                            var toolbar = document.querySelector('laya-toolbar');
                            if(!toolbar || !toolbar.shadowRoot) return document.querySelector(selector);
                            return toolbar.shadowRoot.querySelector(selector);
                        }

                        try {
                            // 優先點擊 Stop 按鈕同步 IDE UI
                            var btn = getFastBtn('#btn-stop') || getFastBtn('#btn-play');
                            if(btn) {
                                btn.click();
                                return "CLICKED_BTN";
                            }
                            
                            // 暴力墊後：直接調用 stop介面
                            var gp = Editor.panelManager.getPanel('GamePanel');
                            if(gp && gp.stopGame) {
                                await gp.stopGame();
                                return "STOPPED_ENGINE_ONLY";
                            }
                            return "ERROR: 找不到停止觸發點";
                        } catch(e) {
                            return "ERROR: " + e.message;
                        }
                    })()
                `);
                
                if (result === "CLICKED_BTN" || result === "STOPPED_ENGINE_ONLY") {
                    console.log('✅ 停止指令成功執行。');
                    return true;
                } else {
                    console.error(`❌ 停止失敗: ${result}`);
                    return false;
                }
            } catch(e) {
                console.error('❌ 停止預覽控制異常:', e.message);
                return false;
            } finally { if (conn) conn.close(); }
        }
    },
    menu: [
        { name: '▶️ 執行預覽 (Play)', cmd: 'play', order: 60 },
        { name: '⏹️ 停止預覽 (Stop Play)', cmd: 'stop-play', order: 65 }
    ]
};
