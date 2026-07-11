/**
 * 姿态估计器（支持多模型融合）
 * 集成 MediaPipe + MoveNet，支持置信度过滤
 */

import { PoseLandmarker, FilesetResolver, type PoseLandmarkerResult } from '@mediapipe/tasks-vision'
import type { PoseResult, PoseLandmark } from '@/types/pose'
import { LandmarkSmoother, type SmootherState } from './LandmarkSmoother'

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
      confidenceThreshold: 0.3,
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
      minPoseDetectionConfidence: 0.3,
      minPosePresenceConfidence: 0.3,
      minTrackingConfidence: 0.3,
    })

    this.initialized = true
  }

  /**
   * 预处理图片（增强对比度）
   */
  private preprocessImage(image: HTMLImageElement): HTMLImageElement {
    if (!this.config.enablePreprocessing) return image

    const canvas = document.createElement('canvas')
    canvas.width = image.naturalWidth || image.width
    canvas.height = image.naturalHeight || image.height
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(image, 0, 0)

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data

    // 简单对比度增强
    let min = 255, max = 0
    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
      if (gray < min) min = gray
      if (gray > max) max = gray
    }
    const range = max - min || 1
    for (let i = 0; i < data.length; i += 4) {
      data[i] = ((data[i] - min) / range) * 255
      data[i + 1] = ((data[i + 1] - min) / range) * 255
      data[i + 2] = ((data[i + 2] - min) / range) * 255
    }

    ctx.putImageData(imageData, 0, 0)

    const enhanced = new Image()
    enhanced.src = canvas.toDataURL()
    return enhanced
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
