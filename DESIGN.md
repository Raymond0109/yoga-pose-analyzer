# 瑜伽体式分析与矫正可视化软件 — 完整实现方案

> 版本: v1.0 | 日期: 2026-07-10 | 状态: 设计阶段

---

## 1. 项目目录结构

```
yoga_pose_mimo_code/
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts                    # Vite 主配置
├── vite.config.main.ts               # Electron main 进程配置
├── electron-builder.json5            # Electron 打包配置
├── index.html                        # 入口 HTML
├── DESIGN.md                         # 本文档
├── AGENTS.md
│
├── electron/                         # Electron 主进程
│   ├── main.ts                       # 主进程入口
│   ├── preload.ts                    # 预加载脚本 (IPC 桥接)
│   └── ipc-handlers.ts              # IPC 事件处理 (文件对话框、摄像头)
│
├── src/                              # 渲染进程 (React 应用)
│   ├── main.tsx                      # React 入口
│   ├── App.tsx                       # 根组件
│   ├── App.css                       # 全局样式
│   │
│   ├── components/                   # UI 组件
│   │   ├── Layout/                   # 布局组件
│   │   │   ├── MainLayout.tsx        # 主布局 (双视图 + 控制面板)
│   │   │   └── Header.tsx            # 顶部栏
│   │   ├── InputSource/              # 输入源管理
│   │   │   ├── InputSourcePanel.tsx  # 输入源选择面板
│   │   │   ├── VideoPlayer.tsx       # 视频/图片播放器
│   │   │   └── CameraCapture.tsx     # 摄像头实时捕获
│   │   ├── PoseEstimation/           # 姿态估计
│   │   │   ├── PoseOverlay.tsx       # 2D 关键点叠加层
│   │   │   └── PoseLandmarks.tsx     # 关键点可视化
│   │   ├── Model3D/                  # 3D 模型渲染
│   │   │   ├── SMPLViewer.tsx        # SMPL 3D 视图主组件
│   │   │   ├── SkeletonOverlay.tsx   # 骨骼线框叠加
│   │   │   └── MuscleHeatmap.tsx     # 肌肉热力图渲染
│   │   ├── Comparison/               # 体式对比
│   │   │   ├── ComparisonPanel.tsx   # 对比结果面板
│   │   │   ├── AngleDisplay.tsx      # 关节角度显示
│   │   │   └── CorrectionTips.tsx    # 矫正建议卡片
│   │   └── Controls/                 # 控制面板
│   │       ├── ControlPanel.tsx      # 主控制面板
│   │       ├── PoseSelector.tsx      # 体式选择器
│   │       └── SettingsPanel.tsx     # 设置面板
│   │
│   ├── core/                         # 核心业务逻辑
│   │   ├── pose/                     # 姿态估计模块
│   │   │   ├── MediaPipePose.ts      # MediaPipe Pose 封装
│   │   │   ├── LandmarkSmoother.ts   # 关键点平滑滤波器
│   │   │   ├── PoseClassifier.ts     # 姿态分类器
│   │   │   └── AngleCalculator.ts    # 关节角度计算
│   │   ├── smpl/                     # SMPL 模型模块
│   │   │   ├── SMPLModel.ts          # SMPL 模型加载与管理
│   │   │   ├── ParamRegressor.ts     # MediaPipe → SMPL 参数回归
│   │   │   ├── SMPLRenderer.ts       # Three.js SMPL 渲染器
│   │   │   ├── MuscleMapper.ts       # 肌肉紧张度映射
│   │   │   └── SMPLConstants.ts      # SMPL 关节映射表等常量
│   │   ├── comparison/               # 体式对比模块
│   │   │   ├── StandardPoseDB.ts     # 标准体式数据库
│   │   │   ├── PoseComparator.ts     # 姿态差异计算引擎
│   │   │   └── CorrectionEngine.ts   # 矫正建议生成器
│   │   └── input/                    # 输入源管理
│   │       ├── InputManager.ts       # 统一输入管理器
│   │       ├── FileInput.ts          # 文件输入处理
│   │       └── CameraInput.ts        # 摄像头输入处理
│   │
│   ├── hooks/                        # React Hooks
│   │   ├── usePoseEstimation.ts      # 姿态估计 Hook
│   │   ├── useSMPLModel.ts           # SMPL 模型 Hook
│   │   ├── useInputSource.ts         # 输入源 Hook
│   │   └── useAnimationFrame.ts      # 动画帧 Hook
│   │
│   ├── store/                        # 状态管理
│   │   ├── appStore.ts               # Zustand 全局状态
│   │   ├── poseStore.ts              # 姿态数据状态
│   │   └── settingsStore.ts          # 设置状态
│   │
│   ├── types/                        # TypeScript 类型
│   │   ├── pose.ts                   # 姿态相关类型
│   │   ├── smpl.ts                   # SMPL 相关类型
│   │   └── common.ts                 # 通用类型
│   │
│   ├── utils/                        # 工具函数
│   │   ├── math.ts                   # 数学工具 (向量、矩阵、四元数)
│   │   ├── smoothing.ts              # 平滑算法 (EMA, Kalman)
│   │   └── constants.ts              # 全局常量
│   │
│   └── styles/                       # 样式
│       ├── theme.ts                  # 主题配置
│       └── global.css                # 全局样式
│
├── assets/                           # 静态资源
│   ├── models/                       # SMPL 模型文件
│   │   ├── smpl/                     # SMPL 基础模型
│   │   │   ├── SMPL_NEUTRAL.json     # 中性模型参数 (转换后)
│   │   │   └── SMPL_MALE.json
│   │   └── smplx/                    # SMPL-X 模型 (可选)
│   │       └── SMPLX_NEUTRAL.json
│   ├── poses/                        # 标准体式数据
│   │   ├── tadasana.json             # 山式
│   │   ├── virabhadrasana_ii.json    # 战士二式
│   │   ├── trikonasana.json          # 三角式
│   │   ├── adho_mukha_svanasana.json # 下犬式
│   │   ├── vrksasana.json            # 树式
│   │   ├── utkatasana.json           # 幻椅式
│   │   ├── balasana.json             # 婴儿式
│   │   ├── bhujangasana.json         # 眼镜蛇式
│   │   ├── navasana.json             # 船式
│   │   └── savasana.json             # 挺尸式
│   └── textures/                     # 纹理资源
│       ├── body_diffuse.png          # 身体贴图
│       └── muscle_overlay.png        # 肌肉叠加贴图
│
├── scripts/                          # 构建/转换脚本
│   ├── convert_smpl_to_json.py       # SMPL pkl → JSON 转换
│   ├── generate_standard_poses.py    # 生成标准体式数据
│   └── build.ts                      # 构建脚本
│
└── tests/                            # 测试
    ├── unit/                         # 单元测试
    │   ├── AngleCalculator.test.ts
    │   ├── LandmarkSmoother.test.ts
    │   └── PoseComparator.test.ts
    └── e2e/                          # 端到端测试
        └── app.spec.ts
```

---

## 2. 技术架构

