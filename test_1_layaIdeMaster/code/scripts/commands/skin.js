const cdp = require('../cdp-bridge');

module.exports = {
    commands: {
        'pig-skin': async () => {
             let conn;
             try {
                conn = await cdp.connect();
                console.log('🎄 正在注入【錄影專用】聖誕豬豬 IDE 主題 V2 (Extreme)...');
                
                await conn.evaluate(`
                    (function(){
                        var styleId = 'xmas-pig-skin-v2-recording';
                        var old = document.getElementById('xmas-pig-skin-extreme');
                        if(old) old.remove(); // 移除舊版
                        if(document.getElementById(styleId)) return;
                        
                        var css = \`
                            /* 聖誕錄影版極致配色 */
                            :root {
                                --ui-background: #2b0303 !important;
                                --panel-bg: rgba(43, 3, 3, 0.95) !important;
                                --accent-color: #ffcc00 !important; /* 金色 */
                                --active-color: #00ff00 !important;
                                --ui-border-color: #ffd700 !important;
                            }
                            
                            /* 亮金邊框與深紅背底 */
                            .layout-panel, .ui-panel, .panel-body, [class*="Panel"] {
                                background-color: var(--panel-bg) !important;
                                border: 2px solid #ffd700 !important;
                                box-shadow: 0 0 15px rgba(255, 215, 0, 0.3) !important;
                            }
                            
                            /* 標題欄拐杖糖風格 */
                            .layout-dock-title, .title, .panel-title {
                                background: repeating-linear-gradient(
                                    45deg,
                                    #ff0000,
                                    #ff0000 10px,
                                    #ffffff 10px,
                                    #ffffff 20px
                                ) !important;
                                color: #ff0000 !important;
                                -webkit-text-stroke: 0.5px white;
                                font-size: 16px !important;
                                font-weight: 900 !important;
                                border-bottom: 3px solid #008000 !important;
                            }
                            
                            /* 頂部選單欄金色 */
                            .ui-menubar {
                                background: #800000 !important;
                                border-bottom: 5px solid #ffd700 !important;
                            }

                            /* 聖誕襪裝飾 */
                            body::before {
                                content: '🧦 🧦 🧦';
                                position: fixed;
                                top: 40px; right: 20px;
                                font-size: 50px;
                                z-index: 1000000;
                                filter: drop-shadow(0 0 10px gold);
                                animation: shakeSocks 2s ease-in-out infinite;
                            }
                            
                            @keyframes shakeSocks {
                                0%, 100% { transform: rotate(-10deg); }
                                50% { transform: rotate(10deg); }
                            }

                            /* 聖誕豬豬與禮物 */
                            body::after {
                                content: '🎅🐷🎁';
                                position: fixed;
                                bottom: 20px; right: 20px;
                                font-size: 150px;
                                opacity: 0.8;
                                pointer-events: none;
                                z-index: 1000000;
                                filter: drop-shadow(0 0 30px white);
                            }
                            
                            /* 雪花背景 */
                            #xmas-snow-overlay {
                                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                                pointer-events: none; z-index: 999999;
                                background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text x="10" y="30" fill="white" font-size="20">❅</text><text x="50" y="80" fill="white" font-size="15">❆</text></svg>');
                                animation: snowMove 20s linear infinite;
                                opacity: 0.2;
                            }
                            @keyframes snowMove {
                                from { background-position: 0 0; }
                                to { background-position: 500px 1000px; }
                            }
                        \`;
                        
                        var style = document.createElement('style');
                        style.id = styleId;
                        style.innerHTML = css;
                        document.head.appendChild(style);
                        
                        if(!document.getElementById('xmas-snow-overlay')) {
                            var div = document.createElement('div');
                            div.id = 'xmas-snow-overlay';
                            document.body.appendChild(div);
                        }
                        return true;
                    })()
                `);
                console.log('✅ 超爆裂聖誕豬豬皮膚已成功注入 Editor 面板。');

                let lconn;
                try {
                    lconn = await cdp.connectLauncher();
                    await lconn.evaluate(`
                        (function(){
                            var sid = 'xmas-launcher';
                            if(document.getElementById(sid)) return;
                            var st = document.createElement('style');
                            st.id = sid;
                            st.innerHTML = \`
                                body { 
                                    background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg"><text x="50%" y="50%" font-size="200" text-anchor="middle" dominant-baseline="middle" opacity="0.1">🐷🐖</text></svg>'), linear-gradient(135deg, #4a0000, #002200) !important; 
                                    background-size: cover !important;
                                    animation: flashBg 5s infinite alternate !important;
                                }
                                @keyframes flashBg {
                                    0% { background-color: #4a0000 !important; }
                                    100% { background-color: #002200 !important; }
                                }
                                .recent-box, .project-box { box-shadow: 0 0 30px #ff0000 !important; background: rgba(0,0,0,0.8) !important; border: 3px solid #00ff00 !important; }
                                * { font-family: "Comic Sans MS", cursive !important; }
                                h1, h2, h3, .title { color: #00ff00 !important; font-size: 150%; text-shadow: 0 0 10px #ff0000; }
                                .btn-primary { background: linear-gradient(to bottom, #ff0000, #800000) !important; border: 2px solid yellow !important; transform: scale(1.1); font-weight: bold; }
                                .btn-primary:active { transform: scale(0.9); }
                            \`;
                            document.head.appendChild(st);
                        })()
                    `);
                    console.log('✅ Launcher 面板同步升級為聖誕極致噴發錄影版。');
                } catch(e){} finally { if(lconn) lconn.close(); }

             } catch(e) {
                 console.error('❌ 注入皮膚失敗:', e.message);
             } finally { if (conn) conn.close(); }
        }
    },
    menu: [
        { name: '🎄 套用【錄影專用】聖誕豬豬 IDE 主題 V2 (Extreme)', cmd: 'pig-skin', order: 80 }
    ]
};
