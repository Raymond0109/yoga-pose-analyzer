import type { JointAngle, PoseDifference } from '@/types/pose'

/** 评分配置 */
interface ScoringConfig {
  /** 角度容差 (度) */
  tolerance: number
  /** 权重 */
  weights: Record<string, number>
  /** 评分等级阈值 */
  thresholds: {
    excellent: number  // ≥90
    good: number       // ≥75
    fair: number       // ≥60
    poor: number       // <60
  }
}

/** 评分结果 */
export interface ScoreResult {
  totalScore: number
  maxScore: number
  percentage: number
  level: 'excellent' | 'good' | 'fair' | 'poor'
  jointScores: JointScore[]
  timestamp: number
}

/** 单个关节评分 */
export interface JointScore {
  joint: string
  jointCN: string
  currentAngle: number
  targetAngle: number
  delta: number
  score: number
  maxScore: number
  percentage: number
  status: 'perfect' | 'good' | 'warning' | 'bad'
  feedback: string
}

/** 评分历史 */
export interface ScoreHistory {
  scores: ScoreResult[]
  maxEntries: number
}

/** 默认配置 */
const DEFAULT_CONFIG: ScoringConfig = {
  tolerance: 15,
  weights: {
    left_knee: 1.5,
    right_knee: 1.5,
    left_hip: 1.2,
    right_hip: 1.2,
    left_shoulder: 1.0,
    right_shoulder: 1.0,
    left_elbow: 0.8,
    right_elbow: 0.8,
  },
  thresholds: {
    excellent: 90,
    good: 75,
    fair: 60,
    poor: 40,
  },
}

/** 关节中文名映射 */
const JOINT_NAMES_CN: Record<string, string> = {
  left_knee: '左膝',
  right_knee: '右膝',
  left_hip: '左髋',
  right_hip: '右髋',
  left_shoulder: '左肩',
  right_shoulder: '右肩',
  left_elbow: '左肘',
  right_elbow: '右肘',
}

export class PoseScorer {
  private config: ScoringConfig
  private history: ScoreHistory

  constructor(config?: Partial<ScoringConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.history = {
      scores: [],
      maxEntries: 100,
    }
  }

  /**
   * 计算实时评分
   * @param currentAngles 当前关节角度
   * @param targetAngles 目标关节角度
   * @returns 评分结果
   */
  calculateScore(
    currentAngles: JointAngle[],
    targetAngles: JointAngle[]
  ): ScoreResult {
    console.log('[PoseScorer] calculateScore called:', {
      currentAnglesCount: currentAngles.length,
      targetAnglesCount: targetAngles.length,
      currentJoints: currentAngles.map(a => a.joint),
      targetJoints: targetAngles.map(a => a.joint),
    })

    const jointScores: JointScore[] = []
    let totalScore = 0
    let maxScore = 0

    // 创建目标角度映射
    const targetMap = new Map(targetAngles.map((a) => [a.joint, a.angle]))

    // 计算每个关节的评分
    for (const current of currentAngles) {
      const target = targetMap.get(current.joint)
      if (target === undefined) {
        console.log('[PoseScorer] No target for joint:', current.joint)
        continue
      }

      const weight = this.config.weights[current.joint] || 1.0
      const delta = Math.abs(current.angle - target)
      const maxJointScore = 100 * weight

      // 计算得分 (delta越小得分越高)
      let score: number
      if (delta <= this.config.tolerance * 0.3) {
        // 完美
        score = maxJointScore
      } else if (delta <= this.config.tolerance) {
        // 良好 - 线性衰减
        const ratio = 1 - (delta - this.config.tolerance * 0.3) / (this.config.tolerance * 0.7)
        score = maxJointScore * (0.7 + 0.3 * ratio)
      } else if (delta <= this.config.tolerance * 2) {
        // 一般 - 更快衰减
        const ratio = 1 - (delta - this.config.tolerance) / this.config.tolerance
        score = maxJointScore * (0.3 + 0.4 * ratio)
      } else {
        // 差
        score = Math.max(0, maxJointScore * 0.3 * Math.exp(-(delta - this.config.tolerance * 2) / 20))
      }

      const percentage = (score / maxJointScore) * 100
      const status = this.getJointStatus(percentage)
      const feedback = this.getJointFeedback(current.joint, delta, current.angle, target)

      jointScores.push({
        joint: current.joint,
        jointCN: JOINT_NAMES_CN[current.joint] || current.joint,
        currentAngle: Math.round(current.angle),
        targetAngle: Math.round(target),
        delta: Math.round(delta),
        score: Math.round(score),
        maxScore: Math.round(maxJointScore),
        percentage: Math.round(percentage),
        status,
        feedback,
      })

      totalScore += score
      maxScore += maxJointScore
    }

    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0
    const level = this.getLevel(percentage)

    console.log('[PoseScorer] Result:', {
      jointScoresCount: jointScores.length,
      totalScore: Math.round(totalScore),
      maxScore: Math.round(maxScore),
      percentage: Math.round(percentage),
      level,
    })

    const result: ScoreResult = {
      totalScore: Math.round(totalScore),
      maxScore: Math.round(maxScore),
      percentage: Math.round(percentage),
      level,
      jointScores,
      timestamp: Date.now(),
    }

    // 添加到历史记录
    this.addToHistory(result)

    return result
  }

