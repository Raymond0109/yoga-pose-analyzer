# Research Brief: Yoga Pose Estimation Models

## Question
What alternative or complementary pose estimation models can better detect yoga poses compared to MediaPipe, especially for complex poses (balance, backbends, inversions)?

## Scope
- **In**: Pose estimation models suitable for real-time or near-real-time yoga pose detection
- **In**: Models that can handle extreme angles and unusual body orientations
- **In**: Browser-based or lightweight deployment options
- **Out**: Heavy server-side models requiring GPU clusters
- **Out**: Models only suitable for video games or animation

## Assumptions
- Target platform: Electron desktop app (can use WASM, WebGL, TensorFlow.js)
- Primary use case: Real-time camera input + static image analysis
- Current baseline: MediaPipe Pose (works for standing poses, fails for complex yoga)

## Depth Mode
Standard (3-5 sub-agents, 15+ sources)

## Date
2026-07-12

## Angles
1. **MediaPipe alternatives**: MoveNet, BlazePose, and other TensorFlow.js-based models
2. **High-accuracy models**: ViTPose, DWPose, MMPose - transformer-based approaches
3. **Yoga-specific models**: Any models trained specifically on yoga/fitness data
4. **Hybrid approaches**: Multi-model fusion, confidence-based selection
5. **Deployment constraints**: Browser performance, WASM support, model size
