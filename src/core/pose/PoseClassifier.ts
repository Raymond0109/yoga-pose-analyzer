import type { JointAngle, PoseLandmark } from '@/types/pose'
import {
  STANDARD_POSE_DATABASE,
  normalizeLandmarks,
  calculatePoseDistance,
  type StandardPoseData,
} from '@/core/comparison/StandardPoseDB'

/** 体式识别结果 */
export interface ClassificationResult {
  poseId: string
  confidence: number
  matchedAngles: number
  totalAngles: number
  /** 位置匹配分数 (0-1, 越小越匹配) */
  positionScore?: number
}

/** 角度匹配规则 */
interface AngleRule {
  joint: string
  minAngle: number
  maxAngle: number
  weight: number
}

/** 体式规则定义 */
interface PoseRule {
  id: string
  nameCN: string
  rules: AngleRule[]
}

const POSE_RULES: PoseRule[] = [
  {
    id: 'tadasana',
    nameCN: '山式',
    rules: [
      { joint: 'left_knee', minAngle: 165, maxAngle: 180, weight: 1.5 },
      { joint: 'right_knee', minAngle: 165, maxAngle: 180, weight: 1.5 },
      { joint: 'left_hip', minAngle: 165, maxAngle: 180, weight: 1.0 },
      { joint: 'right_hip', minAngle: 165, maxAngle: 180, weight: 1.0 },
      { joint: 'left_shoulder', minAngle: 160, maxAngle: 180, weight: 1.0 },
      { joint: 'right_shoulder', minAngle: 160, maxAngle: 180, weight: 1.0 },
    ],
  },
  {
    id: 'virabhadrasana_ii',
    nameCN: '战士二式',
    rules: [
      { joint: 'left_knee', minAngle: 70, maxAngle: 110, weight: 2.0 },
      { joint: 'right_knee', minAngle: 160, maxAngle: 180, weight: 1.5 },
      { joint: 'left_shoulder', minAngle: 80, maxAngle: 100, weight: 1.5 },
      { joint: 'right_shoulder', minAngle: 80, maxAngle: 100, weight: 1.5 },
    ],
  },
  {
    id: 'trikonasana',
    nameCN: '三角式',
    rules: [
      { joint: 'left_knee', minAngle: 165, maxAngle: 180, weight: 1.0 },
      { joint: 'right_knee', minAngle: 165, maxAngle: 180, weight: 1.0 },
      { joint: 'left_hip', minAngle: 100, maxAngle: 140, weight: 1.5 },
      { joint: 'right_hip', minAngle: 100, maxAngle: 140, weight: 1.5 },
      { joint: 'left_shoulder', minAngle: 160, maxAngle: 180, weight: 1.0 },
      { joint: 'right_shoulder', minAngle: 30, maxAngle: 90, weight: 1.0 },
    ],
  },
  {
    id: 'adho_mukha_svanasana',
    nameCN: '下犬式',
    rules: [
      { joint: 'left_knee', minAngle: 165, maxAngle: 180, weight: 1.0 },
      { joint: 'right_knee', minAngle: 165, maxAngle: 180, weight: 1.0 },
      { joint: 'left_hip', minAngle: 70, maxAngle: 110, weight: 2.0 },
      { joint: 'right_hip', minAngle: 70, maxAngle: 110, weight: 2.0 },
      { joint: 'left_shoulder', minAngle: 150, maxAngle: 180, weight: 1.5 },
      { joint: 'right_shoulder', minAngle: 150, maxAngle: 180, weight: 1.5 },
    ],
  },
  {
    id: 'vrksasana',
    nameCN: '树式',
    rules: [
      { joint: 'left_knee', minAngle: 165, maxAngle: 180, weight: 1.5 },
      { joint: 'right_knee', minAngle: 20, maxAngle: 80, weight: 2.0 },
      { joint: 'left_shoulder', minAngle: 150, maxAngle: 180, weight: 1.0 },
      { joint: 'right_shoulder', minAngle: 150, maxAngle: 180, weight: 1.0 },
    ],
  },
  {
    id: 'utkatasana',
    nameCN: '幻椅式',
    rules: [
      { joint: 'left_knee', minAngle: 70, maxAngle: 110, weight: 2.0 },
      { joint: 'right_knee', minAngle: 70, maxAngle: 110, weight: 2.0 },
      { joint: 'left_hip', minAngle: 70, maxAngle: 110, weight: 1.5 },
      { joint: 'right_hip', minAngle: 70, maxAngle: 110, weight: 1.5 },
      { joint: 'left_shoulder', minAngle: 160, maxAngle: 180, weight: 1.0 },
      { joint: 'right_shoulder', minAngle: 160, maxAngle: 180, weight: 1.0 },
    ],
  },
  {
    id: 'balasana',
    nameCN: '婴儿式',
    rules: [
      { joint: 'left_knee', minAngle: 70, maxAngle: 110, weight: 1.5 },
      { joint: 'right_knee', minAngle: 70, maxAngle: 110, weight: 1.5 },
      { joint: 'left_hip', minAngle: 20, maxAngle: 70, weight: 2.0 },
      { joint: 'right_hip', minAngle: 20, maxAngle: 70, weight: 2.0 },
      { joint: 'left_shoulder', minAngle: 150, maxAngle: 180, weight: 1.0 },
      { joint: 'right_shoulder', minAngle: 150, maxAngle: 180, weight: 1.0 },
    ],
  },
  {
    id: 'bhujangasana',
    nameCN: '眼镜蛇式',
    rules: [
      { joint: 'left_knee', minAngle: 165, maxAngle: 180, weight: 1.0 },
      { joint: 'right_knee', minAngle: 165, maxAngle: 180, weight: 1.0 },
      { joint: 'left_elbow', minAngle: 130, maxAngle: 170, weight: 1.5 },
      { joint: 'right_elbow', minAngle: 130, maxAngle: 170, weight: 1.5 },
      { joint: 'left_shoulder', minAngle: 60, maxAngle: 120, weight: 2.0 },
      { joint: 'right_shoulder', minAngle: 60, maxAngle: 120, weight: 2.0 },
    ],
  },
  {
    id: 'navasana',
    nameCN: '船式',
    rules: [
      { joint: 'left_knee', minAngle: 165, maxAngle: 180, weight: 1.0 },
      { joint: 'right_knee', minAngle: 165, maxAngle: 180, weight: 1.0 },
      { joint: 'left_hip', minAngle: 30, maxAngle: 70, weight: 2.0 },
      { joint: 'right_hip', minAngle: 30, maxAngle: 70, weight: 2.0 },
      { joint: 'left_shoulder', minAngle: 30, maxAngle: 80, weight: 1.5 },
      { joint: 'right_shoulder', minAngle: 30, maxAngle: 80, weight: 1.5 },
    ],
  },
  {
    id: 'savasana',
    nameCN: '挺尸式',
    rules: [
      { joint: 'left_knee', minAngle: 170, maxAngle: 180, weight: 1.0 },
      { joint: 'right_knee', minAngle: 170, maxAngle: 180, weight: 1.0 },
      { joint: 'left_hip', minAngle: 170, maxAngle: 180, weight: 1.0 },
      { joint: 'right_hip', minAngle: 170, maxAngle: 180, weight: 1.0 },
      { joint: 'left_shoulder', minAngle: 170, maxAngle: 180, weight: 1.0 },
      { joint: 'right_shoulder', minAngle: 170, maxAngle: 180, weight: 1.0 },
    ],
  },
  // 新增体式规则
  {
    id: 'virabhadrasana_i',
    nameCN: '战士一式',
    rules: [
      { joint: 'left_knee', minAngle: 70, maxAngle: 110, weight: 2.0 },
      { joint: 'right_knee', minAngle: 165, maxAngle: 180, weight: 1.5 },
      { joint: 'left_shoulder', minAngle: 165, maxAngle: 180, weight: 1.5 },
      { joint: 'right_shoulder', minAngle: 165, maxAngle: 180, weight: 1.5 },
    ],
  },
  {
    id: 'virabhadrasana_iii',
    nameCN: '战士三式',
    rules: [
      { joint: 'left_knee', minAngle: 165, maxAngle: 180, weight: 1.5 },
      { joint: 'right_knee', minAngle: 165, maxAngle: 180, weight: 1.5 },
      { joint: 'left_hip', minAngle: 160, maxAngle: 180, weight: 1.5 },
      { joint: 'right_hip', minAngle: 160, maxAngle: 180, weight: 1.5 },
      { joint: 'left_shoulder', minAngle: 160, maxAngle: 180, weight: 1.0 },
      { joint: 'right_shoulder', minAngle: 160, maxAngle: 180, weight: 1.0 },
    ],
  },
  {
    id: 'setu_bandhasana',
    nameCN: '桥式',
    rules: [
      { joint: 'left_knee', minAngle: 80, maxAngle: 120, weight: 2.0 },
      { joint: 'right_knee', minAngle: 80, maxAngle: 120, weight: 2.0 },
      { joint: 'left_hip', minAngle: 100, maxAngle: 140, weight: 1.5 },
      { joint: 'right_hip', minAngle: 100, maxAngle: 140, weight: 1.5 },
      { joint: 'left_shoulder', minAngle: 160, maxAngle: 180, weight: 1.0 },
      { joint: 'right_shoulder', minAngle: 160, maxAngle: 180, weight: 1.0 },
    ],
  },
  {
    id: 'ustrasana',
    nameCN: '骆驼式',
    rules: [
      { joint: 'left_knee', minAngle: 80, maxAngle: 120, weight: 2.0 },
      { joint: 'right_knee', minAngle: 80, maxAngle: 120, weight: 2.0 },
      { joint: 'left_hip', minAngle: 140, maxAngle: 180, weight: 1.5 },
      { joint: 'right_hip', minAngle: 140, maxAngle: 180, weight: 1.5 },
      { joint: 'left_shoulder', minAngle: 110, maxAngle: 150, weight: 1.5 },
      { joint: 'right_shoulder', minAngle: 110, maxAngle: 150, weight: 1.5 },
    ],
  },
  {
    id: 'utthita_parsvakonasana',
    nameCN: '侧角伸展式',
    rules: [
      { joint: 'left_knee', minAngle: 70, maxAngle: 110, weight: 2.0 },
      { joint: 'right_knee', minAngle: 165, maxAngle: 180, weight: 1.5 },
      { joint: 'left_shoulder', minAngle: 100, maxAngle: 140, weight: 1.5 },
      { joint: 'right_shoulder', minAngle: 20, maxAngle: 60, weight: 1.5 },
    ],
  },
  {
    id: 'plank',
    nameCN: '平板式',
    rules: [
      { joint: 'left_knee', minAngle: 165, maxAngle: 180, weight: 1.0 },
      { joint: 'right_knee', minAngle: 165, maxAngle: 180, weight: 1.0 },
      { joint: 'left_hip', minAngle: 165, maxAngle: 180, weight: 1.5 },
      { joint: 'right_hip', minAngle: 165, maxAngle: 180, weight: 1.5 },
      { joint: 'left_elbow', minAngle: 165, maxAngle: 180, weight: 1.5 },
      { joint: 'right_elbow', minAngle: 165, maxAngle: 180, weight: 1.5 },
    ],
  },
  {
    id: 'natarajasana',
    nameCN: '舞王式',
    rules: [
      { joint: 'left_knee', minAngle: 165, maxAngle: 180, weight: 1.5 },
      { joint: 'right_knee', minAngle: 70, maxAngle: 110, weight: 2.0 },
      { joint: 'left_hip', minAngle: 165, maxAngle: 180, weight: 1.5 },
      { joint: 'right_hip', minAngle: 110, maxAngle: 150, weight: 1.5 },
    ],
  },
  {
    id: 'chaturanga',
    nameCN: '鳄鱼式',
    rules: [
      { joint: 'left_knee', minAngle: 165, maxAngle: 180, weight: 1.0 },
      { joint: 'right_knee', minAngle: 165, maxAngle: 180, weight: 1.0 },
      { joint: 'left_elbow', minAngle: 80, maxAngle: 120, weight: 2.0 },
      { joint: 'right_elbow', minAngle: 80, maxAngle: 120, weight: 2.0 },
      { joint: 'left_shoulder', minAngle: 80, maxAngle: 120, weight: 1.5 },
      { joint: 'right_shoulder', minAngle: 80, maxAngle: 120, weight: 1.5 },
    ],
  },
]

