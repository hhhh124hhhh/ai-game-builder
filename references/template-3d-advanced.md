# 3D 进阶模板（Backrooms 级：世界生成 + FPS 控制器 + 性能）

来源：逆向 Backrooms: Stay Alive（`src/` 分层架构）。简单 3D 游戏用 `template-3d.md` 即可；带探索/多人/大世界的 3D 游戏用本文件。

## 目录结构

```
src/
  core/    engine.js（渲染/灯光/相机） constants.js defaults.js gameConfig.js
           LoadingManager.js performance.js memoryManager.js
  game/    SimpleWorld.js（世界） PlayerController.js（控制） AvatarManager.js（角色）
  ui/      选角/排行榜/音频/调试面板
  config/  avatarConfig.js（角色 URL 列表 + 动画映射）
  multiplayer/  （多人时才有，v1 可省）
```

## 世界生成（SimpleWorld 模式）

1. **种子 PRNG（mulberry32）**：同一份种子 → 所有客户端生成相同世界。**双流**：主 RNG 管地形，`seed ^ 0x9e3779b9` 的第二流管生物/道具生成，互不干扰顺序。
2. **迷宫**：递归回溯（recursive backtracker）+ 额外打通 18% 的墙（读起来像房间/走廊，不是完美迷宫）。
3. **墙体用 InstancedMesh**：按朝向分两个 InstancedMesh（X 向 / Z 向），一次绘制调用一类；外围 4 面墙单独建。`uv2` 必须补（AO 贴图需要）。
4. **碰撞**：墙 = AABB 段列表；玩家 = 圆（半径 0.45）；圆心 vs AABB 最近点检测。只判玩家附近的段。
5. **导航 API（给生物 AI 用）**：`cellCenter / worldToCell / isPassageOpen / openNeighbors / randomCell / seededRandomCell`。
6. **灯光**：稀疏点光（每 5–6 格一个，移动端更稀），不投阴影；自发光天花板承托氛围。25% 的灯闪烁（Math.random 即可，纯装饰不影响碰撞）。
7. **Dispose**：几何/材质 dispose + scene.remove，写进 `dispose()`。

## FPS / 第三人称控制器（PlayerController 模式）

1. **胶囊物理**：位置 = 脚底；重力、跳跃速度、地面容差 0.01；相机在身高 85% 处。
2. **轴分离滑墙**：先试完整移动 → 碰撞则分别试 X-only / Z-only → 哪个轴通走哪个。
3. **相机防穿墙**：沿视线反方向分 6 步探点，碰到墙就把相机拉近到最近墙前。
4. **冲刺/耐力**：Shift 冲刺耗耐力；耗尽锁定，恢复到最低阈值才解锁；停止后延迟 0.6s 才回耐力。
5. **输入健壮性**：窗口失焦重置全部按键（防卡键）；聊天输入时屏蔽游戏输入；捏合缩放要排除摇杆区和按钮区。
6. **调试飞相机**：调试模式下 WASD + 空格/Shift 升降，自由飞。

## 动画（AvatarManager / 控制器模式）

1. **去根运动**：动画 Hips 位置轨道的 X/Z 置零，保留 Y。
2. **状态机优先级**：死亡 > 交互 > 跳/下落 > 奔跑 > 待机。
3. **过渡**：淡入淡出 0.2s；Jump/Death 单次播放 + 最后一帧定格。
4. **Fallback 链**：run→walk→idle；关键动画（idle/run/jump）缺失要报警。
5. **影子化身**：本地玩家用真实角色模型当影子投射体（人形阴影），模型加载失败时 fallback 胶囊。

## 贴图规范（PBR）

- 每表面一套：diffuse（sRGB）+ normal + ORM（G=粗糙度 B=金属度）+ AO + emissive（sRGB）
- 数据贴图（normal/ORM/AO）用 NoColorSpace；颜色贴图用 SRGBColorSpace
- RepeatWrapping + 最大各向异性；UV repeat 按世界尺寸算
- `roughnessMap` 和 `metalnessMap` 同指 ORM 贴图；`roughness: 1.0, metalness: 0.0` 让贴图说了算

## 性能（PerformanceManager 模式）

- **DPR 按平台固定**（移动 1.0 / 桌面 1.3），不做动态 DPR（实测验证过动态调 DPR 得不偿失）
- 帧时间环形缓冲（60 采样），debug 模式才打印统计
- 渲染循环复用临时对象（Vector3/Quaternion/Matrix4 模块级单例），不每帧 new
- Frustum culling 开着；变换后重算 boundingBox/Sphere

## 配置集中（constants.js 模式）

- `PLAYER`（速度/身高/半径/跳/重力/灵敏度/冲刺耐力）、`WORLD`、`MAP_SEED`、`SPAWN` 全放 constants.js
- 多人共享世界靠常量种子，不靠服务器下发地图