### 2.1 整体架构图 (文本描述)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Electron 应用                                │
├─────────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────┐    ┌──────────────────────────────────┐  │
│  │   Main Process        │    │   Renderer Process (React)       │  │
│  │   (Node.js)           │    │                                  │  │
│  │                       │    │  ┌─────────────────────────────┐ │  │
│  │  • 文件系统访问        │    │  │      UI Layer (React)       │ │  │
│  │  • 摄像头设备管理      │    │  │                             │ │  │
│  │  • 原生对话框          │◄──►│  │  MainLayout                 │ │  │
│  │  • 窗口管理            │IPC │  │  ├─ VideoView (左侧)        │ │  │
│  │                       │    │  │  ├─ 3DView (右侧)           │ │  │
│  │                       │    │  │  ├─ ControlPanel (底部左)    │ │  │
│  │                       │    │  │  └─ CorrectionPanel (底部右) │ │  │
│  └───────────────────────┘    │  └─────────────┬───────────────┘ │  │
│                               │                │                  │  │
│                               │  ┌─────────────▼───────────────┐ │  │
│                               │  │    Core Logic Layer          │ │  │
│                               │  │                             │ │  │
│                               │  │  ┌──────────┐ ┌──────────┐ │ │  │
│                               │  │  │ InputMgr │ │ PoseEst  │ │ │  │
│                               │  │  └────┬─────┘ └────┬─────┘ │ │  │
│                               │  │       │            │        │ │  │
│                               │  │  ┌────▼────────────▼─────┐ │ │  │
│                               │  │  │  ParamRegressor       │ │ │  │
│                               │  │  │  (MP → SMPL params)   │ │ │  │
│                               │  │  └────────────┬──────────┘ │ │  │
│                               │  │               │            │ │  │
│                               │  │  ┌────────────▼──────────┐ │ │  │
│                               │  │  │  SMPLRenderer         │ │ │  │
│                               │  │  │  (Three.js)           │ │ │  │
│                               │  │  └────────────┬──────────┘ │ │  │
│                               │  │               │            │ │  │
│                               │  │  ┌────────────▼──────────┐ │ │  │
│                               │  │  │  PoseComparator       │ │ │  │
│                               │  │  │  + CorrectionEngine   │ │ │  │
│                               │  │  └───────────────────────┘ │ │  │
│                               │  └─────────────────────────────┘ │  │
│                               └──────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  External Dependencies                                       │   │
│  │                                                              │   │
│  │  @mediapipe/tasks-vision ──► Pose Landmarker (WASM)         │   │
│  │  three + @react-three/fiber ──► 3D 渲染                     │   │
│  │  zustand ──► 状态管理                                        │   │
│  │  smpl ──► SMPL 模型数据 (JSON)                               │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 数据流

```
摄像头/视频/图片
      │
      ▼
┌─────────────┐     ┌──────────────┐     ┌───────────────┐
│ InputManager│────►│ MediaPipe    │────►│ Landmark      │
│ (统一入口)   │     │ Pose (WASM)  │     │ Smoother      │
└─────────────┘     └──────────────┘     └───────┬───────┘
                                                  │
                          ┌───────────────────────┤
                          │                       │
                          ▼                       ▼
                  ┌───────────────┐      ┌────────────────┐
                  │ AngleCalc     │      │ ParamRegressor  │
                  │ (关节角度)     │      │ (MP→SMPL参数)   │
                  └───────┬───────┘      └────────┬───────┘
                          │                       │
                          ▼                       ▼
                  ┌───────────────┐      ┌────────────────┐
                  │ PoseComparator│      │ SMPLRenderer    │
                  │ (差异计算)     │      │ (Three.js 3D)   │
                  └───────┬───────┘      └────────┬───────┘
                          │                       │
                          ▼                       ▼
                  ┌───────────────┐      ┌────────────────┐
                  │ Correction    │      │ MuscleMapper    │
                  │ Engine        │      │ (肌肉热力图)    │
                  └───────────────┘      └────────────────┘
```

### 2.3 进程通信架构

```
Main Process (Node.js)              Renderer Process (React + WASM)
─────────────────────               ──────────────────────────────
                                    
文件对话框 ◄──── IPC.invoke ────►  文件选择按钮
摄像头列表 ◄──── IPC.invoke ────►  摄像头下拉菜单
摄像头流   ◄──── IPC.send    ────►  视频预览
窗口事件   ◄──── IPC.on      ────►  响应式布局
```

---

## 3. 各模块详细设计

### 3.1 模块 1：输入源管理 (`core/input/`)

#### 3.1.1 InputManager — 统一输入管理器

```typescript
// types/common.ts
export type InputSourceType = 'camera' | 'video' | 'image';

export interface InputFrame {
  imageData: ImageData | HTMLVideoElement | HTMLImageElement;
  width: number;
  height: number;
  timestamp: number;
}

export interface InputSourceConfig {
  type: InputSourceType;
  cameraId?: string;        // 摄像头设备 ID
  filePath?: string;        // 文件路径
  resolution?: { width: number; height: number };
}
```

**职责**：
- 统一管理三种输入源的生命周期
- 提供 `start()` / `stop()` / `pause()` / `getFrame()` 接口
- 自动检测输入源类型并委托给对应处理器

**关键实现**：

```typescript
// core/input/InputManager.ts
export class InputManager {
  private source: FileInput | CameraInput | null = null;
  private frameCallbacks: Set<(frame: InputFrame) => void> = new Set();

  async switchSource(config: InputSourceConfig): Promise<void> {
    await this.stop();
    switch (config.type) {
      case 'camera':
        this.source = new CameraInput(config);
        break;
      case 'video':
      case 'image':
        this.source = new FileInput(config);
        break;
    }
    await this.source.initialize();
  }

  onFrame(callback: (frame: InputFrame) => void): () => void {
    this.frameCallbacks.add(callback);
    return () => this.frameCallbacks.delete(callback);
  }
}
```

#### 3.1.2 CameraInput

- 通过 Electron IPC 调用主进程获取摄像头列表
- 使用 `navigator.mediaDevices.getUserMedia()` 获取视频流
- 支持分辨率配置 (640x480, 1280x720)
- 请求/释放摄像头权限

#### 3.1.3 FileInput

- 通过 Electron `dialog.showOpenDialog()` 选择文件
- 支持格式：MP4, WebM, MOV, JPG, PNG
- 视频文件：逐帧提取，支持播放控制 (播放/暂停/进度拖拽)
- 图片文件：单帧处理

#### 3.1.4 Electron IPC 设计

```typescript
// electron/ipc-handlers.ts
import { ipcMain, dialog } from 'electron';

// 文件选择对话框
ipcMain.handle('dialog:openFile', async (_, options) => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: '媒体文件', extensions: ['mp4', 'webm', 'mov', 'jpg', 'jpeg', 'png'] },
    ],
  });
  return result;
});

// 获取摄像头设备列表
ipcMain.handle('camera:listDevices', async () => {
  // 在渲染进程中通过 webContents 调用
  return []; // 实际实现在 preload 中
});
```

```typescript
// electron/preload.ts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: (options: any) => ipcRenderer.invoke('dialog:openFile', options),
  listCameras: () => ipcRenderer.invoke('camera:listDevices'),
  onCameraFrame: (callback: Function) => {
    ipcRenderer.on('camera:frame', (_, data) => callback(data));
  },
});
```

---

### 3.2 模块 2：MediaPipe 姿态估计 (`core/pose/`)

#### 3.2.1 MediaPipePose — 姿态估计封装

```typescript
// types/pose.ts
export interface PoseLandmark {
  x: number;  // 归一化坐标 [0, 1]
  y: number;
  z: number;  // 深度 (相对髋部)
  visibility: number;
}

export interface PoseResult {
  landmarks: PoseLandmark[];       // 33 个关键点
  worldLandmarks: PoseLandmark[];  // 世界坐标系下的关键点
  timestamp: number;
}
```

**MediaPipe Pose 33 关键点映射**：

| 索引 | 名称 | 用途 |
|------|------|------|
| 0 | nose | 头部参考 |
| 11 | left_shoulder | 左肩 |
| 12 | right_shoulder | 右肩 |
| 13 | left_elbow | 左肘 |
| 14 | right_elbow | 右肘 |
| 15 | left_wrist | 左腕 |
| 16 | right_wrist | 右腕 |
| 23 | left_hip | 左髋 |
| 24 | right_hip | 右髋 |
| 25 | left_knee | 左膝 |
| 26 | right_knee | 右膝 |
| 27 | left_ankle | 左踝 |
| 28 | right_ankle | 右踝 |
| 29-32 | foot | 脚部关键点 |

**实现要点**：

