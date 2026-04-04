# Laya IDE 外部自動控制 (CLI) 完全指南

## 核心設計理念
LayaAir IDE 3.x 預設對外部控制支援有限（只有無法存取 IDE UI 介面的 `--script` 無頭環境）。本方案採用 **Chrome DevTools Protocol (CDP)**，直接從外部 Node.js 行程透過 WebSocket 注入 JavaScript 至 `sceneEditor.html`（IDE 控制器的主要渲染行程），藉此取得 LayaAir `Editor` Global Object (全域物件) 的「**無限制上帝存取權**」。

任何未來的 AI 代理 (Agent) 或開發者只要遵循這份指南，便能瞬間學會如何完全操作 LayaAir IDE！

---

## 前置作業 (先決條件)
要讓此 CLI 運作，**LayaAir IDE 必須掛載 `--remote-debugging-port=9222` 參數啟動**。

**啟動方式**：使用 `tools\start-ide-debug.bat`，或在命令列手動啟動：
```bash
# Windows 範例
C:/Users/<Username>/AppData/Local/Programs/LayaAirIDE/LayaAirIDE.exe --project="<你的專案路徑>" --remote-debugging-port=9222
```

---

## 工具集介紹

### 1. `tools/cdp-bridge.js` (核心橋樑)
負責使用 HTTP 探測 `:9222/json` 端點，並尋找包含 `Editor` 全域物件的 `sceneEditor.html` Target，接著建立 WebSocket 連線準備注入指令。
- **匯出方法**：
  - `cdp.connect()`: 尋找 IDE 並回傳已建立好的 CDP 連線 (`conn`)。
  - `conn.evaluate(jsString)`: 在 IDE 內非同步執行自訂 JS 並返回結果（支援 Promise 回傳與錯誤捕獲）。
  - `conn.close()`: 執行完畢後必須手動關閉。

### 2. `tools/laya-cli.js` (命令列介面)
封裝了常用的 IDE 面板 (Panel) 控制指令。可以直接執行，無須理會底層的連線邏輯。

> **執行方式**：從專案根目錄執行 `node tools/laya-cli.js <command> [args]`

#### 內建強大指令：

- **展開並選中資源節點 (最常使用)**：
  ```bash
  # 支援絕對徑或相對路徑，系統會自動在 assetDb 轉換成 UUID
  node tools/laya-cli.js expand assets                    # 展開專案根目錄
  node tools/laya-cli.js expand "../src"                  # 展開程式碼目錄
  node tools/laya-cli.js expand "resourcesRemote/BDLGame/305" # 展開特定子資料夾
  ```
- **收起所有資料夾**：
  ```bash
  node tools/laya-cli.js collapse
  ```
- **列出 IDE 中資源對應的 UUID (用於偵錯/探勘)**：
  ```bash
  node tools/laya-cli.js list "resourcesRemote/BDLGame"
  ```
- **在 IDE 中強制執行任意 JS (超級開發者模式) ⚡**：
  ```bash
  node tools/laya-cli.js eval "Editor.panelManager.getPanel('ConsolePanel').log('Hello Laya!')"
  ```

---

## 👨‍💻 AI Agent 開發者秘笈：如何探索與控制未知的 API？

由於我們能透過 `conn.evaluate()` 執行任何語法，當你（AI Agent）需要控制 Laya IDE 內部未知的模組時，請依循以下 S.O.P.：

### 步驟 1: 探勘 (Probing)
你可以透過 `eval` dump 出所有核心屬性與方法，例如探測有哪些 Panel 可用：
```bash
node tools/laya-cli.js eval "Editor.panelManager._allPanelIds"
```
（已知有：`ProjectPanel` [資源管理器]、`ConsolePanel` [控制台]、`HierarchyPanel` [層次節點]、`ScenePanel` [場景編輯]、`InspectorPanel` [屬性列表]...等等近 30 個）。

要探查特定 Panel（如取得 `ProjectPanel` 的所有方法）：
```bash
node tools/laya-cli.js eval "(function() { var p = Editor.panelManager.getPanel('ProjectPanel'); return Object.getOwnPropertyNames(Object.getPrototypeOf(p)); })()"
```

### 步驟 2: 解析資產資料庫 (Asset Database)
LayaAir 將所有專案資源記錄在 `Editor.assetDb._assetsByPath`，此 Table 使用相對路徑（如 `../src/Main.ts`）對應內部資產物件（包含 `id` [即 UUID], `name`, `type`, `isFolder`）。
- **黃金守則**：幾乎所有的 IDE API 都不吃「路徑字串」，而是吃 **UUID (`asset.id`)**。當你需要操作檔案，必須先去查表。

### 步驟 3: 注入控制腳本 (Action)
當你弄清楚 API 後，可以使用 `eval` 或擴充 `laya-cli.js`。例如印出訊息到 Laya 控制台：
```javascript
// 在 laya-cli.js 裡或是 eval 中可以這樣呼叫
const cp = Editor.panelManager.getPanel('ConsolePanel');
if (cp && cp.log) {
    cp.log("成功由跨進程控制 IDE！");
}
```

## 常見問題與除錯 (Troubleshooting)

1. **`No debuggable targets found` 或 `Editor not found in any target` 錯誤**
   - **原因**：IDE 尚未完全啟動，或是沒有加上 `--remote-debugging-port=9222`。
   - **解法**：確認使用了批次檔啟動，並且等待至少 5~10 秒讓 `sceneEditor.html` 完全載入後再呼叫 CLI。
2. **`expand` 指令回應找不到路徑**
   - **原因**：傳入的路徑前綴不對。
   - **解法**：先使用 `node tools/laya-cli.js list` 確認你在 `Editor.assetDb` 中的路徑長什麼樣子。特別注意，根目錄 `assets` 的內部 path 其實是 `""` (空字串)，不過 CLI 內已經針對 `assets` 做了特殊對應。
3. **CDP Timeout (連線逾時)**
   - **原因**：執行的 `evaluate` JS 如果有錯（或內部等待太久未 Return）。
   - **解法**：在注入的 JS 內一律使用 `try...catch` 以便將 Error Message 傳回 CLI 解析，而不是吃掉錯誤導致 Timeout。

---
*這份指南可以讓你或未來的 AI 免去大量的逆向工程時間，馬上享受完全控制 LayaAir IDE 的快感！*
