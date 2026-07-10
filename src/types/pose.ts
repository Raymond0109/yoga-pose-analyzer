/** MediaPipe 姿态关键点 */
export interface PoseLandmark {
  x: number
  y: number
  z: number
  visibility: number
}

/** 姿态估计结果 */
export interface PoseResult {
  landmarks: PoseLandmark[]
  worldLandmarks: PoseLandmark[]
  timestamp: number
  /** 帧置信度 (0-1)，基于 visibility + 连续性 + 核心关节有效性 */
  confidence?: number
}

/** 关节角度 */
export interface JointAngle {
  joint: string
  angle: number
  axis: 'flexion' | 'abduction' | 'rotation'
}

/** 姿态差异 */
export interface PoseDifference {
  joint: string
  current: number
  target: number
  delta: number
  severity: 'good' | 'warning' | 'bad'
  suggestion: string
}

/** 对比结果 */
export interface ComparisonResult {
  poseId: string
  overallScore: number
  differences: PoseDifference[]
  timestamp: number
}

/** 标准体式 */
export interface StandardPose {
  id: string
  nameCN: string
  nameEN: string
  nameSanskrit: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  category: string
  description: string
  benefits: string[]
  targetAngles: JointAngle[]
  tolerance: number
  keyPoints: {
    joint: string
    idealAngle: number
    description: string
  }[]
  commonMistakes: string[]
}

/** 矫正建议 */
export interface CorrectionAdvice {
  id: string
  joint: string
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  action: string
  icon: string
}
