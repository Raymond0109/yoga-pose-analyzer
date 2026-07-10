import type { JointAngle } from '@/types/pose'

/** 体式识别结果 */
export interface ClassificationResult {
  poseId: string
  confidence: number
  matchedAngles: number
  totalAngles: number
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

/**
 * 角度定义 (基于 AngleCalculator 的计算方式):
 * - 膝/肘: 三点夹角，180°=伸直，90°=弯曲
 * - 髋: hip-shoulder-knee，180°=站直，90°=坐姿
 * - 肩: hip-shoulder-elbow，180°=手臂下垂，90°=平举，0°=举过头
 */

const POSE_RULES: PoseRule[] = [
  {
    id: 'tadasana',
    nameCN: '山式',
    rules: [
      { joint: 'left_knee', minAngle: 165, maxAngle: 180, weight: 1.5 },
      { joint: 'right_knee', minAngle: 165, maxAngle: 180, weight: 1.5 },
      { joint: 'left_hip', minAngle: 165, maxAngle: 180, weight: 1.0 },
      { joint: 'right_hip', minAngle: 165, maxAngle: 180, weight: 1.0 },
      { joint: 'left_shoulder', minAngle: 160, maxAngle: 180, weight: 1.0 },  // 手臂下垂
      { joint: 'right_shoulder', minAngle: 160, maxAngle: 180, weight: 1.0 },
    ],
  },
  {
    id: 'virabhadrasana_ii',
    nameCN: '战士二式',
    rules: [
      { joint: 'left_knee', minAngle: 70, maxAngle: 110, weight: 2.0 },
      { joint: 'right_knee', minAngle: 160, maxAngle: 180, weight: 1.5 },
      { joint: 'left_shoulder', minAngle: 80, maxAngle: 100, weight: 1.5 },  // 平举
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
      { joint: 'left_shoulder', minAngle: 160, maxAngle: 180, weight: 1.0 },  // 一手向上
      { joint: 'right_shoulder', minAngle: 30, maxAngle: 90, weight: 1.0 },   // 一手向下
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
      { joint: 'left_shoulder', minAngle: 150, maxAngle: 180, weight: 1.5 },  // 手臂伸直
      { joint: 'right_shoulder', minAngle: 150, maxAngle: 180, weight: 1.5 },
    ],
  },
  {
    id: 'vrksasana',
    nameCN: '树式',
    rules: [
      { joint: 'left_knee', minAngle: 165, maxAngle: 180, weight: 1.5 },   // 支撑腿伸直
      { joint: 'right_knee', minAngle: 20, maxAngle: 80, weight: 2.0 },    // 弯曲腿
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
      { joint: 'left_shoulder', minAngle: 160, maxAngle: 180, weight: 1.0 },  // 手臂上举
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
      { joint: 'left_shoulder', minAngle: 60, maxAngle: 120, weight: 2.0 },   // 手臂支撑
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
]

export class PoseClassifier {
  classify(angles: JointAngle[]): ClassificationResult | null {
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

    if (bestResult && bestResult.confidence < 0.35) {
      return null
    }

    return bestResult
  }

  classifyAll(angles: JointAngle[]): ClassificationResult[] {
    const angleMap = new Map(angles.map((a) => [a.joint, a.angle]))
    const results: ClassificationResult[] = []

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
      results.push({ poseId: pose.id, confidence, matchedAngles: matchedCount, totalAngles: pose.rules.length })
    }

    return results.sort((a, b) => b.confidence - a.confidence)
  }
}
