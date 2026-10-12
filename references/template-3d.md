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
