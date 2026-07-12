/**
 * RTMPose 姿态估计器
 * 基于 ONNX Runtime Web，使用 MMPose 的 RTMPose 模型
 * 
 * 模型来源：https://github.com/open-mmlab/mmpose
 * 精度：COCO AP 75.8 (RTMPose-m)
 */

import * as ort from 'onnxruntime-web'
import type { PoseLandmark } from '@/types/pose'

// RTMPose 17个关键点（COCO格式）
const RTMPOSE_KEYPOINTS = [
  'nose', 'left_eye', 'right_eye', 'left_ear', 'right_ear',
  'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow',
  'left_wrist', 'right_wrist', 'left_hip', 'right_hip',
  'left_knee', 'right_knee', 'left_ankle', 'right_ankle',
]

// COCO 17点 → MediaPipe 33点 映射
const COCO_TO_MEDIAPIPE: [number, number][] = [
  [0, 0],   // nose
  [1, 2],   // left_eye → right_eye (镜像)
  [2, 1],   // right_eye → left_eye
  [3, 7],   // left_ear → left_ear
  [4, 8],   // right_ear → right_ear
  [5, 11],  // left_shoulder
  [6, 12],  // right_shoulder
  [7, 13],  // left_elbow
  [8, 14],  // right_elbow
  [9, 15],  // left_wrist
  [10, 16], // right_wrist
  [11, 23], // left_hip
  [12, 24], // right_hip
  [13, 25], // left_knee
  [14, 26], // right_knee
  [15, 27], // left_ankle
  [16, 28], // right_ankle
]

export class RTMPoseEstimator {
  private session: ort.InferenceSession | null = null
  private inputSize = [192, 256] // [height, width]
  private initialized = false
  private modelPath: string

  constructor(modelPath?: string) {
    // 默认使用 RTMPose-m 模型（需要下载）
    this.modelPath = modelPath || ''
  }

  async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      // 设置 ONNX Runtime 后端
      ort.env.wasm.numThreads = navigator.hardwareConcurrency || 4

      if (this.modelPath) {
        this.session = await ort.InferenceSession.create(this.modelPath, {
          executionProviders: ['wasm'],
        })
        this.initialized = true
        console.log('[RTMPose] Model loaded from:', this.modelPath)
      } else {
        console.warn('[RTMPose] No model path provided, using placeholder')
        this.initialized = true
      }
    } catch (e) {
      console.error('[RTMPose] Failed to initialize:', e)
    }
  }

  /**
   * 预处理图片为模型输入格式
   */
  private preprocess(image: HTMLImageElement | HTMLVideoElement): ort.Tensor {
    const canvas = document.createElement('canvas')
    canvas.width = this.inputSize[1]
    canvas.height = this.inputSize[0]
    const ctx = canvas.getContext('2d')!

    // 绘制并缩放
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height)

    // 获取像素数据并转换为 NCHW 格式
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const { data } = imageData

    // NCHW: [1, 3, H, W]
    const input = new Float32Array(1 * 3 * canvas.height * canvas.width)

    for (let i = 0; i < canvas.height * canvas.width; i++) {
      // RGB → 归一化到 [0, 1]
      input[i] = data[i * 4] / 255.0                    // R
      input[canvas.height * canvas.width + i] = data[i * 4 + 1] / 255.0  // G
      input[2 * canvas.height * canvas.width + i] = data[i * 4 + 2] / 255.0  // B
    }

    return new ort.Tensor('float32', input, [1, 3, canvas.height, canvas.width])
  }

  /**
   * 估计姿态
   */
  async estimate(
    image: HTMLImageElement | HTMLVideoElement
  ): Promise<{ landmarks: PoseLandmark[]; confidence: number } | null> {
    if (!this.session || !this.initialized) {
      // 如果没有模型，返回模拟结果（用于测试）
      return this.mockEstimate(image)
    }

    try {
      const inputTensor = this.preprocess(image)
      const results = await this.session.run({ input: inputTensor })

      // 解析输出（热力图模式）
      const output = results.output || results[Object.keys(results)[0]]
      if (!output) return null

      const data = output.data as Float32Array
      const [_, h, w] = output.dims

      const landmarks: PoseLandmark[] = []
      let totalConfidence = 0

      for (let k = 0; k < 17; k++) {
        // 找到最大值位置（热力图峰值）
        let maxVal = -Infinity
        let maxX = 0, maxY = 0

        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const val = data[k * h * w + y * w + x]
            if (val > maxVal) {
              maxVal = val
              maxX = x
              maxY = y
            }
          }
        }

        // 归一化到 [0, 1]
        const confidence = 1 / (1 + Math.exp(-maxVal)) // sigmoid
        const normX = maxX / w
        const normY = maxY / h

        landmarks.push({ x: normX, y: normY, z: 0, visibility: confidence })
        totalConfidence += confidence
      }

      // 映射到 MediaPipe 33 点
      const mapped = new Array(33).fill(null).map(() => ({
        x: 0, y: 0, z: 0, visibility: 0,
      }))

      for (const [rtmIdx, mpIdx] of COCO_TO_MEDIAPIPE) {
        if (landmarks[rtmIdx]) {
          mapped[mpIdx] = landmarks[rtmIdx]
        }
      }

      return {
        landmarks: mapped,
        confidence: totalConfidence / 17,
      }
    } catch (e) {
      console.error('[RTMPose] Estimation failed:', e)
      return null
    }
  }

  /**
   * 模拟估计（用于测试，当没有真实模型时）
   */
  private mockEstimate(
    image: HTMLImageElement | HTMLVideoElement
  ): { landmarks: PoseLandmark[]; confidence: number } | null {
    // 返回模拟结果，标记为低置信度
    const landmarks: PoseLandmark[] = new Array(33).fill(null).map(() => ({
      x: 0.5, y: 0.5, z: 0, visibility: 0.1,
    }))
    return { landmarks, confidence: 0.1 }
  }

  dispose(): void {
    this.session?.release()
    this.session = null
    this.initialized = false
  }
}

