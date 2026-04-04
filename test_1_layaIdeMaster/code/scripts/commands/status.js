const cdp = require('../cdp-bridge');

module.exports = {
    commands: {
        'status': async () => {
            console.log('\n🔍 正在檢測 LayaAir IDE 當前狀態...');
            let targets;
            try {
                targets = await cdp.cdpHTTP('/json');
            } catch(e) {
                console.log('❌ 狀態: [未運行] (無法連接本機 9222 通訊埠, 請確認 IDE 是否開啟)');
                return;
            }
            
            const hasLauncher = targets.some(t => t.type === 'page' && (t.title?.includes('LayaAir') || t.url?.includes('index.html')) && !t.url?.includes('editor.html'));
            const editorTarget = targets.find(t => t.url?.includes('sceneEditor.html'));
            const hasGame = targets.some(t => t.url?.includes('game.html'));
            
            if (hasGame) {
                 console.log('✅ 狀態: [預覽運行中] (GamePanel 處於播放狀態)');
                 let conn;
                 try {
                     conn = await cdp.connectByUrl('game.html');
                     const state = await conn.evaluate(`
                         (function(){
                             try {
                                 if(!window.Laya || !window.Laya.stage) return { error: "Laya 尚未就緒" };
                                 return { 
                                     stageSize: Laya.stage.width + "x" + Laya.stage.height, 
                                     nodes: Laya.stage.numChildren,
                                     fps: Math.round(Laya.timer.currFrame / (performance.now() / 1000)) || 0
                                 };
                             } catch(e) { return { error: e.message }; }
                         })()
                     `);
                     console.log('🔎 運行數據:', state);
                 } catch(e){} finally { if(conn) conn.close(); }
            } 
            else if (editorTarget) {
                 console.log('✅ 狀態: [編輯模式] (專案已開啟)');
                 let conn;
                 try {
                     conn = await cdp.connectToTarget(editorTarget);
                     const info = await conn.evaluate(`
                         (function(){
                             var activeSceneName = 'None';
                             if (Editor.sceneManager && Editor.sceneManager._activeScene) {
                                 var s = Editor.sceneManager._activeScene;
                                 activeSceneName = s.name || s.sceneId;
                             }
                             return {
                                 project: Editor.projectName || 'Unknown',
                                 scene: activeSceneName
                             };
                         })()
                     `);
                     console.log(`📂 當前專案: ${info.project}`);
                     console.log(`🎬 焦點場景: ${info.scene}`);
                 } catch(e){} finally { if(conn) conn.close(); }
            }
            else if (hasLauncher) {
                 console.log('✅ 狀態: [啟動器模式] (IDE 已開啟，但尚未進入專案)');
            }
            else {
                 console.log('⚠️ 狀態: [未知] (CDP 已連通，但找不到標準的 Editor 或 Launcher 頁面)');
                 targets.forEach(t => console.log(`  - ${t.title || 'untitled'} (${t.url})`));
            }
        }
    },
    menu: [
        { name: '🔎 檢測當前狀態 (Status)', cmd: 'status', order: 20 }
    ]
};