```typescript
// core/pose/MediaPipePose.ts
import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

export class MediaPipePose {
  private landmarker: PoseLandmarker | null = null;
  private smoother: LandmarkSmoother;

  async initialize(modelPath: string): Promise<void> {
    const vision = await FilesetResolver.forVisionTasks(modelPath);
    this.landmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: `${modelPath}/pose_landmarker_full.task`,
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numPoses: 1,
      minPoseDetectionConfidence: 0.5,
      minPosePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    this.smoother = new LandmarkSmoother({
      smoothingFactor: 0.5,
      velocitySmoothing: 0.3,
    });
  }

  estimate(frame: InputFrame): PoseResult | null {
    if (!this.landmarker) return null;

    const result = this.landmarker.detectForVideo(
      frame.imageData,
      frame.timestamp
    );

    if (result.landmarks.length === 0) return null;

    const raw = result.landmarks[0]; // 取第一个检测到的姿态
    const smoothed = this.smoother.smooth(raw, frame.timestamp);

    return {
      landmarks: smoothed,
      worldLandmarks: result.worldLandmarks[0],
      timestamp: frame.timestamp,
    };
  }
}
```

#### 3.2.2 LandmarkSmoother — 关键点平滑

**方案：指数移动平均 (EMA) + 速度自适应**

```typescript
// core/pose/LandmarkSmoother.ts
export class LandmarkSmoother {
  private prevLandmarks: PoseLandmark[] | null = null;
  private velocity: PoseLandmark[] | null = null;

  constructor(private config: {
    smoothingFactor: number;  // 0-1, 越大越平滑
    velocitySmoothing: number;
  }) {}

  smooth(landmarks: PoseLandmark[], timestamp: number): PoseLandmark[] {
    if (!this.prevLandmarks) {
      this.prevLandmarks = landmarks;
      this.velocity = landmarks.map(() => ({ x: 0, y: 0, z: 0, visibility: 1 }));
      return landmarks;
    }

    return landmarks.map((lm, i) => {
      const prev = this.prevLandmarks![i];
      const vel = this.velocity![i];

      // 速度估计
      const newVel = {
        x: this.config.velocitySmoothing * (lm.x - prev.x) +
           (1 - this.config.velocitySmoothing) * vel.x,
        y: this.config.velocitySmoothing * (lm.y - prev.y) +
           (1 - this.config.velocitySmoothing) * vel.y,
        z: this.config.velocitySmoothing * (lm.z - prev.z) +
           (1 - this.config.velocitySmoothing) * vel.z,
        visibility: lm.visibility,
      };

      // 自适应平滑 — 快速运动时降低平滑度
      const speed = Math.sqrt(newVel.x ** 2 + newVel.y ** 2);
      const adaptiveFactor = Math.max(0.2, this.config.smoothingFactor - speed * 2);

      this.velocity![i] = newVel;
      this.prevLandmarks![i] = {
        x: prev.x * adaptiveFactor + lm.x * (1 - adaptiveFactor),
        y: prev.y * adaptiveFactor + lm.y * (1 - adaptiveFactor),
        z: prev.z * adaptiveFactor + lm.z * (1 - adaptiveFactor),
        visibility: lm.visibility,
      };

      return this.prevLandmarks![i];
    });
  }
}
```

#### 3.2.3 AngleCalculator — 关节角度计算

```typescript
// core/pose/AngleCalculator.ts
export interface JointAngle {
  joint: string;        // 关节名称
  angle: number;        // 角度 (度)
  axis: 'flexion' | 'abduction' | 'rotation';
}

export class AngleCalculator {
  // 计算三点构成的角度
  static angleBetweenThreePoints(
    a: PoseLandmark,
    b: PoseLandmark,  // 顶点
    c: PoseLandmark
  ): number {
    const ba = { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
    const bc = { x: c.x - b.x, y: c.y - b.y, z: c.z - b.z };
    const dot = ba.x * bc.x + ba.y * bc.y + ba.z * bc.z;
    const magBA = Math.sqrt(ba.x ** 2 + ba.y ** 2 + ba.z ** 2);
    const magBC = Math.sqrt(bc.x ** 2 + bc.y ** 2 + bc.z ** 2);
    return Math.acos(dot / (magBA * magBC)) * (180 / Math.PI);
  }

  // 计算所有关键关节角度
  static calculateAllAngles(landmarks: PoseLandmark[]): JointAngle[] {
    return [
      // 左肘弯曲角
      {
        joint: 'left_elbow',
        angle: this.angleBetweenThreePoints(
          landmarks[11], landmarks[13], landmarks[15]
        ),
        axis: 'flexion',
      },
      // 右肘弯曲角
      {
        joint: 'right_elbow',
        angle: this.angleBetweenThreePoints(
          landmarks[12], landmarks[14], landmarks[16]
        ),
        axis: 'flexion',
      },
      // 左膝弯曲角
      {
        joint: 'left_knee',
        angle: this.angleBetweenThreePoints(
          landmarks[23], landmarks[25], landmarks[27]
        ),
        axis: 'flexion',
      },
      // 右膝弯曲角
      {
        joint: 'right_knee',
        angle: this.angleBetweenThreePoints(
          landmarks[24], landmarks[26], landmarks[28]
        ),
        axis: 'flexion',
      },
      // 左髋弯曲角
      {
        joint: 'left_hip',
        angle: this.angleBetweenThreePoints(
          landmarks[11], landmarks[23], landmarks[25]
        ),
        axis: 'flexion',
      },
      // 右髋弯曲角
      {
        joint: 'right_hip',
        angle: this.angleBetweenThreePoints(
          landmarks[12], landmarks[24], landmarks[26]
        ),
        axis: 'flexion',
      },
      // 肩部外展角 (左)
      {
        joint: 'left_shoulder',
        angle: this.angleBetweenThreePoints(
          landmarks[23], landmarks[11], landmarks[13]
        ),
        axis: 'abduction',
      },
      // 肩部外展角 (右)
      {
        joint: 'right_shoulder',
        angle: this.angleBetweenThreePoints(
          landmarks[24], landmarks[12], landmarks[14]
        ),
        axis: 'abduction',
      },
    ];
  }
}
```

#### 3.2.4 PoseClassifier — 姿态分类器

```typescript
// core/pose/PoseClassifier.ts
export class PoseClassifier {
  // 基于关节角度的规则分类
  classify(angles: JointAngle[]): string | null {
    const angleMap = new Map(angles.map(a => [a.joint, a.angle]));

    // 山式：站立，双腿伸直，双臂自然下垂
    if (this.isStanding(angleMap) && this.areLegsStraight(angleMap)) {
      return 'tadasana';
    }

    // 战士二式：双腿分开，前膝弯曲90度，双臂平举
    if (this.isWarriorII(angleMap)) {
      return 'virabhadrasana_ii';
    }

    // 下犬式：倒V形，手臂和腿伸直
    if (this.isDownwardDog(angleMap)) {
      return 'adho_mukha_svanasana';
    }

    // ... 其他体式

    return null; // 无法识别
  }

  private isStanding(angles: Map<string, number>): boolean {
    // 检查身体是否大致垂直
    return true; // 简化实现
  }

  private areLegsStraight(angles: Map<string, number>): boolean {
    const leftKnee = angles.get('left_knee') ?? 0;
    const rightKnee = angles.get('right_knee') ?? 0;
    return leftKnee > 160 && rightKnee > 160;
  }
}
```

---

### 3.3 模块 3：SMPL 模型渲染 (`core/smpl/`)

#### 3.3.1 SMPL 模型概述

SMPL (Skinned Multi-Person Linear Model) 是参数化人体模型：
- **形状参数 β** (10维)：控制体型高矮胖瘦
- **姿态参数 θ** (72维 = 24关节 × 3)：控制各关节旋转
- **输出**：6890 个顶点的 3D 网格 + 24 个骨骼关节

SMPL-X 扩展版：
- N = 10,475 顶点，K = 54 关节
- 增加面部表情和手指关节

#### 3.3.2 ParamRegressor — MediaPipe → SMPL 参数回归

这是本项目最关键的模块之一。MediaPipe 输出 33 个 2D/3D 关键点，需要回归到 SMPL 的 72 维姿态参数。

**回归策略**：

```
MediaPipe 33 landmarks (3D)
        │
        ▼
┌─────────────────────────────┐
│  1. 骨骼长度归一化           │  消除个体身高差异
│  2. 关键点重映射             │  MP 33点 → SMPL 24关节
│  3. 关节旋转求解             │  从骨骼方向反算旋转角
│  4. IK 约束优化             │  确保关节角度在合理范围内
└─────────────────────────────┘
        │
        ▼
SMPL Pose Parameters θ (72维)
```