export class PoseClassifier {
  /**
   * 基于角度的体式识别
   */
  classifyByAngle(angles: JointAngle[]): ClassificationResult | null {
    const angleMap = new Map(angles.map((a) => [a.joint, a.angle]))
    let bestResult: ClassificationResult | null = null

    for (const pose of POSE_RULES) {
      let totalWeight = 0
      let matchedWeight = 0
      let matchedCount = 0

      for (const rule of pose.rules) {
        const currentAngle = angleMap.get(rule.joint)
        if (currentAngle === undefined) continue

        totalWeight += rule.weight

        if (currentAngle >= rule.minAngle && currentAngle <= rule.maxAngle) {
          matchedWeight += rule.weight
          matchedCount++
        } else {
          const center = (rule.minAngle + rule.maxAngle) / 2
          const range = (rule.maxAngle - rule.minAngle) / 2
          const distance = Math.abs(currentAngle - center)
          const partialScore = Math.max(0, 1 - distance / (range * 3))
          matchedWeight += rule.weight * partialScore * 0.5
        }
      }

      const confidence = totalWeight > 0 ? matchedWeight / totalWeight : 0

      if (!bestResult || confidence > bestResult.confidence) {
        bestResult = {
          poseId: pose.id,
          confidence,
          matchedAngles: matchedCount,
          totalAngles: pose.rules.length,
        }
      }
    }

    if (bestResult && bestResult.confidence < 0.35) return null
    return bestResult
  }