  /**
   * 获取关节状态
   */
  private getJointStatus(percentage: number): 'perfect' | 'good' | 'warning' | 'bad' {
    if (percentage >= 95) return 'perfect'
    if (percentage >= 80) return 'good'
    if (percentage >= 60) return 'warning'
    return 'bad'
  }

  /**
   * 获取评分等级
   */
  private getLevel(percentage: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (percentage >= this.config.thresholds.excellent) return 'excellent'
    if (percentage >= this.config.thresholds.good) return 'good'
    if (percentage >= this.config.thresholds.fair) return 'fair'
    return 'poor'
  }

  /**
   * 获取关节反馈信息
   */
  private getJointFeedback(joint: string, delta: number, current: number, target: number): string {
    if (delta < 5) return '完美'

    const jointCN = JOINT_NAMES_CN[joint] || joint
    const direction = current > target ? '过度' : '不足'

    if (delta < 15) {
      return `${jointCN}略微${direction}`
    } else if (delta < 30) {
      return `${jointCN}${direction}，需调整约${Math.round(delta)}°`
    } else {
      return `${jointCN}严重${direction}，需调整约${Math.round(delta)}°`
    }
  }

  /**
   * 添加到历史记录
   */
  private addToHistory(result: ScoreResult): void {
    this.history.scores.push(result)
    if (this.history.scores.length > this.history.maxEntries) {
      this.history.scores.shift()
    }
  }

  /**
   * 获取历史记录
   */
  getHistory(): ScoreHistory {
    return this.history
  }

  /**
   * 获取平均分数
   */
  getAverageScore(lastN?: number): number {
    const scores = lastN
      ? this.history.scores.slice(-lastN)
      : this.history.scores

    if (scores.length === 0) return 0

    const sum = scores.reduce((s, r) => s + r.percentage, 0)
    return Math.round(sum / scores.length)
  }

  /**
   * 获取趋势 (最近N帧的分数变化)
   */
  getTrend(lastN: number = 10): 'improving' | 'stable' | 'declining' {
    const scores = this.history.scores.slice(-lastN)
    if (scores.length < 3) return 'stable'

    const firstHalf = scores.slice(0, Math.floor(scores.length / 2))
    const secondHalf = scores.slice(Math.floor(scores.length / 2))

    const avgFirst = firstHalf.reduce((s, r) => s + r.percentage, 0) / firstHalf.length
    const avgSecond = secondHalf.reduce((s, r) => s + r.percentage, 0) / secondHalf.length

    const diff = avgSecond - avgFirst
    if (diff > 3) return 'improving'
    if (diff < -3) return 'declining'
    return 'stable'
  }

  /**
   * 获取最需要改进的关节
   */
  getWeakestJoints(result: ScoreResult, topN: number = 3): JointScore[] {
    return [...result.jointScores]
      .sort((a, b) => a.percentage - b.percentage)
      .slice(0, topN)
  }

  /**
   * 清除历史记录
   */
  clearHistory(): void {
    this.history.scores = []
  }

  /**
   * 获取颜色 (用于UI显示)
   */
  static getScoreColor(percentage: number): string {
    if (percentage >= 90) return '#52C41A'  // 绿色
    if (percentage >= 75) return '#8BC34A'  // 浅绿
    if (percentage >= 60) return '#F5A623'  // 黄色
    if (percentage >= 40) return '#FF9800'  // 橙色
    return '#FF4D4F'  // 红色
  }

  /**
   * 获取等级颜色
   */
  static getLevelColor(level: string): string {
    switch (level) {
      case 'excellent': return '#52C41A'
      case 'good': return '#8BC34A'
      case 'fair': return '#F5A623'
      case 'poor': return '#FF4D4F'
      default: return '#999'
    }
  }

  /**
   * 获取等级中文名
   */
  static getLevelNameCN(level: string): string {
    switch (level) {
      case 'excellent': return '优秀'
      case 'good': return '良好'
      case 'fair': return '一般'
      case 'poor': return '需改进'
      default: return '未知'
    }
  }
}