```typescript
// core/smpl/ParamRegressor.ts
import * as THREE from 'three';

// MediaPipe → SMPL 关节映射
const MP_TO_SMPL_JOINTS: Record<number, number> = {
  0: 15,   // nose → head
  11: 13,  // left_shoulder → leftArm
  12: 14,  // right_shoulder → rightArm
  13: 16,  // left_elbow → leftForeArm
  14: 17,  // right_elbow → rightForeArm
  15: 18,  // left_wrist → leftHand
  16: 19,  // right_wrist → rightHand
  23: 1,   // left_hip → leftUpLeg
  24: 2,   // right_hip → rightUpLeg
  25: 4,   // left_knee → leftLeg
  26: 5,   // right_knee → rightLeg
  27: 7,   // left_ankle → leftFoot
  28: 8,   // right_ankle → rightFoot
};

export class ParamRegressor {
  // 从 MediaPipe landmarks 回归 SMPL 姿态参数
  regress(worldLandmarks: PoseLandmark[]): {
    pose: Float32Array;   // θ: 72 维
    shape: Float32Array;  // β: 10 维 (使用默认体型)
  } {
    // 1. 归一化骨骼长度
    const normalized = this.normalizeLandmarks(worldLandmarks);

    // 2. 计算各关节的局部旋转 (相对于父关节)
    const jointRotations = this.computeJointRotations(normalized);

    // 3. 转换为 SMPL 轴角表示 (axis-angle)
    const pose = this.toAxisAngle(jointRotations);

    // 4. 默认形状参数
    const shape = new Float32Array(10); // 零向量 = 平均体型

    return { pose, shape };
  }

  private normalizeLandmarks(landmarks: PoseLandmark[]): THREE.Vector3[] {
    // 使用髋部宽度作为参考长度进行归一化
    const leftHip = new THREE.Vector3(landmarks[23].x, landmarks[23].y, landmarks[23].z);
    const rightHip = new THREE.Vector3(landmarks[24].x, landmarks[24].y, landmarks[24].z);
    const hipWidth = leftHip.distanceTo(rightHip);

    return landmarks.map(lm => {
      const v = new THREE.Vector3(lm.x, lm.y, lm.z);
      // 以髋部中心为原点，髋部宽度为单位
      return v.sub(leftHip.clone().add(rightHip).multiplyScalar(0.5))
              .divideScalar(hipWidth);
    });
  }

  private computeJointRotations(landmarks: THREE.Vector3[]): THREE.Quaternion[] {
    const rotations: THREE.Quaternion[] = [];

    // SMPL 骨骼层级
    const bonePairs: [number, number][] = [
      [0, 1],   // pelvis → left_hip
      [0, 2],   // pelvis → right_hip
      [1, 4],   // left_hip → left_knee
      [2, 5],   // right_hip → right_knee
      [4, 7],   // left_knee → left_ankle
      [5, 8],   // right_knee → right_ankle
      [0, 3],   // pelvis → spine
      [3, 6],   // spine → head
      [6, 12],  // head → neck
      [12, 9],  // neck → left_shoulder
      [12, 13], // neck → right_shoulder
      [9, 10],  // left_shoulder → left_elbow
      [13, 14], // right_shoulder → right_elbow
      [10, 11], // left_elbow → left_wrist
      [14, 15], // right_elbow → right_wrist
    ];

    for (const [parent, child] of bonePairs) {
      const parentPos = landmarks[MP_TO_SMPL_JOINTS[parent]] || new THREE.Vector3();
      const childPos = landmarks[MP_TO_SMPL_JOINTS[child]] || new THREE.Vector3();
      const boneDir = childPos.clone().sub(parentPos).normalize();

      // 计算从 T-pose 到当前姿态的旋转
      const restDir = this.getRestBoneDirection(parent, child);
      const rotation = new THREE.Quaternion().setFromUnitVectors(restDir, boneDir);
      rotations.push(rotation);
    }

    return rotations;
  }

  private toAxisAngle(rotations: THREE.Quaternion[]): Float32Array {
    const pose = new Float32Array(72); // 24 joints × 3

    rotations.forEach((quat, i) => {
      const axis = new THREE.Vector3();
      const angle = 0; // 从四元数提取轴角
      // THREE.Quaternion → axis-angle 转换
      const q = quat;
      const halfAngle = Math.acos(Math.min(1, q.w));
      const sinHalf = Math.sin(halfAngle);

      if (sinHalf > 0.001) {
        pose[i * 3] = (q.x / sinHalf) * 2 * halfAngle;
        pose[i * 3 + 1] = (q.y / sinHalf) * 2 * halfAngle;
        pose[i * 3 + 2] = (q.z / sinHalf) * 2 * halfAngle;
      }
    });

    return pose;
  }

  private getRestBoneDirection(parent: number, child: number): THREE.Vector3 {
    // T-pose 下各骨骼的默认方向
    // 实际应从 SMPL 模型的 rest pose 中读取
    return new THREE.Vector3(0, -1, 0); // 默认向下
  }
}
```

#### 3.3.3 SMPLRenderer — Three.js 渲染器

```typescript
// core/smpl/SMPLRenderer.ts
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class SMPLRenderer {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private bodyMesh: THREE.SkinnedMesh | null = null;
  private skeletonHelper: THREE.SkeletonHelper | null = null;
  private muscleOverlay: THREE.Mesh | null = null;

  constructor(container: HTMLElement) {
    // 初始化 Three.js 场景
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    this.camera.position.set(0, 1.2, 3);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 1, 0);

    // 光照
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(2, 5, 3);
    this.scene.add(dirLight);

    this.animate();
  }

  async loadSMPLModel(modelPath: string): Promise<void> {
    // 方案 A：加载预转换的 glTF 模型
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync(modelPath);

    this.bodyMesh = gltf.scene.children[0] as THREE.SkinnedMesh;
    this.scene.add(gltf.scene);

    // 添加骨骼可视化
    this.skeletonHelper = new THREE.SkeletonHelper(gltf.scene);
    this.scene.add(this.skeletonHelper);
  }

  updatePose(poseParams: Float32Array, shapeParams: Float32Array): void {
    if (!this.bodyMesh) return;

    const skeleton = this.bodyMesh.skeleton;
    const bones = skeleton.bones;

    // 将 SMPL 姿态参数应用到 Three.js 骨骼
    for (let i = 0; i < Math.min(bones.length, 24); i++) {
      const ax = poseParams[i * 3];
      const ay = poseParams[i * 3 + 1];
      const az = poseParams[i * 3 + 2];

      const angle = Math.sqrt(ax * ax + ay * ay + az * az);
      if (angle > 0.0001) {
        const axis = new THREE.Vector3(ax, ay, az).normalize();
        bones[i].quaternion.setFromAxisAngle(axis, angle);
      } else {
        bones[i].quaternion.identity();
      }
    }

    skeleton.update();
  }

  updateMuscleHeatmap(muscleData: Map<string, number>): void {
    // 根据肌肉紧张度更新顶点颜色
    if (!this.bodyMesh) return;

    const geometry = this.bodyMesh.geometry;
    const colors = new Float32Array(geometry.attributes.position.count * 3);

    // 肌肉紧张度 → 颜色映射
    // 松弛 (0.0) → 蓝色, 中等 (0.5) → 黄色, 紧张 (1.0) → 红色
    muscleData.forEach((tension, muscleGroup) => {
      const vertices = this.getMuscleVertices(muscleGroup);
      vertices.forEach(idx => {
        const color = new THREE.Color();
        color.setHSL(0.6 - tension * 0.6, 1, 0.5); // 蓝→红
        colors[idx * 3] = color.r;
        colors[idx * 3 + 1] = color.g;
        colors[idx * 3 + 2] = color.b;
      });
    });

    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    (this.bodyMesh.material as THREE.MeshStandardMaterial).vertexColors = true;
  }

  private getMuscleVertices(muscleGroup: string): number[] {
    // SMPL 顶点到肌肉群的映射
    // 这需要预定义的顶点分组数据
    return []; // 实际实现需要加载映射表
  }

  private animate = (): void => {
    requestAnimationFrame(this.animate);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  resize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  dispose(): void {
    this.renderer.dispose();
    this.controls.dispose();
  }
}
```

