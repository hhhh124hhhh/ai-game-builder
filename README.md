# ai-game-builder

[中文](#中文) | [English](#english)

## 中文

一句话把网页小游戏从想法变成可玩链接。

这是 Muse 的一个 skill：按游戏类型选脚手架模板（2D 单文件 / 3D Manager），AI 按章节填空，`eval-harness` 门禁全绿后发布到静态托管，手机直接玩。

### 方法论来源

2026-10-12 逆向 Rosebud AI 沉淀：前端管线架构（chat → commit → file → preview 版本化迭代循环、模型路由、资产异步 job）+ 2D/3D 生成代码脚手架反推。只学模式，不搬代码。详见 `references/rosebud-findings.md`。

### 快速开始

1. 把本仓库作为 skill 装入 Muse（`~/workspace/skills/one-click-game-builder/`）
2. 在聊天里说："用一键构建做个 XX 游戏"
3. 流程：选模板（2D/3D）→ AI 按章节生成 → 门禁 → 上线链接

### 模板

- `references/template-2d.md`：单文件 `main.js`，11 章节固定顺序，原生 Canvas
- `references/template-3d.md`：`Game` 编排器 + Manager 类，Three.js 0.160.0 pin 版本
- `templates/index.html`：游戏壳模板

### 配套

- [eval-harness](https://github.com/hhhh124hhhh/eval-harness)：推前评估门禁（本 skill 的第 3 步依赖它）

## English

Turn a game idea into a playable link in one sentence.

This is a Muse skill: pick a scaffold template by game type (2D single-file / 3D Manager pattern), let AI fill in chapter by chapter, pass the `eval-harness` gates, then deploy to static hosting and play on your phone.

### Methodology

Distilled from reverse-engineering Rosebud AI on 2026-10-12: frontend pipeline architecture (chat → commit → file → preview versioned iteration loop, model routing, async asset jobs) + 2D/3D scaffold analysis of generated game code. Patterns only, no copied code. See `references/rosebud-findings.md`.

### Quick start

1. Install this repo as a skill in Muse (`~/workspace/skills/one-click-game-builder/`)
2. Say in chat: "build me a XX game with one-click builder"
3. Pipeline: pick template (2D/3D) → AI generates by chapters → gates → live URL

## License

MIT
