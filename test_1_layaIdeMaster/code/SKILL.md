---
name: layaIdeMaster
description: LayaAir 3.0 IDE Automation & Control Master. Controls project explorer, scene assembly, and runtime inspection via CDP.
---

# LayaAir IDE Master Skill

This skill provides a programmatic bridge to the LayaAir 3.0 IDE using the Chrome DevTools Protocol (CDP). It allows for stable, plugin-free automation of the IDE UI and runtime engine.

## 🚀 Core Primitives

## 🛠️ 核心工具與指令 (CLI Pipes)

### 📱 推薦用法：交互式選單 (Interactive Menu)
如果您想手動控制，強烈建議使用交互式選單，免去重複輸入指令。只需執行：
```bash
node .agent/skills/layaIdeMaster/scripts/laya-cli.js menu
```
或者雙擊測試目錄下的 `test/99_interactive_menu.bat`。

---

本技能具備完整的命令列控制能力，所有可用的自動化指令及其語法已解構並存放於：
👉 **[pipe.json](file:///c:/Users/user/Documents/BDL_GAME/laya/LayaAir/Framework/.agent/skills/layaIdeMaster/pipe.json)**

### 🛠️ 工具清單說明：
- **`start` / `stop`**: 控管 IDE 本體進程指令。
- **`list-projects` / `autoOpen`**: 控管啟動選單指令。
- **`open-scene`**: 精準跳轉至特定場景指令。
- **`play` / `stop-play`**: 遙控遊戲預覽指令。
- **`inspect`**: 獲取 Laya 引擎運行時 Stage 資訊指令。

詳細指令語法請務必查閱上述 `pipe.json`。

### 🧪 測試套件 (Test Suite)
為了方便快速驗證指令，我們提供了預設的測試腳本：
👉 **[test/ 目錄](file:///c:/Users/user/Documents/BDL_GAME/laya/LayaAir/Framework/.agent/skills/layaIdeMaster/test/)**
包含從「啟動 -> 進入專案 -> 開啟場景 -> 運行預覽 -> 關閉」的全流程單點測試 `.bat` 檔。

---

## 🤖 給 AI Agents 的組裝指南 (AI Assembly Guide)

為了避免腳本過於龐大且僵化，本技能不再提供預先組裝好的 Demo。請 AI 助手根據任務需求，「自行串接」上述原子指令：

**範例流程：**
1. 啟動：`node scripts/laya-cli.js start`
2. 進入專案：`node scripts/laya-cli.js autoOpen 0`
3. 切換場景：`node scripts/laya-cli.js open-scene "assets/Main.ls"`
4. 測試：`node scripts/laya-cli.js play` -> `node scripts/laya-cli.js inspect`

---

## 🧠 技術原理：這套工具如何運作？

## 🛠️ Included Tools
- `scripts/cdp-bridge.js`: The protocol handler.
- `scripts/laya-cli.js`: Command-line interface.
## 🧠 技術原理：這套工具如何運作？

這套工具利用了 **CDP (Chrome DevTools Protocol)**。LayaAir 3 的 IDE 是基於 Electron 開發的，當它以偵錯模式 (`--remote-debugging-port=9222`) 啟動時，它會開放一個通訊埠。

我們的 `laya-cli.js` 就像是一個「遠端遙控器」：
1. **注入命令**：透過 WebSocket 將 JavaScript 文字傳入 IDE 內部執行。
2. **白盒探查**：直接訪問 IDE 的全域物件（如 `Editor` 或 `Launcher`）來獲取選單、專案清單或目錄結構。
3. **結果回傳**：將 IDE 內部的執行結果擷取成 JSON 傳回命令列。

---

## 🤖 給 AI Agents 的使用範指南 (AI Tooling)

如果您是正在協助開發的 AI，您可以直接調用此目錄下的 `scripts/laya-cli.js`。

### 常用作業流程：

1. **啟動專案 (從 Launcher 開始)**:
   - 執行 `node scripts/laya-cli.js autoOpen`
2. **定位並展開目錄 (專案面板)**:
   - 執行 `node scripts/laya-cli.js expand "assets/scenes"`
3. **檢查遊戲運行狀態 (GamePanel)**:
   - 執行 `node scripts/laya-cli.js eval "Editor.panelManager.getPanel('GamePanel').playing"`
4. **自訂深度控制**:
   - 執行 `node scripts/laya-cli.js eval "Editor.scene.addChild(...)"`

### 注意事項：
- 任何指令失敗時，請先檢查 `node scripts/laya-cli.js targets` 確保連線埠 9222 已開啟。
- 專案路徑若包含空格，請務必加引號。