#### 3.3.4 SMPL 模型文件转换

SMPL 官方模型是 Python pickle 格式，需要转换为浏览器可用的 JSON 格式：

```python
# scripts/convert_smpl_to_json.py
import pickle
import json
import numpy as np

def convert_smpl_pkl_to_json(pkl_path, output_path):
    """将 SMPL pkl 模型转换为 JSON 格式供前端使用"""
    with open(pkl_path, 'rb') as f:
        data = pickle.load(f, encoding='latin1')

    output = {
        'vertices_template': np.array(data['v_template']).tolist(),
        'faces': np.array(data['f']).tolist(),
        'joint_regressor': np.array(data['J_regressor'].todense()).tolist(),
        'weights': np.array(data['weights']).tolist(),
        'posedirs': np.array(data['posedirs']).tolist(),
        'shapedirs': np.array(data['shapedirs']).tolist(),
        'kintree_table': np.array(data['kintree_table']).tolist(),
        'J': np.array(data['J']).tolist(),
        'num_vertices': 6890,
        'num_joints': 24,
    }

    with open(output_path, 'w') as f:
        json.dump(output, f)

    print(f"Converted {pkl_path} → {output_path}")
    print(f"  Vertices: {output['num_vertices']}")
    print(f"  Joints: {output['num_joints']}")
```

---

### 3.4 模块 4：标准体式对比 (`core/comparison/`)

#### 3.4.1 StandardPoseDB — 标准体式数据库

```typescript
// types/smpl.ts
export interface StandardPose {
  id: string;                    // 体式 ID
  nameCN: string;                // 中文名
  nameEN: string;                // 英文名
  nameSanskrit: string;          // 梵文名
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;              // 体式分类
  description: string;           // 描述
  benefits: string[];            // 功效
  targetAngles: JointAngle[];    // 标准关节角度
  tolerance: number;             // 容差范围 (度)
  keyPoints: {                   // 关键矫正点
    joint: string;
    idealAngle: number;
    description: string;
  }[];
  commonMistakes: string[];      // 常见错误
}

// 示例标准体式数据
export const STANDARD_POSES: StandardPose[] = [
  {
    id: 'tadasana',
    nameCN: '山式',
    nameEN: 'Mountain Pose',
    nameSanskrit: 'Tadasana',
    difficulty: 'beginner',
    category: '站立',
    description: '双脚并拢站立，身体挺直，双臂自然下垂',
    benefits: ['改善体态', '增强腿部力量', '提高平衡感'],
    targetAngles: [
      { joint: 'left_knee', angle: 180, axis: 'flexion' },
      { joint: 'right_knee', angle: 180, axis: 'flexion' },
      { joint: 'left_hip', angle: 180, axis: 'flexion' },
      { joint: 'right_hip', angle: 180, axis: 'flexion' },
      { joint: 'left_shoulder', angle: 10, axis: 'abduction' },
      { joint: 'right_shoulder', angle: 10, axis: 'abduction' },
    ],
    tolerance: 15,
    keyPoints: [
      { joint: 'left_knee', idealAngle: 180, description: '膝盖伸直，不要超伸' },
      { joint: 'right_knee', idealAngle: 180, description: '膝盖伸直，不要超伸' },
    ],
    commonMistakes: ['膝盖超伸', '骨盆前倾', '耸肩'],
  },
  // ... 其他 9 个体式
];
```

#### 3.4.2 PoseComparator — 姿态差异计算

```typescript
// core/comparison/PoseComparator.ts
export interface PoseDifference {
  joint: string;
  current: number;
  target: number;
  delta: number;       // 差异值 (度)
  severity: 'good' | 'warning' | 'bad';
  suggestion: string;
}

export interface ComparisonResult {
  poseId: string;
  overallScore: number;        // 0-100 总分
  differences: PoseDifference[];
  timestamp: number;
}

export class PoseComparator {
  compare(
    currentAngles: JointAngle[],
    standardPose: StandardPose
  ): ComparisonResult {
    const differences: PoseDifference[] = [];
    let totalScore = 0;

    for (const target of standardPose.targetAngles) {
      const current = currentAngles.find(a => a.joint === target.joint);
      if (!current) continue;

      const delta = Math.abs(current.angle - target.angle);
      const severity = this.getSeverity(delta, standardPose.tolerance);
      const suggestion = this.getSuggestion(target.joint, delta, current.angle, target.angle);

      differences.push({
        joint: target.joint,
        current: current.angle,
        target: target.angle,
        delta,
        severity,
        suggestion,
      });

      // 评分：delta 越小分越高
      totalScore += Math.max(0, 100 - delta * 2);
    }

    const overallScore = differences.length > 0
      ? Math.round(totalScore / differences.length)
      : 0;

    return {
      poseId: standardPose.id,
      overallScore,
      differences,
      timestamp: Date.now(),
    };
  }

  private getSeverity(delta: number, tolerance: number): 'good' | 'warning' | 'bad' {
    if (delta <= tolerance * 0.5) return 'good';
    if (delta <= tolerance) return 'warning';
    return 'bad';
  }

  private getSuggestion(
    joint: string,
    delta: number,
    current: number,
    target: number
  ): string {
    if (delta < 5) return '角度正确';

    const direction = current > target ? '减小' : '增大';
    const jointCN = this.getJointNameCN(joint);
    return `请${direction}${jointCN}角度，当前 ${Math.round(current)}°，目标 ${Math.round(target)}°`;
  }

  private getJointNameCN(joint: string): string {
    const map: Record<string, string> = {
      left_elbow: '左肘',
      right_elbow: '右肘',
      left_knee: '左膝',
      right_knee: '右膝',
      left_hip: '左髋',
      right_hip: '右髋',
      left_shoulder: '左肩',
      right_shoulder: '右肩',
    };
    return map[joint] || joint;
  }
}
```

#### 3.4.3 CorrectionEngine — 矫正建议生成器

```typescript
// core/comparison/CorrectionEngine.ts
export interface CorrectionAdvice {
  id: string;
  joint: string;
  priority: 'high' | 'medium' | 'low';
  title: string;         // 简短标题
  description: string;   // 详细说明
  action: string;        // 具体动作指导
  icon: string;          // 图标标识
}

export class CorrectionEngine {
  generateAdvice(result: ComparisonResult): CorrectionAdvice[] {
    const advices: CorrectionAdvice[] = [];

    // 按差异严重程度排序
    const sorted = [...result.differences].sort((a, b) => b.delta - a.delta);

    for (const diff of sorted) {
      if (diff.severity === 'good') continue;

      const priority = diff.severity === 'bad' ? 'high' : 'medium';

      advices.push({
        id: `fix_${diff.joint}_${Date.now()}`,
        joint: diff.joint,
        priority,
        title: this.getTitle(diff),
        description: this.getDescription(diff),
        action: this.getAction(diff),
        icon: this.getIcon(diff),
      });
    }

    // 添加通用建议
    if (result.overallScore < 60) {
      advices.push({
        id: 'general_low_score',
        joint: 'general',
        priority: 'low',
        title: '整体建议',
        description: '建议先练习基础体式，增强身体控制力',
        action: '每天练习山式 5 分钟，注意身体对齐',
        icon: 'info',
      });
    }

    return advices;
  }

  private getTitle(diff: PoseDifference): string {
    const jointCN = this.getJointNameCN(diff.joint);
    const direction = diff.current > diff.target ? '过度' : '不足';
    return `${jointCN}${direction}弯曲`;
  }

  private getDescription(diff: PoseDifference): string {
    const jointCN = this.getJointNameCN(diff.joint);
    return `${jointCN}当前角度 ${Math.round(diff.current)}°，` +
           `目标角度 ${Math.round(diff.target)}°，` +
           `偏差 ${Math.round(diff.delta)}°`;
  }

  private getAction(diff: PoseDifference): string {
    const jointCN = this.getJointNameCN(diff.joint);
    if (diff.current > diff.target) {
      return `请伸展${jointCN}，减小弯曲角度约 ${Math.round(diff.delta - 5)}°`;
    }
    return `请弯曲${jointCN}，增加弯曲角度约 ${Math.round(diff.delta - 5)}°`;
  }

  private getIcon(diff: PoseDifference): string {
    if (diff.current > diff.target) return 'arrow-up';
    return 'arrow-down';
  }

  private getJointNameCN(joint: string): string {
    const map: Record<string, string> = {
      left_elbow: '左肘', right_elbow: '右肘',
      left_knee: '左膝', right_knee: '右膝',
      left_hip: '左髋', right_hip: '右髋',
      left_shoulder: '左肩', right_shoulder: '右肩',
    };
    return map[joint] || joint;
  }
}
```

