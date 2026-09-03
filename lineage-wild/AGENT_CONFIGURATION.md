# 大軍降臨｜Agent 一鍵配置契約（Math + Scenario）

> 這份內容是自包含的。控制台會在後面自動附上：即時統計、Active Math Config、Math Schema、Scenario 指南、Scenario Schema、目前劇本狀態。收到後不要要求使用者另外上傳文件。

## 1. 先判斷這次要改哪一層

### A. Math Config
使用 `LINEAGE_GAME_MATH_CONFIG`。適合：RTP、Hit Rate、WILD/Scatter 機率、Sticky 成長、倍率權重、FG 局數、Retrigger、Bonus Buy、Paytable、Pool/Exposure 等長期數學調整。

### B. Scenario Config
使用 `LINEAGE_GAME_SCENARIO_CONFIG`。適合：在特定 Spin / Free Spin / Sticky 狀態下，用固定盤或從 Math RNG 候選中挑符合條件的合法盤，做演示、回歸測試、動畫流程、指定 Free Game 節奏。

### C. 兩者一起
若使用者同時要求「先改數學，再建立劇本驗證」，輸出一份完整 Math JSON + 一份完整 Scenario JSON，Scenario 應明確說明綁定哪個 Math config/model。

## 2. 核心架構

- Math Config 是底層規則與概率的 Single Source of Truth。
- Scenario **不取代** Math Config。
- Scenario 未命中的 Spin 一律走 Active Math RNG。
- Scenario `rng` Step 完全走 Active Math RNG。
- Scenario `constraints` Step 只能從 Active Math RNG 生成的候選盤中挑合法盤。
- Scenario `fixed` Step 只覆寫明確指定的 pre-expansion cells；之後仍跑同一套 WILD 展開、19 Paylines、Sticky、FG/Retrigger、Max Win evaluator。
- 不准先算出獎金再直接改 `totalWin`。
- Scenario 統計與 Production RTP/Pool 分開，不能拿劇本結果宣稱理論 RTP。

## 3. Math Production 不可違反

- `profile.mathModel.payScale = 1`。
- Production RNG 維持 `WebCrypto.getRandomValues` / cryptographic=true。
- `policy.playerPoolMayAlterOutcome = false`。
- `policy.housePoolMayAlterOutcome = false`。
- Pool 只能做 accounting / exposure / liquidity，不控制個人下一轉。
- 除非使用者明確要求，不能改玩家可見 Payline / Paytable / Feature 規則。
- 沒有獨立大樣本驗證，只能稱 Candidate，不能稱 Certified / 已達 96%。

## 4. Math 配置常用路徑

- Paytable: `profile.gameConfig.symbols[]`, `profile.gameConfig.paylines`
- WILD: `profile.gameConfig.colors.*.multipliers`, `profile.mathModel.wildChance`
- Multiplier distribution: `profile.mathModel.multiplierDecayByColor`
- Low-risk long WILD: `profile.gameConfig.mathExtensions.longWild`, `profile.mathModel.lowRiskLongWild`
- Sticky: `profile.mathModel.stickyChanceScale`, `profile.gameConfig.mathExtensions.stickyRisk`
- Free Game: `profile.gameConfig.mathExtensions.freeGameStartingSpins`, `freeSpinRetrigger`
- Scatter: `profile.mathModel.scatter`, `mathExtensions.freeGameTriggerScatters`
- Bonus / Buy: `bonusBuyMultipliers`, `mathExtensions.fourHorsemen`
- Card / Side Bet: `catalogRules`, `cardLevelCostFactor`, `mathExtensions.cardEconomy`, `legendaryCardBoost`
- Max Win: `maxWinMultiplier`, `mathExtensions.maxWinRules`
- Objectives: `profile.objectives`
- Pool: `profile.pools`

## 5. Scenario 三種盤面來源

- `source = rng`: 使用 Active Math RNG。
- `source = fixed`: 6x5 pre-expansion board；`null`/`RNG` 表示繼承 Math RNG cell。若固定 WILD 明寫 multiplier，必須是 Active Math 下的合法倍率；推薦使用 `"multiplier":"math"`。
- `source = constraints`: 反覆產生 Math RNG 候選，依 `targetWinX / scatterCount / newStickyCount / stickyAfterCount / expansionColors` 挑合法盤。

Step `when` 可使用：`mode`, `globalSpinNumber`, `paidSpinIndex`, `freeSpinIndex`, `bonusPurchaseType`, `stickyCount`, `stickyReelsContains`。

Assertions 可使用：`winX`, `scatterCount`, `newStickyCount`, `stickyAfterCount`, `stickyReelsAfter`, `bonusTriggered`, `retriggerSpins`, `maxWinReached`。

## 6. 輸出要求

若修改 Math：
1. `Candidate Summary`
2. `Changed Paths`（path / old / new / expected effect）
3. **完整 LINEAGE_GAME_MATH_CONFIG JSON**
4. Expected Direction
5. Validation Plan

若建立/修改劇本：
1. `Scenario Summary`
2. Step-by-step intent
3. **完整 LINEAGE_GAME_SCENARIO_CONFIG JSON**
4. 每步為何用 rng/fixed/constraints
5. Assertions / Compatibility 說明

若兩者都改，兩份完整 JSON 都要輸出，不要只給 patch。
