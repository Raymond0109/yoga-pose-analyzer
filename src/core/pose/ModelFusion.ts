/**
 * 多模型投票融合系统
 * 
 * 架构：
 * MediaPipe (主模型) ─┐
 * MoveNet (备选模型) ─┼─→ 投票融合 → 最终结果
 * RTMPose (可选)   ─┘
 * 
 * 融合策略：
 * 1. 关键点级加权投票（按置信度加权）
 * 2. 骨骼段一致性检查
 * 3. 时序平滑
 */

import type { PoseLandmark } from '@/types/pose'

export interface ModelResult {
  landmarks: PoseLandmark[]
  confidence: number
  model: string
}

export interface FusedResult {
  landmarks: PoseLandmark[]
  confidence: number
  modelCounts: Record<string, number>
  agreement: number  // 模型一致性 (0-1)
}

/**
 * 关键点级置信度优先选择
 * 每个关键点选择置信度最高的模型结果（避免不同模型互相干扰）
 */
function confidenceBasedSelect(
  results: ModelResult[],
  landmarkIndex: number
): PoseLandmark {
  let bestLm: PoseLandmark | null = null
  let bestScore = -1

  for (const result of results) {
    const lm = result.landmarks[landmarkIndex]
    if (!lm || lm.visibility < 0.1) continue

    // 综合分数 = 关键点置信度 × 模型置信度
    const score = lm.visibility * result.confidence
    if (score > bestScore) {
      bestScore = score
      bestLm = lm
    }
  }

  return bestLm || { x: 0, y: 0, z: 0, visibility: 0 }
}

/**
 * 计算两个关键点之间的距离
 */
function keypointDistance(a: PoseLandmark, b: PoseLandmark): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  const dz = a.z - b.z
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

/**
 * 检查骨骼段一致性
 * 如果两个模型对同一骨骼段的估计差异太大，降低一致性分数
 */
function checkSkeletonConsistency(results: ModelResult[]): number {
  if (results.length < 2) return 1

  // 骨骼连接定义
  const connections: [number, number][] = [
    [11, 13], [13, 15], // 左臂
    [12, 14], [14, 16], // 右臂
    [23, 25], [25, 27], // 左腿
    [24, 26], [26, 28], // 右腿
    [11, 12],           // 肩
    [23, 24],           // 髋
  ]

  let totalConsistency = 0
  let checkedPairs = 0

  for (let i = 0; i < results.length; i++) {
    for (let j = i + 1; j < results.length; j++) {
      let pairDiff = 0
      let validKeypoints = 0

      for (const [a, b] of connections) {
        const lmA_i = results[i].landmarks[a]
        const lmB_i = results[i].landmarks[b]
        const lmA_j = results[j].landmarks[a]
        const lmB_j = results[j].landmarks[b]

        if (!lmA_i || !lmB_i || !lmA_j || !lmB_j) continue
        if (lmA_i.visibility < 0.3 || lmA_j.visibility < 0.3) continue

        // 计算骨骼长度差异
        const len_i = keypointDistance(lmA_i, lmB_i)
        const len_j = keypointDistance(lmA_j, lmB_j)
        const lenDiff = Math.abs(len_i - len_j) / Math.max(len_i, len_j, 0.01)

        pairDiff += lenDiff
        validKeypoints++
      }

      if (validKeypoints > 0) {
        totalConsistency += 1 - Math.min(pairDiff / validKeypoints, 1)
        checkedPairs++
      }
    }
  }

  return checkedPairs > 0 ? totalConsistency / checkedPairs : 1
}

/**
 * 多模型投票融合
 */
export function fuseModelResults(results: ModelResult[]): FusedResult | null {
  // 过滤无效结果
  const validResults = results.filter(r => 
    r.confidence > 0.1 && 
    r.landmarks.some(lm => lm.visibility > 0.2)
  )

  if (validResults.length === 0) return null
  if (validResults.length === 1) {
    return {
      landmarks: validResults[0].landmarks,
      confidence: validResults[0].confidence,
      modelCounts: { [validResults[0].model]: 1 },
      agreement: 1,
    }
  }

  // 用有效结果替换原始结果
  results = validResults

  // 关键点级融合（置信度优先选择，避免模型互相干扰）
  const fusedLandmarks: PoseLandmark[] = []
  for (let i = 0; i < 33; i++) {
    fusedLandmarks.push(confidenceBasedSelect(results, i))
  }

  // 计算模型一致性
  const agreement = checkSkeletonConsistency(results)

  // 统计模型使用次数
  const modelCounts: Record<string, number> = {}
  for (const r of results) {
    modelCounts[r.model] = (modelCounts[r.model] || 0) + 1
  }

  // 综合置信度
  const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length

  return {
    landmarks: fusedLandmarks,
    confidence: avgConfidence * agreement,  // 一致性作为置信度乘数
    modelCounts,
    agreement,
  }
}

/**
 * 并行运行多个模型并融合
 */
export async function runMultiModelPipeline(
  image: HTMLImageElement | HTMLVideoElement,
  estimators: Array<{
    name: string
    estimate: (img: HTMLImageElement | HTMLVideoElement) => Promise<ModelResult | null>
  }>
): Promise<FusedResult | null> {
  // 并行运行所有模型
  const results = await Promise.allSettled(
    estimators.map(async (est) => {
      try {
        return await est.estimate(image)
      } catch {
        return null
      }
    })
  )

  // 收集成功的结果
  const successfulResults: ModelResult[] = []
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      successfulResults.push(result.value)
    }
  }

  return fuseModelResults(successfulResults)
}
