大軍降臨 Standalone Math + Scenario Server v10

啟動：解壓縮後直接雙擊 index.html。
不需要 Node.js / localhost server。

主後台：
1. 正式 Server：Active Math、RTP/Hit/FG/Pool 即時狀態。
2. 數學配置：LINEAGE_GAME_MATH_CONFIG 配置庫，可新增/匯入/切換/重測。
3. 劇本管理：LINEAGE_GAME_SCENARIO_CONFIG 配置庫，可新增/匯入/啟用/停止/重跑。

兩層原則：
- Math Config 是底層數學 Single Source of Truth。
- Scenario Config 只決定特定節點使用 RNG / Fixed pre-board / Constraints。
- 不論 Scenario 用哪種盤面來源，最後都走同一套 WILD 展開、Sticky、19 Payline、Scatter、FG、Retrigger、Max Win evaluator。
- Scenario 統計與 Production RTP / Player Pool / House Pool 分離。

已淘汰流程：
- 舊 RANDOM/SCRIPT/GUARDED PayoutDirector
- 舊「指定下一轉獎級」控制流程
- 舊 MathSimulator / Calibration Lab UI
- 舊 Debug 強制 WILD / FG 控制台

文件：
- CONFIGURATION.md
- AGENT_CONFIGURATION.md
- MATH_CONFIG_SCHEMA.json
- SCENARIO_CONFIGURATION.md
- SCENARIO_CONFIG_SCHEMA.json
- scenario.example.normal-fg.json
