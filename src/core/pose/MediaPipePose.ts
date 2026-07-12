/**
 * 姿态估计器（支持多模型融合）
 * 集成 MediaPipe + MoveNet，支持置信度过滤
 */

import { PoseLandmarker, FilesetResolver, type PoseLandmarkerResult } from '@mediapipe/tasks-vision'
import type { PoseResult, PoseLandmark } from '@/types/pose'
import { LandmarkSmoother, type SmootherState } from './LandmarkSmoother'
import { AdvancedPreprocessor } from './AdvancedPreprocessor'
import { fuseModelResults, type ModelResult } from './ModelFusion'

/** 平滑等级预设 */
const SMOOTH_PRESETS: Record<number, { minCutoff: number; beta: number }> = {
  0: { minCutoff: 3.0, beta: 0.05 },
  1: { minCutoff: 1.2, beta: 0.02 },
  2: { minCutoff: 0.6, beta: 0.015 },
  3: { minCutoff: 0.3, beta: 0.008 },
  4: { minCutoff: 0.15, beta: 0.005 },
}

export interface PoseEstimatorConfig {
  confidenceThreshold: number
  enableMoveNet: boolean
  enablePreprocessing: boolean
}

export class MediaPipePose {
  private landmarker: PoseLandmarker | null = null
  private smoother: LandmarkSmoother
  private initialized = false
  private config: PoseEstimatorConfig

  constructor(config?: Partial<PoseEstimatorConfig>) {
    this.config = {
      confidenceThreshold: 0.2,
      enableMoveNet: false,
      enablePreprocessing: false,
      ...config,
    }

    this.smoother = new LandmarkSmoother({
      minCutoff: 0.6,
      beta: 0.015,
      dCutoff: 1.0,
      historySize: 5,
      minConfidence: 0.3,
      jumpThreshold: 0.12,
      lockThreshold: 0.008,
      lockFrameCount: 4,
      unlockThreshold: 0.025,
    })
  }

  setSmoothLevel(level: number): void {
    const preset = SMOOTH_PRESETS[level] ?? SMOOTH_PRESETS[2]
    this.smoother.updateConfig({
      minCutoff: preset.minCutoff,
      beta: preset.beta,
    })
  }

  getState(): SmootherState {
    return this.smoother.getState()
  }

  async initialize(wasmPath?: string): Promise<void> {
    if (this.initialized) return

    const vision = await FilesetResolver.forVisionTasks(
      wasmPath ?? 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
    )

    this.landmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numPoses: 1,
      minPoseDetectionConfidence: 0.2,
      minPosePresenceConfidence: 0.2,
      minTrackingConfidence: 0.2,
    })

    this.initialized = true
  }

  /**
   * 预处理图片（仅对解剖图转换，真实照片不处理）
   */
  private preprocessImage(image: HTMLImageElement): HTMLImageElement {
    if (!this.config.enablePreprocessing) return image

    const canvas = document.createElement('canvas')
    canvas.width = image.naturalWidth || image.width
    canvas.height = image.naturalHeight || image.height
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(image, 0, 0)

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

    // 仅对解剖图做转换，真实照片直接返回
    if (!this.detectAnatomyImage(imageData)) {
      return image  // 真实照片不预处理
    }

    // 解剖图：转换为类真人风格
    const processed = AdvancedPreprocessor.anatomyToRealistic(imageData)
    ctx.putImageData(processed, 0, 0)

    const enhanced = new Image()
    enhanced.src = canvas.toDataURL()
    return enhanced
  }

  /**
   * 检测是否为解剖图
   * 解剖图特征：大面积红色/橙色肌肉纹理，无真人皮肤色
   */
  private detectAnatomyImage(imageData: ImageData): boolean {
    const { data } = imageData
    let redOrangeCount = 0
    let skinColorCount = 0
    let totalPixels = 0

    // 采样检查
    for (let i = 0; i < data.length; i += 32) {
      const r = data[i], g = data[i + 1], b = data[i + 2]
      totalPixels++

      // 解剖图肌肉颜色：红/橙/棕色（饱和度高，偏红）
      if (r > 120 && g > 40 && b < 120 && r > g * 1.3 && r > b * 1.5) {
        redOrangeCount++
      }

      // 真人皮肤色：偏黄/粉，饱和度适中
      if (r > 150 && g > 100 && b > 80 && r > g && g > b) {
        skinColorCount++
      }
    }

    const redRatio = redOrangeCount / totalPixels
    const skinRatio = skinColorCount / totalPixels

    // 解剖图：红色区域大，皮肤色区域小
    return redRatio > 0.2 && skinRatio < 0.1
  }

  estimate(
    image: HTMLVideoElement | HTMLImageElement | ImageData,
    timestamp: number
  ): PoseResult | null {
    if (!this.landmarker || !this.initialized) return null

    // 预处理（仅对图片）
    let inputImage: HTMLVideoElement | HTMLImageElement | ImageData = image
    if (image instanceof HTMLImageElement && this.config.enablePreprocessing) {
      inputImage = this.preprocessImage(image)
    }

    let result: PoseLandmarkerResult
    try {
      result = this.landmarker.detectForVideo(inputImage, timestamp)
    } catch {
      return null
    }

    if (!result.landmarks || result.landmarks.length === 0) return null

    const rawLandmarks: PoseLandmark[] = result.landmarks[0].map((lm) => ({
      x: lm.x,
      y: lm.y,
      z: lm.z,
      visibility: lm.visibility ?? 0.5,
    }))

    const worldLandmarks: PoseLandmark[] = result.worldLandmarks?.[0]?.map((lm) => ({
      x: lm.x,
      y: lm.y,
      z: lm.z,
      visibility: lm.visibility ?? 0.5,
    })) ?? rawLandmarks

    // 置信度过滤
    const filtered = this.filterByConfidence(rawLandmarks)

    const smoothed = this.smoother.smooth(filtered, timestamp)
    const confidence = this.smoother.getLastConfidence()

    // 置信度过滤：低于阈值时返回 null
    if (confidence < this.config.confidenceThreshold) {
      return null
    }

    return {
      landmarks: smoothed,
      worldLandmarks,
      timestamp,
      confidence,
    }
  }

  /**
   * 多次运行融合（提高鲁棒性）
   * 对同一图像运行多次检测，融合结果
   */
  estimateWithFusion(
    image: HTMLVideoElement | HTMLImageElement,
    timestamp: number,
    runs: number = 3
  ): PoseResult | null {
    const results: ModelResult[] = []

    for (let i = 0; i < runs; i++) {
      const result = this.estimate(image, timestamp + i)
      if (result) {
        results.push({
          landmarks: result.landmarks,
          confidence: result.confidence ?? 0.5,
          model: 'mediapipe',
        })
      }
    }

    if (results.length === 0) return null

    // 融合结果
    const fused = fuseModelResults(results)
    if (!fused) return null

    // 融合后的置信度过滤
    if (fused.confidence < this.config.confidenceThreshold) {
      return null
    }

    return {
      landmarks: fused.landmarks,
      worldLandmarks: fused.landmarks,
      timestamp,
      confidence: fused.confidence,
    }
  }

  /**
   * 置信度过滤
   */
  private filterByConfidence(landmarks: PoseLandmark[]): PoseLandmark[] {
    return landmarks.map(lm => ({
      ...lm,
      visibility: lm.visibility >= 0.3 ? lm.visibility : 0,
    }))
  }

  dispose(): void {
    this.landmarker?.close()
    this.landmarker = null
    this.initialized = false
  }
}
