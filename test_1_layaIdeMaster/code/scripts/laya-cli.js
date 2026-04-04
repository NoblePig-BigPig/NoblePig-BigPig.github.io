#!/usr/bin/env node
/**
 * LayaAir IDE CLI - Modular IDEMaster
 * 主入口路由腳本：負責讀取 commands/ 目錄並啟動交互選單。
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const [,, command, ...args] = process.argv;

const commandsDir = path.join(__dirname, 'commands');
const commands = {};
const menuOptions = [];

// Autoload all command modules
if (fs.existsSync(commandsDir)) {
    const files = fs.readdirSync(commandsDir).filter(f => f.endsWith('.js'));
    for (const file of files) {
        try {
            const mod = require(path.join(commandsDir, file));
            if (mod.commands) {
                for (const key in mod.commands) {
                    commands[key] = mod.commands[key];
                }
            }
            if (mod.menu) {
                menuOptions.push(...mod.menu);
            }
        } catch (e) {
            console.error(`⚠️ 無法載入模組 ${file}:`, e.message);
        }
    }
}

// Sort menu options
menuOptions.sort((a, b) => (a.order || 99) - (b.order || 99));
menuOptions.push({ name: '❌ 退出選單', cmd: 'exit', order: 999 });

async function runCommand(cmdName, cmdArgs = []) {
    if (commands[cmdName]) {
        try {
            return await commands[cmdName](cmdArgs);
        } catch (e) {
            console.error(`\n❌ 指令執行錯誤 [${cmdName}]:`, e.message);
            return false;
        }
    } else if (cmdName === 'menu' || cmdName === 'help' || !cmdName) {
        return await showMenu();
    } else {
        console.error(`\n❌ 未知指令: ${cmdName}`);
        return false;
    }
}

function showMenu() {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    
    const display = () => {
        console.log('\n📱 LayaAir IDEMaster 交互選單 (模組化版)');
        console.log('=======================================');
        menuOptions.forEach((o, i) => console.log(`${i + 1}. ${o.name}`));
        
        rl.question('\n請輸入編號或指令: ', async (input) => {
            const inputStr = input.trim();
            const idx = parseInt(inputStr) - 1;
            const option = menuOptions[idx];
            
            if (option) {
                if (option.cmd === 'exit') { rl.close(); return; }
                
                if (option.prompt) {
                    rl.question(option.prompt, async (ans) => {
                        await runCommand(option.cmd, [ans]);
                        display();
                    });
                    return;
                } else if (option.handler) {
                    // Handler 負責自己的交互邏輯
                    await option.handler(rl, runCommand);
                    display();
                    return;
                } else {
                    await runCommand(option.cmd, option.args || []);
                }
            } else if (inputStr === 'exit' || inputStr === 'q') {
                rl.close(); return;
            } else if (inputStr !== '') {
                await runCommand(inputStr, []);
            }
            display();
        });
    };
    
    display();
    return new Promise(r => rl.on('close', r));
}

// Start CLI
runCommand(command, args).catch(console.error);
