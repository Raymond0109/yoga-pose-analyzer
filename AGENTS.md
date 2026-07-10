# AGENTS.md — yoga_pose_mimo_code

> 瑜伽体式分析与矫正可视化桌面应用

## 项目状态

MVP 阶段完成。核心流程已实现，可构建。详细设计方案见 `DESIGN.md`。

## 技术栈

- **框架**: Electron + React + TypeScript
- **3D 渲染**: Three.js
- **姿态估计**: MediaPipe Pose (JS SDK, @mediapipe/tasks-vision)
- **人体模型**: 程序化骨骼渲染 (待升级 SMPL)
- **构建工具**: Vite (electron-vite)
- **状态管理**: Zustand

## 构建/运行命令

```bash
npm install          # 安装依赖
npm run dev          # 开发模式 (electron-vite dev)
npm run build        # 生产构建
npm run typecheck    # TypeScript 类型检查
npm run test         # 运行测试
```

## 核心模块

1. ✅ 输入源管理 (摄像头/视频/图片) — `src/core/input/`
2. ✅ MediaPipe 姿态估计 + 关键点平滑 — `src/core/pose/`
3. ✅ 程序化骨骼渲染 (Three.js) — `src/core/smpl/`
4. ✅ 10 个体式标准数据库 + 对比 + 矫正建议 — `src/core/comparison/`
5. ✅ 双视图 UI 界面 (中文) — `src/App.tsx`

## 开发阶段

- ✅ **MVP**: 核心流程跑通，10个体式标准数据，基础3D渲染
- [ ] **V1**: SMPL 模型集成，肌肉热力图，体式自动识别
- [ ] **V2**: 练习模式，统计报告，打包发布

## 关键文件

```
electron/main.ts, preload.ts       # Electron 主进程
src/App.tsx                        # 主 UI 组件
src/core/pose/MediaPipePose.ts     # MediaPipe 封装
src/core/smpl/SMPLRenderer.ts      # Three.js 渲染器
src/core/comparison/StandardPoseDB.ts  # 标准体式数据库
src/core/comparison/PoseComparator.ts  # 对比引擎
src/store/appStore.ts              # Zustand 状态
```

## 待补充

- [x] 技术栈与框架选择
- [x] 构建/测试/运行命令
- [x] 项目结构说明 (见 DESIGN.md §1)
- [ ] SMPL 模型文件下载与集成
- [ ] 肌肉热力图渲染
