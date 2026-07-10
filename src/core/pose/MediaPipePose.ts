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

export class MediaPipePose {
  private landmarker: PoseLandmarker | null = null
  private smoother: LandmarkSmoother
  private initialized = false

  constructor() {
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
      minPoseDetectionConfidence: 0.5,
      minPosePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    })

    this.initialized = true
  }

  estimate(
    image: HTMLVideoElement | HTMLImageElement | ImageData,
    timestamp: number
  ): PoseResult | null {
    if (!this.landmarker || !this.initialized) return null

    let result: PoseLandmarkerResult
    try {
      result = this.landmarker.detectForVideo(image, timestamp)
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

    const smoothed = this.smoother.smooth(rawLandmarks, timestamp)
    const confidence = this.smoother.getLastConfidence()

    return {
      landmarks: smoothed,
      worldLandmarks,
      timestamp,
      confidence,
    }
  }

  dispose(): void {
    this.landmarker?.close()
    this.landmarker = null
    this.initialized = false
  }
}