/**
 * MoveNet 姿态估计器
 * 基于 TensorFlow.js
 */
export class MoveNetEstimator {
  private model: any = null
  private initialized = false

  async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      // 动态导入 TensorFlow.js
      const tf = await import('@tensorflow/tfjs')

      // 加载 MoveNet SinglePose Lightning
      this.model = await tf.loadLayersModel(
        'https://tfhub.dev/google/tfjs-model/movenet/singlepose/lightning/4',
        { fromTFHub: true }
      )

      this.initialized = true
      console.log('[MoveNet] Model loaded')
    } catch (e) {
      console.warn('[MoveNet] Failed to load model:', e)
      this.initialized = true // 标记为已初始化，使用模拟结果
    }
  }

  /**
   * 估计姿态
   */
  async estimate(
    image: HTMLImageElement | HTMLVideoElement
  ): Promise<{ landmarks: PoseLandmark[]; confidence: number } | null> {
    if (!this.model || !this.initialized) {
      return this.mockEstimate()
    }

    try {
      const tf = await import('@tensorflow/tfjs')

      const input = tf.browser.fromPixels(image)
        .resizeBilinear([192, 192])
        .expandDims(0)
        .div(255.0)

      const output = this.model.predict(input) as tf.Tensor
      const data = await output.data()

      input.dispose()
      output.dispose()

      // MoveNet 输出: [1, 1, 17, 3] (y, x, confidence)
      const landmarks: PoseLandmark[] = new Array(33).fill(null).map(() => ({
        x: 0, y: 0, z: 0, visibility: 0,
      }))

      // MoveNet 17点 → MediaPipe 33点 映射
      const mapping: [number, number][] = [
        [0, 0], [11, 11], [12, 12], [13, 13], [14, 14],
        [15, 15], [16, 16], [23, 23], [24, 24],
        [25, 25], [26, 26], [27, 27], [28, 28],
      ]

      let totalConfidence = 0
      for (const [movenetIdx, mpIdx] of mapping) {
        const y = data[movenetIdx * 3]
        const x = data[movenetIdx * 3 + 1]
        const conf = data[movenetIdx * 3 + 2]
        landmarks[mpIdx] = { x, y, z: 0, visibility: conf }
        totalConfidence += conf
      }

      return {
        landmarks,
        confidence: totalConfidence / 17,
      }
    } catch (e) {
      console.error('[MoveNet] Estimation failed:', e)
      return null
    }
  }

  private mockEstimate(): { landmarks: PoseLandmark[]; confidence: number } {
    const landmarks: PoseLandmark[] = new Array(33).fill(null).map(() => ({
      x: 0.5, y: 0.5, z: 0, visibility: 0.1,
    }))
    return { landmarks, confidence: 0.1 }
  }

  dispose(): void {
    this.model = null
    this.initialized = false
  }
}

/**
 * YOLOv8-Pose 姿态估计器
 * 基于 Ultralytics YOLOv8-Pose 模型
 *
 * 模型来源：https://github.com/ultralytics/ultralytics
 * 优势：同时检测人体+关键点，速度极快，精度良好
 * 精度：COCO AP 71.0 (yolov8n-pose)
 */
export class YOLOv8PoseEstimator {
  private session: ort.InferenceSession | null = null
  private inputSize = 640
  private initialized = false
  private modelPath: string

  constructor(modelPath?: string) {
    this.modelPath = modelPath || ''
  }

  async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      ort.env.wasm.numThreads = navigator.hardwareConcurrency || 4