---

### 3.5 模块 5：UI 界面

#### 3.5.1 主布局 (双视图 + 控制面板)

```
┌─────────────────────────────────────────────────────────────┐
│  Header: 瑜伽体式分析系统        [设置] [关于]               │
├─────────────────────────────┬───────────────────────────────┤
│                             │                               │
│   视频/摄像头视图 (左侧)      │   3D SMPL 模型视图 (右侧)      │
│   ┌─────────────────────┐   │   ┌───────────────────────┐   │
│   │                     │   │   │                       │   │
│   │  [实时视频画面]       │   │   │  [3D 人体模型]        │   │
│   │  + 2D 关键点叠加     │   │   │  + 骨骼可视化         │   │
│   │  + 骨骼连线         │   │   │  + 肌肉热力图         │   │
│   │                     │   │   │  + 旋转/缩放控制       │   │
│   └─────────────────────┘   │   └───────────────────────┘   │
│                             │                               │
│   [📷摄像头] [📁文件] [⏸暂停]│   [骨骼] [肌肉] [线框] [重置]  │
│                             │                               │
├─────────────────────────────┼───────────────────────────────┤
│   控制面板 (底部左)           │   矫正建议面板 (底部右)        │
│                             │                               │
│   当前体式: 战士二式          │   矫正建议:                    │
│   置信度: 85%               │   ⚠️ 左膝角度不足 (当前120°)    │
│                             │   ⚠️ 右肩外展不够 (当前45°)     │
│   体式选择:                  │   ✅ 右膝角度正确               │
│   [山式] [战士二式] [三角式]  │                               │
│   [下犬式] [树式] [幻椅式]   │   评分: 72/100                │
│                             │                               │
│   关节角度:                  │   [查看详细矫正方案]            │
│   左膝: 120° → 140°        │                               │
│   右膝: 175° → 180°        │                               │
│   左髋: 90° → 90°          │                               │
│                             │                               │
└─────────────────────────────┴───────────────────────────────┘
```

#### 3.5.2 关键组件实现

```tsx
// src/App.tsx
import React, { useState, useEffect } from 'react';
import { MainLayout } from './components/Layout/MainLayout';
import { usePoseEstimation } from './hooks/usePoseEstimation';
import { useSMPLModel } from './hooks/useSMPLModel';
import { useInputSource } from './hooks/useInputSource';
import { PoseComparator } from './core/comparison/PoseComparator';
import { CorrectionEngine } from './core/comparison/CorrectionEngine';
import type { InputSourceType } from './types/common';

export function App() {
  const [inputType, setInputType] = useState<InputSourceType>('camera');
  const [selectedPose, setSelectedPose] = useState<string>('tadasana');
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [showMuscles, setShowMuscles] = useState(false);

  const { frame, startCamera, loadFile, pause, resume } = useInputSource();
  const { poseResult, isProcessing } = usePoseEstimation(frame);
  const { smplParams, updatePose } = useSMPLModel(poseResult);

  const [comparisonResult, setComparisonResult] = useState(null);
  const [corrections, setCorrections] = useState([]);

  useEffect(() => {
    if (poseResult) {
      const angles = AngleCalculator.calculateAllAngles(poseResult.landmarks);
      const standard = STANDARD_POSES.find(p => p.id === selectedPose);
      if (standard) {
        const result = new PoseComparator().compare(angles, standard);
        setComparisonResult(result);
        setCorrections(new CorrectionEngine().generateAdvice(result));
      }
    }
  }, [poseResult, selectedPose]);

  return (
    <MainLayout
      videoView={
        <VideoView
          frame={frame}
          poseResult={poseResult}
          showSkeleton={showSkeleton}
          onPause={pause}
          onResume={resume}
        />
      }
      model3DView={
        <SMPLViewer
          params={smplParams}
          showSkeleton={showSkeleton}
          showMuscles={showMuscles}
        />
      }
      controlPanel={
        <ControlPanel
          inputType={inputType}
          onInputChange={setInputType}
          selectedPose={selectedPose}
          onPoseChange={setSelectedPose}
          comparisonResult={comparisonResult}
        />
      }
      correctionPanel={
        <CorrectionPanel
          corrections={corrections}
          score={comparisonResult?.overallScore ?? 0}
        />
      }
    />
  );
}
```

#### 3.5.3 状态管理 (Zustand)

```typescript
// src/store/appStore.ts
import { create } from 'zustand';

interface AppState {
  // 输入源
  inputType: 'camera' | 'video' | 'image';
  setInputType: (type: 'camera' | 'video' | 'image') => void;

  // 姿态数据
  currentPose: PoseResult | null;
  setCurrentPose: (pose: PoseResult | null) => void;

  // SMPL 参数
  smplParams: { pose: Float32Array; shape: Float32Array } | null;
  setSmplParams: (params: { pose: Float32Array; shape: Float32Array }) => void;

  // 对比结果
  comparisonResult: ComparisonResult | null;
  setComparisonResult: (result: ComparisonResult) => void;

  // UI 状态
  showSkeleton: boolean;
  showMuscles: boolean;
  toggleSkeleton: () => void;
  toggleMuscles: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  inputType: 'camera',
  setInputType: (type) => set({ inputType: type }),

  currentPose: null,
  setCurrentPose: (pose) => set({ currentPose: pose }),

  smplParams: null,
  setSmplParams: (params) => set({ smplParams: params }),

  comparisonResult: null,
  setComparisonResult: (result) => set({ comparisonResult: result }),

  showSkeleton: true,
  showMuscles: false,
  toggleSkeleton: () => set((s) => ({ showSkeleton: !s.showSkeleton })),
  toggleMuscles: () => set((s) => ({ showMuscles: !s.showMuscles })),
}));
```

---

## 4. 开发阶段划分

### Phase 1: MVP (最小可行产品) — 约 3-4 周

**目标**：能跑通核心流程，证明技术可行性

| 任务 | 优先级 | 预估工时 |
|------|--------|----------|
| 项目初始化 (Electron + React + Vite + TS) | P0 | 2天 |
| MediaPipe Pose 集成 + 基础关键点渲染 | P0 | 3天 |
| 输入源管理 (摄像头 + 视频文件) | P0 | 2天 |
| 2D 关键点叠加到视频画面 | P0 | 1天 |
| 关节角度计算 | P0 | 1天 |
| SMPL 模型加载 + 基础 3D 渲染 | P0 | 3天 |
| MediaPipe → SMPL 参数回归 (基础版) | P0 | 3天 |
| 基础 UI 布局 (双视图) | P0 | 2天 |
| 1 个标准体式 (山式) 对比 | P1 | 2天 |

**MVP 交付物**：
- 打开摄像头，实时显示 2D 关键点
- 3D 视图显示 SMPL 模型跟随姿态变化
- 能选择山式进行基础对比
- 基础 UI 框架

### Phase 2: V1 (功能完整版) — 约 4-5 周

**目标**：功能完整，可用性好

