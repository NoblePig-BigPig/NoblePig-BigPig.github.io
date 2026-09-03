# 大軍降臨｜Config-first Math + Scenario Server v10

v10 只有兩種可持久化配置，兩者職責分離。

## 1. Math Config

`configType = LINEAGE_GAME_MATH_CONFIG`, `schemaVersion = 3`

Math Config 是遊戲數學的 Single Source of Truth，包含 Paytable、Symbol weights、19 Paylines、WILD 倍率池與機率、Sticky、Scatter、Free Game、Retrigger、Bonus Buy、Card、Max Win、RTP objectives、Pool reserve、CSPRNG 規格等。

正式運行沒有 Scenario 時，所有 Spin 完全依 Active Math Config 開獎。

## 2. Scenario Config

`configType = LINEAGE_GAME_SCENARIO_CONFIG`, `schemaVersion = 1`

Scenario 是可重播的測試/展示序列。它不取代 Math Config，也不擁有第二套 Paytable。

每個 step 指定 `when` + `board`：

- `rng`：完全沿用 Active Math RNG。
- `constraints`：從 Active Math RNG 反覆產生候選盤，只挑符合條件的合法盤。
- `fixed`：指定 6×5 **pre-expansion board**；未指定格仍沿用自然盤。之後仍走 Active Math 的 WILD 展開、Sticky、Paylines、FG、Retrigger、Max Win。

固定 WILD 若明寫 multiplier，必須是目前 Active Math 下該顏色可產生的合法倍率；否則 Scenario 直接 ERROR。推薦使用 `"multiplier":"math"`。

Scenario 運行期間統計寫入獨立 Scenario Runtime，不計入 Production RTP、Player Pool、House Pool。

## 3. 配置切換

切換 Math Config 會停止正在運行的 Scenario，避免劇本跨數學版本繼續跑。Scenario 可用 `mathCompatibility.strict=true` 綁定 `configId` / `modelId`。

## 4. Agent

後台「複製 Agent 完整配置包」會一次複製：

- Math / Scenario 配置規範
- 完整 Math Schema
- 完整 Scenario Schema
- 目前 Active Math JSON
- 目前 Active Scenario JSON（若有）
- 即時統計

貼給 Agent 後只需描述目標，例如：「做一個 Normal Bonus Buy 劇本，第 2 次 FG 需要 2~10x，第 4 次固定藍色 WILD，但所有倍率與結算必須合法於目前 Math。」
