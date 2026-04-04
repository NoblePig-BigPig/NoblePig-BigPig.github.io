const cdp = require('../cdp-bridge');
const fs = require('fs');
const path = require('path');

module.exports = {
    commands: {
        'screenshot': async () => {
             let conn;
             try {
                 conn = await cdp.connect();
                 const timestamp = Date.now();
                 const savePath = path.resolve(`ide_snapshot_${timestamp}.png`);
                 const { data } = await conn.sendCommand('Page.captureScreenshot', { format: 'png' });
                 fs.writeFileSync(savePath, Buffer.from(data, 'base64'));
                 console.log(`📸 截圖已保存到: ${savePath}`);
             } catch(e) {
                 console.error('❌ 截圖快照失敗:', e.message);
             } finally {
                 if (conn) conn.close();
             }
        },
        'console': async (args) => {
             let conn;
             try {
                 const targetType = args[0] === 'launcher' ? 'launcher' : 'editor';
                 conn = targetType === 'launcher' ? await cdp.connectLauncher() : await cdp.connect();
                 
                 console.log(`📡 讀取 ${targetType} 的近期日誌...`);
                 
                 // 嘗試從 IDE 的控制台 DOM 中抓取歷史日誌
                 const logs = await conn.evaluate(`
                     (function(){
                         try {
                             var texts = [];
                             // 針對 LayaAir IDE 面板文字
                             var els = document.querySelectorAll('span.ui-text, .console-text, .log-text');
                             // 倒序遍歷，取最後 20 條相關日誌
                             for(var i = els.length - 1; i >= 0 && texts.length < 20; i--) {
                                 var t = (els[i].textContent || '').trim();
                                 if (t && t.length > 3 && t !== 'red' && t !== 'white') {
                                     texts.unshift(t);
                                 }
                             }
                             return texts;
                         } catch(e) { return ['Error extracting logs: ' + e.message]; }
                     })()
                 `);
                 
                 if(logs && logs.length > 0) {
                     console.log('\n--- 📋 近期控制台日誌 ---');
                     logs.forEach(l => console.log('  ' + l));
                     console.log('-------------------------\n');
                 } else {
                     console.log('⚠️ 未在 IDE UI 上發現可讀取的日誌內容。');
                 }
             } catch (e) {
                 console.error('❌ 讀取日誌失敗:', e.message);
             } finally {
                 if (conn) conn.close();
             }
        }
    },
    menu: [
        { name: '📸 截圖 IDE 快照 (Debug)', cmd: 'screenshot', order: 80 },
        { name: '📜 讀取 IDE 日誌 (Debug)', cmd: 'console', order: 85 }
    ]
};