| 任务 | 优先级 | 预估工时 |
|------|--------|----------|
| 关键点平滑处理 (EMA) | P1 | 2天 |
| 5-10 个标准体式数据库 | P1 | 3天 |
| 体式自动识别 (PoseClassifier) | P1 | 3天 |
| 完整差异计算 + 矫正建议生成 | P1 | 3天 |
| 肌肉紧张度映射 + 热力图渲染 | P1 | 3天 |
| 控制面板 (体式选择、显示切换) | P1 | 2天 |
| 矫正建议面板 | P1 | 2天 |
| 图片输入支持 | P1 | 1天 |
| UI 美化 + 中文国际化 | P1 | 2天 |
| 性能优化 (帧率、内存) | P1 | 2天 |

**V1 交付物**：
- 完整的 10 个体式支持
- 实时矫正建议
- 肌肉热力图
- 完善的 UI 交互

### Phase 1.5: 肌肉算法与解剖学模型 (新增)

| 任务 | 优先级 | 预估工时 |
|------|--------|----------|
| 标准体式位置数据库 + 坐标映射 | P0 | 5天 |
| 生理肌肉张紧状态算法 | P1 | 5天 |
| 解剖学骨骼模型映射 | P1 | 5天 |
| SMPL 参数化人体模型集成 | P1 | 5天 |
| 肌肉形变渲染 (Vertex Shader) | P1 | 3天 |

**详细说明**：

#### 0. 标准体式位置数据库 + 坐标映射 (新增)
- 建立每个标准体式的 33 个关键点归一化坐标参考值
- 定义 MediaPipe 坐标系 → 人体解剖学坐标系的转换关系
- 存储格式：每个体式一个 JSON，包含关键点坐标、关节角度、骨骼向量
- 支持多角度参考（正面/侧面/45°）
- 坐标归一化方案：以髋部中心为原点，肩宽为单位长度
- 用于精准体式匹配（不只依赖关节角度，直接比较关键点空间位置）

#### 1. 生理肌肉张紧状态算法
- 基于生物力学模型计算各肌肉群在不同体式下的理论张力
- 考虑关节角度、重力矩、肌肉力臂等因素
- 参考论文：EMG 数据 + 肌肉骨骼模型 (OpenSim)
- 输出：每个肌肉群的 0-1 紧张度值

#### 2. 解剖学骨骼模型映射
- 使用 SMPL/SMPL-X 参数化人体模型
- MediaPipe landmarks → SMPL 参数回归
- 每块骨骼的精确位置和旋转
- 关节活动范围可视化

#### 3. 肌肉形变渲染
- 基于关节角度的肌肉隆起效果
- 顶点着色器实现肌肉收缩形变
- 颜色映射：蓝(松弛) → 黄(中等) → 红(紧张)

### Phase 1.6: 精准体式识别与模型升级 (新增)

| 任务 | 优先级 | 预估工时 |
|------|--------|----------|
| 标准体式位置数据库 | P0 | 3天 |
| 坐标转换映射 (MediaPipe→解剖学) | P0 | 3天 |
| SMPL 参数化人体模型集成 | P1 | 5天 |
| 生理肌肉张力算法 (生物力学) | P1 | 4天 |
| 肌肉形变渲染 (Vertex Shader) | P1 | 3天 |

**详细说明**：

#### 1. 标准体式位置数据库
- 为每个标准体式建立 33 个关键点的归一化坐标参考值
- 归一化方案：髋部中心为原点，肩宽为单位长度
- 每个体式存储：关键点坐标、关节角度、骨骼向量、连接关系
- 支持多角度参考（正面/侧面/45°视角）
- 存储格式：JSON 文件，便于扩展和修改

#### 2. 坐标转换映射
- MediaPipe 坐标系 (x右y下z前) → 解剖学坐标系 (x右y上前)
- 关键点重映射：33点 → 主要解剖学标志点
- 骨骼长度归一化：消除个体身高差异
- 建立从图像坐标到3D人体模型的映射关系

