/**
 * 多模型姿态估计器
 * 融合 MediaPipe + MoveNet，支持置信度过滤和图片预处理
 */

import * as tf from '@tensorflow/tfjs'
import type { PoseLandmark } from '@/types/pose'

export interface PoseEstimationResult {
  landmarks: PoseLandmark[]
  confidence: number
  model: 'mediapipe' | 'movenet' | 'fused'
}

export interface PoseEstimatorConfig {
  confidenceThreshold: number  // 最低置信度阈值 (0-1)
  enableMoveNet: boolean       // 是否启用 MoveNet
  enablePreprocessing: boolean // 是否启用图片预处理
  fusionWeight: number         // 融合权重 (0-1, 1=完全用 MoveNet)
}

const DEFAULT_CONFIG: PoseEstimatorConfig = {
  confidenceThreshold: 0.3,
  enableMoveNet: true,
  enablePreprocessing: true,
  fusionWeight: 0.5,
}

/**
 * 图片预处理器
 * 改善 MediaPipe 在解剖图/复杂背景下的检测效果
 */
class ImagePreprocessor {
  /**
   * 增强对比度（CLAHE 简化版）
   */
  static enhanceContrast(imageData: ImageData): ImageData {
    const data = imageData.data
    let min = 255, max = 0

    // 找到亮度范围
    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
      if (gray < min) min = gray
      if (gray > max) max = gray
    }

    // 拉伸对比度
    const range = max - min || 1
    for (let i = 0; i < data.length; i += 4) {
      data[i] = ((data[i] - min) / range) * 255
      data[i + 1] = ((data[i + 1] - min) / range) * 255
      data[i + 2] = ((data[i + 2] - min) / range) * 255
    }

    return imageData
  }

  /**
   * 边缘增强（简化 Sobel）
   */
  static edgeEnhance(imageData: ImageData): ImageData {
    const { width, height, data } = imageData
    const output = new Uint8ClampedArray(data)

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4

        // Sobel X
        const gx = (
          -data[((y - 1) * width + x - 1) * 4] +
          data[((y - 1) * width + x + 1) * 4] +
          -2 * data[(y * width + x - 1) * 4] +
          2 * data[(y * width + x + 1) * 4] +
          -data[((y + 1) * width + x - 1) * 4] +
          data[((y + 1) * width + x + 1) * 4]
        ) / 8

        // Sobel Y
        const gy = (
          -data[((y - 1) * width + x - 1) * 4] +
          -2 * data[((y - 1) * width + x) * 4] +
          -data[((y - 1) * width + x + 1) * 4] +
          data[((y + 1) * width + x - 1) * 4] +
          2 * data[((y + 1) * width + x) * 4] +
          data[((y + 1) * width + x + 1) * 4]
        ) / 8

        const edge = Math.min(255, Math.sqrt(gx * gx + gy * gy))
        output[idx] = Math.min(255, data[idx] + edge * 0.3)
        output[idx + 1] = Math.min(255, data[idx + 1] + edge * 0.3)
        output[idx + 2] = Math.min(255, data[idx + 2] + edge * 0.3)
      }
    }

    return new ImageData(output, width, height)
  }

  /**
   * 去除背景干扰（简化版：降低饱和度）
   */
  static desaturate(imageData: ImageData, amount: number = 0.5): ImageData {
    const data = imageData.data
    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
      data[i] = data[i] + (gray - data[i]) * amount
      data[i + 1] = data[i + 1] + (gray - data[i + 1]) * amount
      data[i + 2] = data[i + 2] + (gray - data[i + 2]) * amount
    }
    return imageData
  }
}

/**
 * MoveNet 姿态估计器
 */
class MoveNetEstimator {
  private model: tf.LayersModel | null = null
  private inputSize = 192

  async initialize(): Promise<void> {
    try {
      // MoveNet SinglePose Lightning (快速版)
      this.model = await tf.loadLayersModel(
        'https://tfhub.dev/google/tfjs-model/movenet/singlepose/lightning/4',
        { fromTFHub: true }
      )
      console.log('[MoveNet] Model loaded')
    } catch (e) {
      console.warn('[MoveNet] Failed to load model:', e)
    }
  }

  async estimate(image: HTMLImageElement | HTMLVideoElement): Promise<PoseEstimationResult | null> {
    if (!this.model) return null

    try {
      const input = tf.browser.fromPixels(image)
        .resizeBilinear([this.inputSize, this.inputSize])
        .expandDims(0)
        .div(255.0)

      const output = this.model.predict(input) as tf.Tensor
      const data = await output.data()

      input.dispose()
      output.dispose()

      // MoveNet 输出格式: [1, 1, 17, 3] (y, x, confidence)
      const landmarks: PoseLandmark[] = []
      let totalConfidence = 0

      for (let i = 0; i < 17; i++) {
        const y = data[i * 3]
        const x = data[i * 3 + 1]
        const confidence = data[i * 3 + 2]
        landmarks.push({ x, y, z: 0, visibility: confidence })
        totalConfidence += confidence
      }

      // MoveNet 17点 → MediaPipe 33点映射
      const mapped = this.mapToMediaPipe(landmarks)

      return {
        landmarks: mapped,
        confidence: totalConfidence / 17,
        model: 'movenet',
      }
    } catch (e) {
      console.warn('[MoveNet] Estimation failed:', e)
      return null
    }
  }

