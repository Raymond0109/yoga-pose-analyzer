/**
 * 体式坐标验证脚本
 * 运行: npx ts-node scripts/verify-poses.ts
 */

import { STANDARD_POSE_DATABASE, getStandardPoseData } from '../src/core/comparison/StandardPoseDB'

// 人体比例参考值 (肩宽=1.0)
const BODY_RATIOS = {
  shoulderWidth: 1.0,
  headHeight: 0.15,        // 头高约0.15肩宽
  torsoLength: 0.5,        // 躯干长度约0.5肩宽
  upperArmLength: 0.35,    // 上臂约0.35肩宽
  forearmLength: 0.3,      // 前臂约0.3肩宽
  upperLegLength: 0.5,     // 大腿约0.5肩宽
  lowerLegLength: 0.45,    // 小腿约0.45肩宽
  hipWidth: 0.2,           // 髋宽约0.2肩宽
}

// 常用10个体式
const COMMON_POSES = [
  'tadasana', 'virabhadrasana_ii', 'trikonasana', 'adho_mukha_svanasana',
  'vrksasana', 'utkatasana', 'bhujangasana', 'setu_bandhasana', 'plank', 'navasana'
]

interface ValidationResult {
  poseId: string
  poseName: string
  issues: string[]
  warnings: string[]
}

function validatePose(poseId: string): ValidationResult {
  const pose = getStandardPoseData(poseId)
  if (!pose) {
    return { poseId, poseName: 'Unknown', issues: ['体式不存在'], warnings: [] }
  }

  const result: ValidationResult = {
    poseId,
    poseName: pose.nameCN,
    issues: [],
    warnings: []
  }

  const lm = pose.landmarks

  // 检查1: 左右对称性 (除了扭转体式)
  const leftShoulder = lm[11]
  const rightShoulder = lm[12]
  const leftHip = lm[23]
  const rightHip = lm[24]

  // 左右肩高度差
  const shoulderHeightDiff = Math.abs(leftShoulder.y - rightShoulder.y)
  if (shoulderHeightDiff > 0.15) {
    result.warnings.push(`左右肩高度差过大: ${shoulderHeightDiff.toFixed(3)}`)
  }

  // 左右髋高度差
  const hipHeightDiff = Math.abs(leftHip.y - rightHip.y)
  if (hipHeightDiff > 0.1) {
    result.warnings.push(`左右髋高度差过大: ${hipHeightDiff.toFixed(3)}`)
  }

  // 检查2: 骨骼长度合理性
  const leftUpperArm = Math.sqrt(
    (lm[11].x - lm[13].x) ** 2 + (lm[11].y - lm[13].y) ** 2 + (lm[11].z - lm[13].z) ** 2
  )
  const leftForearm = Math.sqrt(
    (lm[13].x - lm[15].x) ** 2 + (lm[13].y - lm[15].y) ** 2 + (lm[13].z - lm[15].z) ** 2
  )

  if (leftUpperArm < 0.15 || leftUpperArm > 0.6) {
    result.issues.push(`左上臂长度异常: ${leftUpperArm.toFixed(3)} (期望0.2-0.5)`)
  }

  if (leftForearm < 0.1 || leftForearm > 0.5) {
    result.issues.push(`左前臂长度异常: ${leftForearm.toFixed(3)} (期望0.15-0.4)`)
  }

  // 检查3: 腿部长度
  const leftUpperLeg = Math.sqrt(
    (lm[23].x - lm[25].x) ** 2 + (lm[23].y - lm[25].y) ** 2 + (lm[23].z - lm[25].z) ** 2
  )
  const leftLowerLeg = Math.sqrt(
    (lm[25].x - lm[27].x) ** 2 + (lm[25].y - lm[27].y) ** 2 + (lm[25].z - lm[27].z) ** 2
  )

  if (leftUpperLeg < 0.2 || leftUpperLeg > 0.7) {
    result.issues.push(`左大腿长度异常: ${leftUpperLeg.toFixed(3)} (期望0.3-0.6)`)
  }

  if (leftLowerLeg < 0.15 || leftLowerLeg > 0.6) {
    result.issues.push(`左小腿长度异常: ${leftLowerLeg.toFixed(3)} (期望0.2-0.5)`)
  }

  // 检查4: 脊柱长度
  const spineLength = Math.sqrt(
    (lm[0].x - ((lm[23].x + lm[24].x) / 2)) ** 2 +
    (lm[0].y - ((lm[23].y + lm[24].y) / 2)) ** 2 +
    (lm[0].z - ((lm[23].z + lm[24].z) / 2)) ** 2
  )

  if (spineLength < 0.3 || spineLength > 1.2) {
    result.warnings.push(`脊柱长度异常: ${spineLength.toFixed(3)} (期望0.5-1.0)`)
  }

  // 检查5: 关键点位置合理性
  // 鼻子应该在肩膀上方
  const noseY = lm[0].y
  const shoulderAvgY = (lm[11].y + lm[12].y) / 2
  if (noseY < shoulderAvgY) {
    result.warnings.push(`鼻子位置低于肩膀`)
  }

  // 检查6: z轴深度合理性
  const noseZ = lm[0].z
  const hipAvgZ = (lm[23].z + lm[24].z) / 2
  if (Math.abs(noseZ - hipAvgZ) > 0.5) {
    result.warnings.push(`头部与髋部z轴距离过大: ${Math.abs(noseZ - hipAvgZ).toFixed(3)}`)
  }

  return result
}

// 运行验证
console.log('=== 瑜伽体式坐标验证报告 ===\n')

const results: ValidationResult[] = []

for (const poseId of COMMON_POSES) {
  const result = validatePose(poseId)
  results.push(result)
}

// 输出结果
for (const result of results) {
  console.log(`\n【${result.poseName}】 (${result.poseId})`)

  if (result.issues.length === 0 && result.warnings.length === 0) {
    console.log('  ✓ 验证通过')
  } else {
    if (result.issues.length > 0) {
      console.log('  ✗ 问题:')
      result.issues.forEach(i => console.log(`    - ${i}`))
    }
    if (result.warnings.length > 0) {
      console.log('  ⚠ 警告:')
      result.warnings.forEach(w => console.log(`    - ${w}`))
    }
  }
}

// 统计
const passCount = results.filter(r => r.issues.length === 0).length
const warningCount = results.filter(r => r.warnings.length > 0).length

console.log(`\n=== 验证统计 ===`)
console.log(`总数量: ${results.length}`)
console.log(`通过: ${passCount}`)
console.log(`有问题: ${results.length - passCount}`)
console.log(`有警告: ${warningCount}`)
