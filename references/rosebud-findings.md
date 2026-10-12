# Rosebud AI 逆向发现（方法论沉淀，2026-10-12）

只记录可复用的模式，不含任何 Rosebud 代码、prompt 原文或私有接口细节。
完整报告在 `~/workspace/rea-station/jobs/20261012-rosebud/`（不公开）。

## 管线架构

- 前端 Next.js SPA，后端 REST：`chats`（构建任务）→ `send_message`（发需求）→ `status` 轮询 → `commits`（版本历史）→ `files`（批量写文件）→ `revisions`（预览）→ `published-projects`（发布/remix）
- 每次 AI 迭代 = 一个 commit，可查看可删 —— 版本化迭代循环是灵魂，不是一次生成
- 模型路由：别名表 `<版本>-agentic → <规范名>`，-agentic 是多步调工具的一等模式；带 fallback 链（高阶不可用自动降级）；版本号只做别名，换底层模型不改前端
- 资产生成是异步 job + 报价，重的不走同步
- 游戏预留运行时 AI 插槽（NPC 对话类调用）
- 冷启动用 visuals-first：先选游戏类型 → 拿主题配置 → 再生成，不让用户对空输入框发呆
- 匿名试用 + 一键 remix 是增长飞轮

## 脚手架模式

- 交付 = `index.html` 壳 + 游戏代码 + `assets/`，零构建步骤
- 2D 休闲：单文件 `main.js`（~865 行），11 章节固定顺序（配置→调色板→资源→音频→状态→布局→逻辑→粒子→绘制→主循环→输入），原生 Canvas，函数式
- 3D：多文件 ES modules，`class Game` 编排器 + Manager 类（Player/Enemy/Powerup/Input），Three.js 版本 pin 死走 CDN
- **模板按游戏类型分叉**：选类型 = 选脚手架，一套模板打不下天下
- Juice（粒子/震屏/连击/浮字）是强制章节，不是可选项
- 平台插桩（里程碑上报、生命周期 postMessage）用可选链注入，游戏离了平台也能跑
- 移动端数值：宽屏居中 520px 列、DPR 上限 2、滑动阈值 28px
- 托管：按游戏实例隔离的 serverless（Cloud Run 形态）

## 拿不到的结构性边界

服务端 prompt 模板、模型编排、多轮迭代状态机都在服务端，前端逆向够不着。
本 skill 的"按章节填空"即是对此的替代方案：用模板结构约束代替 prompt 原文。
