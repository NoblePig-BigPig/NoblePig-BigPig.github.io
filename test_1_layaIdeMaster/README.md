# LayaAir IDE Master (LayaAir IDE 外部自動控制工具)

這是一個基於 **Chrome DevTools Protocol (CDP)** 的 LayaAir 3.x IDE 自動化控制解決方案。它允許開發者與 AI 代理 (Agent) 透過外部進程直接操縱 IDE UI、存取 `Editor` 全域物件，並實現無限制的自動化操作。

## 📺 演示影片 (Demo)

以下是 LayaAir IDE Master 的實際操作演示：

<video src="./product.mp4" width="100%" controls autoplay loop muted></video>

---

## 🚀 核心功能

*   **CDP 橋接器**: 透過 WebSocket 直接注入 JavaScript 到 IDE 的 `sceneEditor.html` 進程。
*   **強大 CLI 工具**: 內建 `laya-cli.js`，支援節點展開、UUID 查詢、場景切換、遊戲播放/停止等指令。
*   **AI Agent 友好**: 提供專為 AI 設計的指令集與 `SKILL.md` 指南，讓 AI 能輕鬆介入開發流程。
*   **白盒探查**: 支援直接對 `Editor` 對象執行 `eval`，實現「上帝視角」的控制與除錯。

## 🛠️ 前置作業 (先決條件)

要讓自動化控制運作，LayaAir IDE 必須以「偵錯模式」啟動。

1.  **啟動 IDE**: 加上 `--remote-debugging-port=9222` 參數。
    ```bash
    # Windows 範例
    LayaAirIDE.exe --project="<專案路徑>" --remote-debugging-port=9222
    ```
2.  **確認連線**: 確保 IDE 完全啟動後，外部指令即可連線至 `localhost:9222`。

## 📖 快速上手 (Quick Start)

所有的核心邏輯與腳本皆位於 `code/` 目錄下：

### 常用指令範例：

```bash
# 1. 展開資源管理器中的目錄
node code/scripts/laya-cli.js expand "assets/scenes"

# 2. 列出專案內的所有資產與其 UUID
node code/scripts/laya-cli.js list "assets"

# 3. 在 IDE 內執行任意 JavaScript 程式碼
node code/scripts/laya-cli.js eval "Editor.panelManager.getPanel('ConsolePanel').log('Hello from CLI!')"

# 4. 啟動互動式選單 (Interactive Menu)
node code/scripts/laya-cli.js menu
```

## 📂 專案結構

- `code/scripts/`: 包含 `cdp-bridge.js` 與 `laya-cli.js` 等核心驅動程序。
- `code/test/`: 預設的自動化測試腳本 (`.bat` 檔)，涵蓋啟動到關閉的全流程。
- `code/SKILL.md`: 給 AI 助手的操作手冊。
- `code/layaIdeController.md`: 詳細的技術原理與 API 探勘指南。

---

## 🤝 貢獻與開發

如果您想瞭解如何控制 Laya IDE 內部未公開的 API，請查閱 [code/layaIdeController.md](file:///Users/yaowei/Documents/NoblePig-BigPig.github.io/test_1_layaIdeMaster/code/layaIdeController.md) 獲取探勘技巧。

---
*Powered by BDL Game Framework & AI Automation Tools*