#### 3. SMPL 参数化人体模型集成
- 下载 SMPL 模型文件 (需注册 https://smpl.is.tue.mpg.de)
- pkl → JSON 格式转换脚本
- 浏览器端 SMPL 前向传播计算
- MediaPipe landmarks → SMPL 参数回归器
- Three.js 加载 glTF 模型 + 骨骼动画

#### 4. 生理肌肉张力算法
- 基于关节角度和力矩平衡计算肌肉张力
- 考虑重力矩、肌肉力臂、关节活动范围
- 参考 OpenSim 肌肉骨骼模型
- 输出：每块肌肉的 0-1 紧张度值

#### 5. 肌肉形变渲染
- SMPL 顶点分组映射到主要肌肉群
- 基于关节角度的顶点偏移（肌肉隆起）
- 自定义 ShaderMaterial 实现颜色渐变
- 支持肌肉收缩/舒张的动态效果

### Phase 3: V2 (增强版) — 约 3-4 周

**目标**：体验优化，扩展功能

| 任务 | 优先级 | 预估工时 |
|------|--------|----------|
| Kalman 滤波平滑 (替代 EMA) | P2 | 2天 |
| 姿态历史记录 + 回放 | P2 | 3天 |
| 练习模式 (引导式练习) | P2 | 3天 |
| 语音提示 (Web Speech API) | P2 | 2天 |
| 统计报告 (练习时长、得分趋势) | P2 | 3天 |
| 导出功能 (截图、PDF 报告) | P2 | 2天 |
| 自定义体式 (用户导入) | P2 | 3天 |
| Electron 打包 + 自动更新 | P2 | 2天 |

---

## 5. 关键技术难点和解决方案

### 5.1 难点 1：MediaPipe → SMPL 参数回归

**问题**：MediaPipe 输出 33 个 3D 关键点，SMPL 需要 72 维姿态参数 (24 关节 × 3 轴角)。两者之间没有直接的数学映射。

**解决方案**：

```
方案 A (推荐 — MVP 阶段)：基于骨骼方向的几何求解
├── 将 MediaPipe 关键点重映射到 SMPL 24 关节
├── 计算每个关节相对于父关节的旋转四元数
├── 转换为轴角表示
└── 优点：简单快速，适合实时 | 缺点：精度一般

方案 B (V2 阶段)：神经网络回归
├── 训练一个 MLP 网络：MP landmarks → SMPL params
├── 使用 AMASS 数据集作为训练数据
├── 输入：33×3 = 99 维向量
├── 输出：72 维姿态参数 + 10 维形状参数
└── 优点：精度高 | 缺点：需要训练数据和模型

方案 C (备选)：基于优化的 SMPLify
├── 定义重投影损失函数
├── 使用 L-BFGS 优化 SMPL 参数使模型关键点匹配 MP 关键点
├── 添加姿态先验约束
└── 优点：精度最高 | 缺点：计算量大，不适合实时
```

**推荐路径**：MVP 用方案 A，V1 优化几何求解精度，V2 引入方案 B。

### 5.2 难点 2：SMPL 模型在浏览器中渲染

**问题**：SMPL 官方模型是 Python pickle 格式，包含大型矩阵 (形状混合形状 6890×3×10)，无法直接在浏览器中使用。

**解决方案**：

```
预处理阶段 (Python 脚本)：
1. 加载 SMPL pkl → 提取关键矩阵
2. 将矩阵转换为 JSON/binary 格式
3. 可选：预计算 glTF 模型 (含骨骼)

运行时 (Three.js)：
1. 加载 JSON 模型数据
2. 在 JS 中实现 SMPL 前向传播：
   - vertices = v_template + Bs(β) + Bp(θ)
   - J = J_regressor × vertices
   - G = 从 J 和 θ 计算变换矩阵
   - T = G × weights
   - posed_vertices = T × vertices
3. 每帧更新姿态参数，重新计算顶点
4. 使用 BufferGeometry 更新顶点位置
```

**性能优化**：
- 使用 Web Worker 计算 SMPL 前向传播，避免阻塞主线程
- 顶点计算结果缓存 (相同姿态参数不重复计算)
- 降低渲染精度 (使用 LOD 或简化网格)

### 5.3 难点 3：实时性能

**问题**：同时运行 MediaPipe 姿态估计 + SMPL 前向传播 + Three.js 渲染，需要保持 30fps。

**解决方案**：

```
1. 姿态估计降频
   - MediaPipe 每 2 帧运行一次 (15fps 检测)
   - 中间帧使用 LandmarkSmoother 插值

2. SMPL 计算优化
   - Web Worker 中运行 SMPL 前向传播
   - 使用 Float32Array 避免 GC
   - 姿态参数变化 < 阈值时跳过计算

3. Three.js 渲染优化
   - 使用 instanced rendering
   - 降低阴影质量
   - 使用 requestAnimationFrame 自适应帧率

4. 内存管理
   - 及时释放 MediaPipe 返回的 GPU 纹理
   - SMPL 模型数据只加载一次
   - 视频帧使用对象池
```

### 5.4 难点 4：肌肉紧张度可视化

**问题**：SMPL 模型本身不包含肌肉信息，需要额外映射。

**解决方案**：

```
1. 预定义肌肉群 → 顶点映射表
   - 将 SMPL 6890 个顶点分组到主要肌肉群
   - 每个顶点可能属于多个肌肉群 (权重)

2. 关节角度 → 肌肉紧张度估算
   - 基于生物力学简化模型
   - 关节弯曲角度越大，对应肌肉越紧张
   - 例：膝关节弯曲 → 股四头肌紧张

3. 渲染方式
   - 使用顶点着色器 (Vertex Shader) 实现颜色映射
   - 松弛 (0) → 蓝色，紧张 (1) → 红色
   - 或使用自定义 ShaderMaterial 实现渐变
```

### 5.5 难点 5：3D 深度估计

**问题**：MediaPipe 的 z 坐标是相对深度，不准确，影响 SMPL 姿态质量。

**解决方案**：

```
1. 使用 MediaPipe 的 worldLandmarks
   - worldLandmarks 提供米制单位的 3D 坐标
   - 比 landmarks.z 更准确

2. 骨骼长度约束
   - 已知人体骨骼比例 (如前臂/上臂比)
   - 用 2D 投影 + 骨骼长度约束优化 3D 位置

3. 时序一致性
   - 使用 Kalman 滤波平滑 z 坐标
   - 利用前一帧的深度信息辅助当前帧估计
```

---

## 6. 依赖库清单

### 6.1 核心依赖

| 库 | 版本 | 用途 |
|----|------|------|
| `electron` | ^33.x | 桌面应用框架 |
| `react` | ^19.x | UI 框架 |
| `react-dom` | ^19.x | React DOM 渲染 |
| `typescript` | ^5.x | 类型系统 |
| `vite` | ^6.x | 构建工具 |
| `@mediapipe/tasks-vision` | ^0.10.x | MediaPipe 姿态估计 |
| `three` | ^0.170.x | 3D 渲染引擎 |
| `@types/three` | ^0.170.x | Three.js 类型 |
| `zustand` | ^5.x | 状态管理 |

### 6.2 开发依赖

| 库 | 版本 | 用途 |
|----|------|------|
| `electron-builder` | ^25.x | Electron 打包 |
| `electron-vite` | ^2.x | Vite + Electron 集成 |
| `vitest` | ^2.x | 单元测试 |
| `@testing-library/react` | ^16.x | React 组件测试 |
| `eslint` | ^9.x | 代码检查 |
| `prettier` | ^3.x | 代码格式化 |
| `@typescript-eslint/parser` | ^8.x | TS ESLint 解析器 |

### 6.3 可选依赖

| 库 | 版本 | 用途 |
|----|------|------|
| `@react-three/fiber` | ^8.x | React Three.js 集成 (可选替代直接使用 Three.js) |
| `@react-three/drei` | ^9.x | Three.js 实用组件 |
| `framer-motion` | ^11.x | UI 动画 |
| `@radix-ui/react-*` | ^1.x | 无样式 UI 组件 |
| `tailwindcss` | ^4.x | CSS 框架 (如需) |
| `i18next` | ^24.x | 国际化 (如需扩展英文支持) |

### 6.4 资源依赖

| 资源 | 来源 | 许可 |
|------|------|------|
| SMPL 模型 | smpl.is.tue.mpg.de | 非商业研究 |
| SMPL-X 模型 | smpl-x.is.tue.mpg.de | 非商业研究 |
| MediaPipe 模型 | Google MediaPipe | Apache 2.0 |
| Pose Landmarker Full | @mediapipe/tasks-vision 自动下载 | Apache 2.0 |

---

## 7. 技术选型对比与理由

### 7.1 状态管理：Zustand vs Redux vs Jotai

| 方案 | 包大小 | 复杂度 | TypeScript 支持 | 选择理由 |
|------|--------|--------|-----------------|----------|
| **Zustand** | ~1KB | 低 | 优秀 | **选用** — 极简 API，无需 Provider |
| Redux Toolkit | ~11KB | 中 | 优秀 | 过重，本项目状态不复杂 |
| Jotai | ~2KB | 低 | 优秀 | 原子化模型对本项目过于分散 |

### 7.2 3D 渲染：直接 Three.js vs @react-three/fiber

| 方案 | 性能 | 学习曲线 | 灵活性 | 选择理由 |
|------|------|----------|--------|----------|
| **直接 Three.js** | 最优 | 中 | 最高 | **选用** — SMPL 需要精细控制骨骼更新 |
| R3F | 良好 | 低 | 高 | 声明式 API 可能与 SMPL 实时更新冲突 |

### 7.3 Electron vs Tauri vs Web

| 方案 | 包大小 | 原生能力 | 安全性 | 选择理由 |
|------|--------|----------|--------|----------|
| **Electron** | ~150MB | 完整 | 中 | **选用** — 生态成熟，摄像头/文件 API 完善 |
| Tauri | ~5MB | 依赖系统 WebView | 高 | WebView 对 WASM 支持不一致 |
| 纯 Web | 0 | 受限 | 高 | 无法访问本地文件和摄像头设备管理 |

---

## 8. 10 个基础体式清单

| # | 梵文名 | 中文名 | 英文名 | 难度 | 主要关节角度特征 |
|---|--------|--------|--------|------|-----------------|
| 1 | Tadasana | 山式 | Mountain Pose | 初级 | 双腿伸直，身体垂直 |
| 2 | Virabhadrasana II | 战士二式 | Warrior II | 初级 | 前膝90°，双臂平举 |
| 3 | Trikonasana | 三角式 | Triangle Pose | 初级 | 侧弯，一手触地 |
| 4 | Adho Mukha Svanasana | 下犬式 | Downward Dog | 初级 | 倒V形，手臂腿伸直 |
| 5 | Vrksasana | 树式 | Tree Pose | 初级 | 单腿站立，一脚抵大腿 |
| 6 | Utkatasana | 幻椅式 | Chair Pose | 初级 | 膝弯曲90°，双臂上举 |
| 7 | Balasana | 婴儿式 | Child's Pose | 初级 | 跪坐，身体前屈 |
| 8 | Bhujangasana | 眼镜蛇式 | Cobra Pose | 初级 | 俯卧后弯，腿贴地 |
| 9 | Navasana | 船式 | Boat Pose | 中级 | V形坐姿，腿抬起 |
| 10 | Savasana | 挺尸式 | Corpse Pose | 初级 | 仰卧完全放松 |

---

## 9. 验证标准

### MVP 验收标准
- [ ] 摄像头实时画面 + 2D 关键点叠加，帧率 ≥ 15fps
- [ ] 3D SMPL 模型跟随人体姿态变化
- [ ] 山式基础对比功能可用
- [ ] 双视图 UI 布局正常显示

### V1 验收标准
- [ ] 10 个体式全部支持识别和对比
- [ ] 矫正建议准确率 ≥ 70% (人工评估)
- [ ] 肌肉热力图渲染正常
- [ ] 实时模式帧率 ≥ 20fps
- [ ] 中文 UI 无乱码

### V2 验收标准
- [ ] 练习模式引导流程完整
- [ ] 历史记录和统计功能可用
- [ ] Electron 打包后可独立运行
- [ ] macOS / Windows 双平台可用
