const { spawn, exec } = require('child_process');

module.exports = {
    commands: {
        'start': async () => {
             const idePath = "C:/Users/user/AppData/Local/Programs/LayaAirIDE/LayaAirIDE.exe";
             console.log('🚀 啟動 LayaAir IDE (Debug 埠口: 9222)...');
             const child = spawn(idePath, ['--remote-debugging-port=9222'], { detached: true, stdio: 'ignore' });
             child.unref();
             console.log('✅ IDE 啟動指令已發送。');
        },
        'stop': async () => {
             console.log('🛑 關閉 LayaAir IDE...');
             return new Promise(r => {
                 exec('taskkill /f /im LayaAirIDE.exe', (err) => {
                     if (err) console.error('❌ 無法關閉 IDE 或 IDE 未運行:', err.message);
                     else console.log('✅ IDE 已完全關閉。');
                     r();
                 });
             });
        }
    },
    menu: [
        { name: '🚀 啟動 IDE (9222)', cmd: 'start', order: 10 },
        { name: '🛑 關閉 IDE', cmd: 'stop', order: 900 }
    ]
};
