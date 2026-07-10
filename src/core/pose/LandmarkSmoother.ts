import type { PoseLandmark } from '@/types/pose'

/**
 * One Euro Filter — 自适应低通滤波器
 * 论文: https://cristal.univ-lille.fr/~casiez/1euro/
 */
class OneEuroFilter {
  private x = 0
  private dx = 0
  private initialized = false

  constructor(
    private minCutoff: number = 1.0,
    private beta: number = 0.007,
    private dCutoff: number = 1.0
  ) {}

  filter(value: number, dt: number): number {
    if (!this.initialized) {
      this.x = value
      this.dx = 0
      this.initialized = true
      return value
    }
    if (dt <= 0) return this.x

    const alphaD = this.smoothingFactor(dt, this.dCutoff)
    const dx = (value - this.x) / dt
    this.dx = alphaD * dx + (1 - alphaD) * this.dx

    const cutoff = this.minCutoff + this.beta * Math.abs(this.dx)
    const alpha = this.smoothingFactor(dt, cutoff)
    this.x = alpha * value + (1 - alpha) * this.x

    return this.x
  }

  private smoothingFactor(dt: number, cutoff: number): number {
    const tau = 1.0 / (2 * Math.PI * cutoff)
    return 1.0 / (1.0 + tau / dt)
  }

  reset(): void {
    this.initialized = false
    this.x = 0
    this.dx = 0
  }
}

/**
 * 多关节 One Euro Filter 管理器
 */
class JointFilterBank {
  private filters: Map<string, OneEuroFilter[]> = new Map()

  constructor(
    private minCutoff: number,
    private beta: number,
    private dCutoff: number
  ) {}

  filter(index: number, x: number, y: number, z: number, dt: number): { x: number; y: number; z: number } {
    const key = `j${index}`
    if (!this.filters.has(key)) {
      this.filters.set(key, [
        new OneEuroFilter(this.minCutoff, this.beta, this.dCutoff),
        new OneEuroFilter(this.minCutoff, this.beta, this.dCutoff),
        new OneEuroFilter(this.minCutoff, this.beta, this.dCutoff),
      ])
    }

    const [fx, fy, fz] = this.filters.get(key)!
    return {
      x: fx.filter(x, dt),
      y: fy.filter(y, dt),
      z: fz.filter(z, dt),
    }
  }

  reset(): void {
    this.filters.forEach((f) => f.forEach((ff) => ff.reset()))
  }
}

// ============================================================

interface SmootherConfig {
  minCutoff: number
  beta: number
  dCutoff: number
  historySize: number
  minConfidence: number
  jumpThreshold: number
  /** 关键帧锁定：静止检测阈值 (归一化坐标位移) */
  lockThreshold: number
  /** 关键帧锁定：需要连续静止多少帧才锁定 */
  lockFrameCount: number
  /** 关键帧锁定：解锁阈值 (比锁定阈值大，避免频繁切换) */
  unlockThreshold: number
}

interface FrameData {
  landmarks: PoseLandmark[]
  timestamp: number
  confidence: number
}

/** 平滑器运行状态 */
export type SmootherState = 'tracking' | 'locked'

const DEFAULT_CONFIG: SmootherConfig = {
  minCutoff: 0.8,
  beta: 0.01,
  dCutoff: 1.0,
  historySize: 5,
  minConfidence: 0.3,
  jumpThreshold: 0.15,
  lockThreshold: 0.008,
  lockFrameCount: 4,
  unlockThreshold: 0.025,
}

export class LandmarkSmoother {
  private config: SmootherConfig
  private filterBank: JointFilterBank
  private history: FrameData[] = []
  private lastGoodLandmarks: PoseLandmark[] | null = null
  private lastTimestamp: number = 0

  // 关键帧锁定状态
  private state: SmootherState = 'tracking'
  private lockedLandmarks: PoseLandmark[] | null = null
  private staticFrameCount = 0

  constructor(config?: Partial<SmootherConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.filterBank = new JointFilterBank(
      this.config.minCutoff,
      this.config.beta,
      this.config.dCutoff
    )
  }

  updateConfig(patch: Partial<Pick<SmootherConfig, 'minCutoff' | 'beta'>>): void {
    if (patch.minCutoff !== undefined) this.config.minCutoff = patch.minCutoff
    if (patch.beta !== undefined) this.config.beta = patch.beta
    this.filterBank = new JointFilterBank(
      this.config.minCutoff,
      this.config.beta,
      this.config.dCutoff
    )
  }