  /**
   * MoveNet 17点 → MediaPipe 33点映射
   */
  private mapToMediaPipe(movenetLandmarks: PoseLandmark[]): PoseLandmark[] {
    const result: PoseLandmark[] = new Array(33).fill(null).map(() => ({
      x: 0, y: 0, z: 0, visibility: 0,
    }))

    // MoveNet 索引 → MediaPipe 索引
    const mapping: [number, number][] = [
      [0, 0],   // nose
      [11, 11], // left_shoulder
      [12, 12], // right_shoulder
      [13, 13], // left_elbow
      [14, 14], // right_elbow
      [15, 15], // left_wrist
      [16, 16], // right_wrist
      [23, 23], // left_hip
      [24, 24], // right_hip
      [25, 25], // left_knee
      [26, 26], // right_knee
      [27, 27], // left_ankle
      [28, 28], // right_ankle
    ]

    for (const [movenetIdx, mediapipeIdx] of mapping) {
      if (movenetLandmarks[movenetIdx]) {
        result[mediapipeIdx] = movenetLandmarks[movenetIdx]
      }
    }

    return result
  }
}

/**
 * 多模型融合姿态估计器
 */
export class MultiModelPoseEstimator {
  private config: PoseEstimatorConfig
  private moveNet: MoveNetEstimator | null = null
  private initialized = false

  constructor(config: Partial<PoseEstimatorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  async initialize(): Promise<void> {
    if (this.config.enableMoveNet) {
      this.moveNet = new MoveNetEstimator()
      await this.moveNet.initialize()
    }
    this.initialized = true
  }

  /**
   * 预处理图片（可选）
   */
  preprocessImage(image: HTMLImageElement | HTMLVideoElement): HTMLImageElement | HTMLVideoElement {
    if (!this.config.enablePreprocessing) return image

    // 对于图片，创建增强版本
    if (image instanceof HTMLImageElement) {
      const canvas = document.createElement('canvas')
      canvas.width = image.naturalWidth || image.width
      canvas.height = image.naturalHeight || image.height
      const ctx = canvas.getContext('2d')!

      // 绘制原图
      ctx.drawImage(image, 0, 0)

      // 获取像素数据
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

      // 应用预处理
      const enhanced = ImagePreprocessor.enhanceContrast(imageData)
      ctx.putImageData(enhanced, 0, 0)

      // 返回增强后的图片
      const enhancedImg = new Image()
      enhancedImg.src = canvas.toDataURL()
      return enhancedImg
    }

    return image
  }

  /**
   * 估计姿态（融合多模型）
   */
  async estimate(
    image: HTMLImageElement | HTMLVideoElement,
    mediapipeResult?: PoseEstimationResult
  ): Promise<PoseEstimationResult> {
    // 预处理
    const processedImage = this.preprocessImage(image)

    // 获取 MoveNet 结果
    let movenetResult: PoseEstimationResult | null = null
    if (this.moveNet) {
      movenetResult = await this.moveNet.estimate(processedImage)
    }

    // 融合结果
    if (mediapipeResult && movenetResult) {
      return this.fuseResults(mediapipeResult, movenetResult)
    }

    // 单模型结果
    if (mediapipeResult) return mediapipeResult
    if (movenetResult) return movenetResult

    return { landmarks: [], confidence: 0, model: 'mediapipe' }
  }

  /**
   * 融合两个模型的结果
   */
  private fuseResults(
    a: PoseEstimationResult,
    b: PoseEstimationResult
  ): PoseEstimationResult {
    const w = this.config.fusionWeight
    const landmarks: PoseLandmark[] = []

    for (let i = 0; i < 33; i++) {
      const la = a.landmarks[i]
      const lb = b.landmarks[i]

      if (!la || !lb) {
        landmarks.push(la || lb || { x: 0, y: 0, z: 0, visibility: 0 })
        continue
      }

      // 按置信度加权融合
      const confA = la.visibility || 0
      const confB = lb.visibility || 0
      const totalConf = confA + confB || 1

      landmarks.push({
        x: (la.x * confA + lb.x * confB) / totalConf,
        y: (la.y * confA + lb.y * confB) / totalConf,
        z: (la.z * confA + lb.z * confB) / totalConf,
        visibility: Math.max(confA, confB),
      })
    }

    return {
      landmarks,
      confidence: (a.confidence + b.confidence) / 2,
      model: 'fused',
    }
  }

  /**
   * 置信度过滤
   */
  filterByConfidence(landmarks: PoseLandmark[]): PoseLandmark[] {
    return landmarks.map(lm => ({
      ...lm,
      visibility: lm.visibility >= this.config.confidenceThreshold ? lm.visibility : 0,
    }))
  }

  dispose(): void {
    this.moveNet = null
  }
}
