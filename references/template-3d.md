# 3D 模板规范（多文件 ES modules）

适用：跑酷/收集/轻度战斗类 3D 简单场景。Three.js，复杂度超过"一个主玩法 + 两三种实体"就别用这套。

## 文件划分（单文件单类，不许把两个 Manager 塞一个文件）

- `main.js` — `class Game` 编排器（唯一入口）
- `Player.js` — `export class Player`（玩家/主角实体）
- `EnemyManager.js` — `export class EnemyManager`（敌人生成/AI/战斗）
- `PowerupManager.js` — `export class PowerupManager`（道具/增益门/收集物）
- `InputController.js` — `export class InputController`（滑动/按键统一输入）
- 按需增减（如 `ObstacleManager.js`），上限 6 文件

## importmap（写死，不许浮动版本）

```json
{
  "imports": {
    "three": "https://esm.sh/three@0.160.0",
    "three/": "https://esm.sh/three@0.160.0/"
  }
}
```

`import * as THREE from 'three'`，addons 走 `three/addons/...`。已发布游戏不受上游更新影响。

## Game 类章节顺序

1. `constructor()` — 只建空壳，不初始化重资源
2. `setupRenderer()` / `setupScene()` / `setupCamera()` / `setupLights()` — 渲染管线四件套
3. `createRunway()`（或 `createArena()`）— 关卡地形/跑道
4. `async init()` — 异步资源加载完成后进游戏
5. 主循环 `animate()` — `requestAnimationFrame` 自递归，`deltaTime` 驱动逻辑
6. 玩法方法：`handleSpawning` / `checkCollisions` / `startBattle` / `updateBattle` / `gameOver(won)` / `restart()` / `onResize()`
7. UI 更新 `updateUI()` — DOM 覆盖层（计数/提示），不混进 3D 场景

## Manager 类契约

每个 Manager：`constructor(scene)` 拿场景引用；`update(deltaTime)` 每帧调；`reset()` 重开时调。
Manager 之间不直接引用，通信经 Game 中转（checkCollisions 里统一处理）。

## 输入

InputController 统一 touch 滑动 + 鼠标拖拽 + 键盘，阈值 28px，对外只暴露方向/动作语义（如 `moveLeft/moveRight`），不暴露原始坐标。

## Juice（3D 版）

粒子用 THREE.Points 或简单 Mesh 爆发；受击/合并时相机轻微震动（改 camera 偏移量，带衰减）；
收集/升级飘字用 DOM 覆盖层或 Sprite。至少 3 种。

## 与 2D 模板的共用规范

移动端数值（520px 列/DPR≤2）、音频解锁与静默失败、localStorage 最高分、平台插桩可选链——照 2D 模板执行。

## 质量红线（2026-10-13 审计 Army Rush 3D 后补入）

1. **零死代码**：加载的 GLB/资产必须被使用；每个方法必须被调用；未使用的 import 删除。
2. **胜利条件必填**：胜利/通关条件必须写进需求，结算不许只有失败分支。
3. **难度曲线必填**：速度/敌人强度/生成频率至少一维随时间递增。
4. **战斗必须有悬念**：不许 1 换 1 纯消耗定胜负（至少引入伤害/攻速/克制其一）。
5. **数值自检**：开局数值必须能活过第一个敌人（最小收益路径 vs 最大敌人强度）。
6. **注释必须与代码一致**，写错注释不如不写。