  smooth(landmarks: PoseLandmark[], timestamp: number): PoseLandmark[] {
    const dt = this.lastTimestamp > 0 ? Math.max(0.001, (timestamp - this.lastTimestamp) / 1000) : 0.033
    this.lastTimestamp = timestamp

    const confidence = this.calculateConfidence(landmarks)

    // 低置信度 → 使用上一帧
    if (confidence < this.config.minConfidence && this.lastGoodLandmarks) {
      this.history.push({ landmarks, timestamp, confidence })
      if (this.history.length > this.config.historySize) this.history.shift()
      return this.lastGoodLandmarks.map((lm) => ({ ...lm }))
    }

    // 跳帧检测
    if (this.detectJump(landmarks) && this.lastGoodLandmarks) {
      this.history.push({ landmarks, timestamp, confidence })
      if (this.history.length > this.config.historySize) this.history.shift()
      return this.lastGoodLandmarks.map((lm) => ({ ...lm }))
    }

    // 关键帧锁定逻辑
    const lockResult = this.handleKeyframeLock(landmarks, dt)
    if (lockResult) return lockResult

    // 正常 One Euro 滤波
    const smoothed = landmarks.map((lm, i) => {
      const filtered = this.filterBank.filter(i, lm.x, lm.y, lm.z, dt)
      return {
        x: filtered.x,
        y: filtered.y,
        z: filtered.z,
        visibility: lm.visibility,
      }
    })

    this.lastGoodLandmarks = smoothed.map((lm) => ({ ...lm }))
    this.history.push({ landmarks: smoothed, timestamp, confidence })
    if (this.history.length > this.config.historySize) this.history.shift()

    return smoothed
  }

  /** 关键帧锁定处理 */
  private handleKeyframeLock(landmarks: PoseLandmark[], _dt: number): PoseLandmark[] | null {
    const movement = this.history.length > 0
      ? this.avgDisplacement(landmarks, this.history[this.history.length - 1].landmarks)
      : 999

    if (this.state === 'locked') {
      // 已锁定：检查是否需要解锁
      if (movement > this.config.unlockThreshold) {
        this.state = 'tracking'
        this.staticFrameCount = 0
        this.lockedLandmarks = null
        return null // 继续正常滤波
      }
      // 保持锁定
      return this.lockedLandmarks!.map((lm) => ({ ...lm }))
    }

    // tracking 状态：检查是否应该锁定
    if (movement < this.config.lockThreshold) {
      this.staticFrameCount++
      if (this.staticFrameCount >= this.config.lockFrameCount) {
        // 达到锁定条件
        this.state = 'locked'
        this.lockedLandmarks = (this.lastGoodLandmarks ?? landmarks).map((lm) => ({ ...lm }))
        return this.lockedLandmarks
      }
    } else {
      this.staticFrameCount = 0
    }

    return null
  }

  private calculateConfidence(landmarks: PoseLandmark[]): number {
    if (!landmarks || landmarks.length === 0) return 0

    const avgVis = landmarks.reduce((s, lm) => s + (lm.visibility ?? 0.5), 0) / landmarks.length

    const core = [11, 12, 23, 24, 25, 26]
    const coreOk = core.filter((i) => landmarks[i] && (landmarks[i].visibility ?? 0) > 0.3).length / core.length

    let continuity = 1.0
    if (this.history.length > 0) {
      const last = this.history[this.history.length - 1].landmarks
      const disp = this.avgDisplacement(landmarks, last)
      continuity = Math.max(0, 1 - disp * 5)
    }

    return avgVis * 0.3 + coreOk * 0.4 + continuity * 0.3
  }

  private avgDisplacement(a: PoseLandmark[], b: PoseLandmark[]): number {
    const joints = [11, 12, 13, 14, 23, 24, 25, 26]
    let total = 0
    let cnt = 0
    for (const i of joints) {
      if (a[i] && b[i]) {
        const dx = a[i].x - b[i].x
        const dy = a[i].y - b[i].y
        total += Math.sqrt(dx * dx + dy * dy)
        cnt++
      }
    }
    return cnt > 0 ? total / cnt : 0
  }

  private detectJump(landmarks: PoseLandmark[]): boolean {
    if (this.history.length < 2) return false
    const last = this.history[this.history.length - 1].landmarks
    return this.avgDisplacement(landmarks, last) > this.config.jumpThreshold
  }

  getLastConfidence(): number {
    if (this.history.length === 0) return 0
    return this.history[this.history.length - 1].confidence
  }

  getState(): SmootherState {
    return this.state
  }

  reset(): void {
    this.history = []
    this.lastGoodLandmarks = null
    this.lastTimestamp = 0
    this.filterBank.reset()
    this.state = 'tracking'
    this.lockedLandmarks = null
    this.staticFrameCount = 0
  }
}