  /**
   * 基于位置的体式识别
   * 使用归一化关键点与标准体式数据库比较
   */
  classifyByPosition(landmarks: PoseLandmark[]): ClassificationResult | null {
    if (!landmarks || landmarks.length < 33) return null

    const normalized = normalizeLandmarks(landmarks)
    let bestResult: ClassificationResult | null = null

    for (const standardPose of STANDARD_POSE_DATABASE) {
      const distance = calculatePoseDistance(normalized, standardPose.landmarks)

      // 距离转置信度 (距离越小置信度越高)
      // 典型距离范围：0.1(非常匹配) - 1.0(不匹配)
      const confidence = Math.max(0, 1 - distance / 0.8)

      if (!bestResult || confidence > bestResult.confidence) {
        bestResult = {
          poseId: standardPose.id,
          confidence,
          matchedAngles: 0,
          totalAngles: 0,
          positionScore: distance,
        }
      }
    }

    if (bestResult && bestResult.confidence < 0.3) return null
    return bestResult
  }

  /**
   * 综合识别：结合角度和位置匹配
   */
  classify(angles: JointAngle[], landmarks?: PoseLandmark[]): ClassificationResult | null {
    const angleResult = this.classifyByAngle(angles)
    const positionResult = landmarks ? this.classifyByPosition(landmarks) : null

    // 如果只有一种结果
    if (!angleResult && !positionResult) return null
    if (!angleResult) return positionResult
    if (!positionResult) return angleResult

    // 两种方法都有的话，综合评分
    // 角度权重0.6，位置权重0.4
    const combinedConfidence = angleResult.confidence * 0.6 + positionResult.confidence * 0.4

    // 如果两个方法识别结果一致，提高置信度
    if (angleResult.poseId === positionResult.poseId) {
      return {
        ...angleResult,
        confidence: Math.min(1, combinedConfidence * 1.2),
        positionScore: positionResult.positionScore,
      }
    }

    // 结果不一致，取置信度高的
    return angleResult.confidence > positionResult.confidence
      ? { ...angleResult, confidence: combinedConfidence }
      : { ...positionResult, confidence: combinedConfidence }
  }
}