      if (this.modelPath) {
        this.session = await ort.InferenceSession.create(this.modelPath, {
          executionProviders: ['wasm'],
        })
        this.initialized = true
        console.log('[YOLOv8-Pose] Model loaded from:', this.modelPath)
      } else {
        console.warn('[YOLOv8-Pose] No model path provided, using placeholder')
        this.initialized = true
      }
    } catch (e) {
      console.error('[YOLOv8-Pose] Failed to initialize:', e)
    }
  }

  private preprocess(image: HTMLImageElement | HTMLVideoElement): { tensor: ort.Tensor; ratio: number; padX: number; padY: number } {
    const canvas = document.createElement('canvas')
    const imgW = image instanceof HTMLImageElement ? image.naturalWidth : (image as HTMLVideoElement).videoWidth
    const imgH = image instanceof HTMLImageElement ? image.naturalHeight : (image as HTMLVideoElement).videoHeight

    const ratio = Math.min(this.inputSize / imgW, this.inputSize / imgH)
    const newW = Math.round(imgW * ratio)
    const newH = Math.round(imgH * ratio)
    const padX = (this.inputSize - newW) / 2
    const padY = (this.inputSize - newH) / 2

    canvas.width = this.inputSize
    canvas.height = this.inputSize
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = 'rgb(114,114,114)'
    ctx.fillRect(0, 0, this.inputSize, this.inputSize)
    ctx.drawImage(image, padX, padY, newW, newH)

    const imageData = ctx.getImageData(0, 0, this.inputSize, this.inputSize)
    const { data } = imageData

    // NCHW BGR 归一化
    const input = new Float32Array(3 * this.inputSize * this.inputSize)
    const pixCount = this.inputSize * this.inputSize
    for (let i = 0; i < pixCount; i++) {
      input[i] = data[i * 4 + 2] / 255.0                      // B
      input[pixCount + i] = data[i * 4 + 1] / 255.0           // G
      input[2 * pixCount + i] = data[i * 4] / 255.0           // R
    }

    return { tensor: new ort.Tensor('float32', input, [1, 3, this.inputSize, this.inputSize]), ratio, padX, padY }
  }

  async estimate(
    image: HTMLImageElement | HTMLVideoElement
  ): Promise<{ landmarks: PoseLandmark[]; confidence: number } | null> {
    if (!this.session || !this.initialized) {
      return this.mockEstimate()
    }

    try {
      const { tensor, ratio, padX, padY } = this.preprocess(image)
      const results = await this.session.run({ images: tensor })

      const output = results.output0 || results[Object.keys(results)[0]]
      if (!output) return null

      const data = output.data as Float32Array
      const dims = output.dims // [1, 56, 8400]
      const numDetections = dims[2]

      // 找到置信度最高的检测框
      let bestConf = 0
      let bestIdx = 0
      for (let i = 0; i < numDetections; i++) {
        const conf = data[4 * numDetections + i]
        if (conf > bestConf) { bestConf = conf; bestIdx = i }
      }
      if (bestConf < 0.3) return null

      const landmarks: PoseLandmark[] = new Array(33).fill(null).map(() => ({
        x: 0, y: 0, z: 0, visibility: 0,
      }))

      // YOLOv8 17点 → MediaPipe 33点
      const yoloToMp: [number, number][] = [
        [0, 0], [1, 2], [2, 1], [3, 7], [4, 8],
        [5, 11], [6, 12], [7, 13], [8, 14],
        [9, 15], [10, 16], [11, 23], [12, 24],
        [13, 25], [14, 26], [15, 27], [16, 28],
      ]

      const imgW = image instanceof HTMLImageElement ? image.naturalWidth : (image as HTMLVideoElement).videoWidth
      const imgH = image instanceof HTMLImageElement ? image.naturalHeight : (image as HTMLVideoElement).videoHeight

      for (const [yoloIdx, mpIdx] of yoloToMp) {
        const x = data[(4 + yoloIdx * 3) * numDetections + bestIdx]
        const y = data[(4 + yoloIdx * 3 + 1) * numDetections + bestIdx]
        const conf = data[(4 + yoloIdx * 3 + 2) * numDetections + bestIdx]

        const origX = (x * this.inputSize - padX) / ratio
        const origY = (y * this.inputSize - padY) / ratio

        landmarks[mpIdx] = {
          x: origX / imgW,
          y: origY / imgH,
          z: 0,
          visibility: conf,
        }
      }

      return { landmarks, confidence: bestConf }
    } catch (e) {
      console.error('[YOLOv8-Pose] Estimation failed:', e)
      return null
    }
  }

  private mockEstimate(): { landmarks: PoseLandmark[]; confidence: number } {
    const landmarks: PoseLandmark[] = new Array(33).fill(null).map(() => ({
      x: 0.5, y: 0.5, z: 0, visibility: 0.1,
    }))
    return { landmarks, confidence: 0.1 }
  }

  dispose(): void {
    this.session?.release()
    this.session = null
    this.initialized = false
  }
}
