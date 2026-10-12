---
name: "one-click-game-builder"
description: "一句话把网页小游戏从想法变成可玩链接：按游戏类型选脚手架模板（2D 单文件 / 3D Manager），AI 按章节填空，eval-harness 门禁，静态托管发布。方法论来自对 Rosebud AI 的逆向（管线 + 脚手架反推）。"
metadata: { "includeInPrompt": true }
---

# One-Click Game Builder（网页游戏一键构建）

## Purpose

把"做个小游戏"压缩成一次对话：用户一句话需求 → 选模板 → AI 按章节生成 → 门禁 → 上线链接 → 手机可玩。

方法论来源：2026-10-12 逆向 Rosebud AI（前端管线架构 + 2D/3D 生成代码脚手架反推）， distilled in `references/rosebud-findings.md`。只学模式，不搬代码。

适用范围：2D 休闲（2048/三消/跑酷/弹珠/合成类）、3D 简单场景（跑酷/收集/轻度战斗）。复杂 3D 叙事不在范围内。

## Workflow

### 1. 路由：选模板（对标 Rosebud 的 game-types）

- 2D 休闲 → `references/template-2d.md`：单文件 `main.js`，11 章节固定顺序，原生 Canvas
- 3D 简单场景 → `references/template-3d.md`：`Game` 编排器 + Manager 类，Three.js pin 版本走 CDN
- 拿不准默认 2D；用户明确要 3D 才上 3D。先 2D 验证好玩（L1），再考虑 3D 化

### 2. 生成：按章节填空

把用户需求翻译成"每个章节填什么"，一次生成完整代码。**章节顺序不许打乱**——这是生成代码风格统一的来源。Juice 章节强制（粒子/震屏/连击/浮字至少 3 种，不写不算完成）。

### 3. 门禁：eval-harness

用 `eval-harness` skill 给游戏装 `playtest/prepush.sh`，五项全绿才继续。任一失败 → 打回改代码，不许跳过。

### 4. 发布：静态托管

构建输出 = `index.html`（见 `templates/index.html`）+ `main.js`（+ `assets/`），零构建步骤。默认 Cloudflare Pages，任何静态托管均可。

### 5. 迭代：commit-per-iteration

每次改动 = 一次 git commit，可回滚。需求变更走新一轮"生成→门禁→发布"，不手改 hotfix。

## Output Contract

- 交付物：可玩 URL + 仓库目录（含源码）
- 2D：单文件，≤ ~1000 行；3D：≤ 6 文件
- 门禁全绿；手机浏览器实测可玩；首屏 3 秒内可交互

## Operating Rules

1. 模板章节顺序不许打乱，不许自创结构。
2. Juice 强制章节，不写不算完成。
3. 移动端数值写死：宽屏居中 520px 列、DPR 上限 2、滑动判定阈值 28px。
4. 平台插桩（里程碑上报等）用可选链注入，游戏不依赖平台也能独立跑。
5. Three.js 版本号 pin 死在 importmap，走 esm.sh CDN，不打包进构建。
6. 音频首次交互解锁，`play().catch(()=>{})` 静默失败；localStorage 读写带 fallback。
7. 动画用帧内固定步长推进，不用 delta 时间做动画插值（主循环 delta 仅用于逻辑计时）。
