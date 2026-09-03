# 大軍降臨｜Scenario 劇本配置指南

Scenario 與 Math Config 是兩層，不互相替代：

- `LINEAGE_GAME_MATH_CONFIG`：決定 Paytable、Symbol/WILD/Scatter 機率、Sticky、Free Game、Max Win、RNG 等底層數學。
- `LINEAGE_GAME_SCENARIO_CONFIG`：只描述「什麼時候用哪種盤面來源」。所有盤面最後仍走同一套 WILD 展開、19 線 evaluator、FG/Sticky/Retrigger/Max Win 結算。

## 三種盤面來源

### `rng`
完全使用目前 Active Math Config 的正式 RNG。適合劇本中間留出自然段落。

### `fixed`
指定 6 軸 × 5 列的 pre-expansion board。每個 cell 可用：

- `null` 或 `"RNG"`：保留 Math RNG 原本生成的格子。
- 一般 symbol：`"TEN"`, `"J"`, `"Q"`, `"K"`, `"A"`, `"EYE"`, `"CUP"`, `"SUN"`, `"HAND"`, `"FACE"`。
- Scatter：`"SCATTER"`。
- WILD：`{"symbol":"WILD","color":"blue","multiplier":2}`。明寫倍率時，必須是目前 Active Math 經 Long WILD 調整後的合法倍率，否則劇本直接 ERROR。
- WILD 倍率交給 Math：`{"symbol":"WILD","color":"blue","multiplier":"math"}`。這是推薦寫法，顏色固定但倍率仍由 Active Math 分布抽取。

Free Game 已經黏住的 Sticky reel 不能被 fixed board 覆寫；該 reel 請用 `null` / `RNG`。

### `constraints`
不手工改盤，而是反覆從 Active Math Config 生成候選盤，再用條件挑一個合法盤。可限制：

- `targetWinX`
- `scatterCount`
- `newStickyCount`
- `stickyAfterCount`
- `expansionColors`

這個模式最適合「FG 第 2 局想要 2~10x 小獎，但仍需來自目前 Math Model」的劇本。

## `when` 觸發條件

每個 Step 只在條件匹配時執行，未匹配時遊戲照 Math RNG 正常跑，劇本 cursor 不前進：

- `mode`: `any | base | normal | super`
- `globalSpinNumber`
- `paidSpinIndex`
- `freeSpinIndex`
- `bonusPurchaseType`: `normal | super`
- `stickyCount`
- `stickyReelsContains`：0-based reel，例如 `[1,2]` = R2 + R3

## Assertions

劇本可以對真實結算結果做 assertion：

- `winX`
- `scatterCount`
- `newStickyCount`
- `stickyAfterCount`
- `stickyReelsAfter`（1-based，方便人看）
- `bonusTriggered`
- `retriggerSpins`
- `maxWinReached`

Assertion 不通過時該 Spin 不 commit，玩家狀態回滾，劇本標記 ERROR。

## 與數學模型共存

Scenario 啟用時，沒有命中的 Step 照 Math RNG；命中 `rng` Step 也照 Math RNG；`constraints` 只從 Math RNG 候選裡選；`fixed` 只覆寫明確指定的 pre-expansion cells。之後全部沿用 Active Math Config 的：

- Long WILD -x / floor
- Sticky 規則
- Paytable / Payline
- FG 起始局數
- Retrigger
- Max Win
- Card / multiplier 規則

Scenario 統計獨立於 Production RTP / Pool，避免劇本測試污染正式數學統計。
