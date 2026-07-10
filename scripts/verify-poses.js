#!/usr/bin/env node

/**
 * 体式坐标验证脚本
 * 直接从文件中提取lm()坐标进行验证
 */

const fs = require('fs')
const path = require('path')

const DB_PATH = path.join(__dirname, '../src/core/comparison/StandardPoseDB.ts')

// 常用10个体式 + 新增10个体式
const COMMON_POSES = [
  'tadasana', 'virabhadrasana_ii', 'trikonasana', 'adho_mukha_svanasana',
  'vrksasana', 'utkatasana', 'bhujangasana', 'setu_bandhasana', 'plank', 'navasana',
  // 新增10个
  'bharadvajasana_i', 'padangusthasana', 'dhanurasana', 'chakravakasana',
  'gomukhasana', 'ardha_pincha_mayurasana', 'garudasana', 'sukhasana',
  'utthita_ashwa_sanchalanasana', 'prasarita_padottanasana'
]

const POSE_NAMES = {
  'tadasana': '山式',
  'virabhadrasana_ii': '战士二式',
  'trikonasana': '三角式',
  'adho_mukha_svanasana': '下犬式',
  'vrksasana': '树式',
  'utkatasana': '幻椅式',
  'bhujangasana': '眼镜蛇式',
  'setu_bandhasana': '桥式',
  'plank': '平板式',
  'navasana': '船式',
  // 新增10个
  'bharadvajasana_i': '巴拉瓦伽式',
  'padangusthasana': '大脚趾式',
  'dhanurasana': '弓式',
  'chakravakasana': '猫牛式',
  'gomukhasana': '牛面式',
  'ardha_pincha_mayurasana': '海豚式',
  'garudasana': '鹰式',
  'sukhasana': '简易坐姿',
  'utthita_ashwa_sanchalanasana': '高弓步',
  'prasarita_padottanasana': '广角前弯',
}

// 坐姿体式列表 (腿部弯曲，大腿长度阈值放宽)
const SEATED_POSES = ['bharadvajasana_i', 'gomukhasana', 'sukhasana', 'ardha_matsyendrasana']

// 提取BASE模板的坐标
function extractBASE(content) {
  const startIdx = content.indexOf('const BASE:')
  if (startIdx === -1) return null
  
  const endIdx = content.indexOf(']', startIdx)
  if (endIdx === -1) return null
  
  const baseBlock = content.substring(startIdx, endIdx + 1)
  
  const coordRegex = /lm\(([-\d.]+),\s*([-\d.]+),\s*([-\d.]+)\)/g
  const landmarks = []
  let coordMatch
  
  while ((coordMatch = coordRegex.exec(baseBlock)) !== null) {
    landmarks.push({
      x: parseFloat(coordMatch[1]),
      y: parseFloat(coordMatch[2]),
      z: parseFloat(coordMatch[3])
    })
  }
  
  return landmarks.length >= 33 ? landmarks.slice(0, 33) : null
}

// 检查体式是否直接使用BASE
function usesBase(content, poseId) {
  const regex = new RegExp(`const ${poseId}[\\s\\S]*?landmarks:\\s*cloneLandmarks\\(BASE\\)`, 'i')
  return regex.test(content)
}

// 提取特定体式的坐标修改
function extractPoseModifications(content, poseId) {
  const poseRegex = new RegExp(`const ${poseId}[\\s\\S]*?landmarks:[\\s\\S]*?\\(([\\s\\S]*?)\\)\\(\\)`, 'i')
  const match = content.match(poseRegex)
  if (!match) return []

  const block = match[1]
  const mods = []

  const modRegex = /l\[(\d+)\]\s*=\s*\{\s*x:\s*([-\d.]+),\s*y:\s*([-\d.]+),\s*z:\s*([-\d.]+)\s*\}/g
  let modMatch

  while ((modMatch = modRegex.exec(block)) !== null) {
    mods.push({
      index: parseInt(modMatch[1]),
      x: parseFloat(modMatch[2]),
      y: parseFloat(modMatch[3]),
      z: parseFloat(modMatch[4])
    })
  }

  return mods
}

function validatePose(lm, poseId) {
  const issues = []
  const warnings = []

  // 判断是否为坐姿体式
  const isSeated = SEATED_POSES.includes(poseId)

  // 检查1: 骨骼长度合理性
  const leftUpperArm = Math.sqrt(
    (lm[11].x - lm[13].x) ** 2 + (lm[11].y - lm[13].y) ** 2 + (lm[11].z - lm[13].z) ** 2
  )
  const leftForearm = Math.sqrt(
    (lm[13].x - lm[15].x) ** 2 + (lm[13].y - lm[15].y) ** 2 + (lm[13].z - lm[15].z) ** 2
  )
  const leftUpperLeg = Math.sqrt(
    (lm[23].x - lm[25].x) ** 2 + (lm[23].y - lm[25].y) ** 2 + (lm[23].z - lm[25].z) ** 2
  )
  const leftLowerLeg = Math.sqrt(
    (lm[25].x - lm[27].x) ** 2 + (lm[25].y - lm[27].y) ** 2 + (lm[25].z - lm[27].z) ** 2
  )

  // 坐姿体式的腿部阈值放宽
  const upperLegMin = isSeated ? 0.1 : 0.2
  const lowerLegMin = isSeated ? 0.05 : 0.15

  if (leftUpperArm < 0.15 || leftUpperArm > 0.6) issues.push(`上臂长度异常: ${leftUpperArm.toFixed(3)} (期望0.15-0.6)`)
  if (leftForearm < 0.1 || leftForearm > 0.5) issues.push(`前臂长度异常: ${leftForearm.toFixed(3)} (期望0.1-0.5)`)
  if (leftUpperLeg < upperLegMin || leftUpperLeg > 0.7) issues.push(`大腿长度异常: ${leftUpperLeg.toFixed(3)} (期望${upperLegMin}-0.7)`)
  if (leftLowerLeg < lowerLegMin || leftLowerLeg > 0.6) issues.push(`小腿长度异常: ${leftLowerLeg.toFixed(3)} (期望${lowerLegMin}-0.6)`)

  // 检查2: 脊柱长度
  const spineLength = Math.sqrt(
    (lm[0].x - ((lm[23].x + lm[24].x) / 2)) ** 2 +
    (lm[0].y - ((lm[23].y + lm[24].y) / 2)) ** 2 +
    (lm[0].z - ((lm[23].z + lm[24].z) / 2)) ** 2
  )
  if (spineLength < 0.2 || spineLength > 1.2) warnings.push(`脊柱长度: ${spineLength.toFixed(3)}`)

  // 检查3: z轴深度合理性
  const noseZ = lm[0].z
  const hipAvgZ = (lm[23].z + lm[24].z) / 2
  if (Math.abs(noseZ - hipAvgZ) > 0.5) warnings.push(`头部髋部z轴距离: ${Math.abs(noseZ - hipAvgZ).toFixed(3)}`)

  return { issues, warnings }
}

// 读取文件并验证
console.log('=== 瑜伽体式坐标验证报告 ===\n')

try {
  const content = fs.readFileSync(DB_PATH, 'utf-8')

  // 提取BASE模板
  const baseLandmarks = extractBASE(content)
  if (!baseLandmarks) {
    console.error('无法提取BASE模板')
    process.exit(1)
  }

  console.log(`BASE模板: ${baseLandmarks.length} 个关键点`)
  console.log(`上臂长度: ${Math.sqrt(
    (baseLandmarks[11].x - baseLandmarks[13].x) ** 2 + 
    (baseLandmarks[11].y - baseLandmarks[13].y) ** 2 + 
    (baseLandmarks[11].z - baseLandmarks[13].z) ** 2
  ).toFixed(3)}\n`)

  let totalPass = 0
  let totalIssues = 0
  let totalWarnings = 0

  for (const poseId of COMMON_POSES) {
    const poseName = POSE_NAMES[poseId] || poseId
    console.log(`【${poseName}】 (${poseId})`)

    // 从BASE模板开始
    const landmarks = baseLandmarks.map(l => ({ ...l }))

    // 检查是否直接使用BASE
    const directBase = usesBase(content, poseId)
    
    if (!directBase) {
      // 应用该体式的修改
      const mods = extractPoseModifications(content, poseId)
      for (const mod of mods) {
        if (mod.index < 33) {
          landmarks[mod.index] = { x: mod.x, y: mod.y, z: mod.z }
        }
      }
    }

    const { issues, warnings } = validatePose(landmarks, poseId)

    if (issues.length === 0 && warnings.length === 0) {
      console.log('  ✓ 验证通过\n')
      totalPass++
    } else {
      if (issues.length > 0) {
        console.log('  ✗ 问题:')
        issues.forEach(i => console.log(`    - ${i}`))
        totalIssues++
      }
      if (warnings.length > 0) {
        console.log('  ⚠ 警告:')
        warnings.forEach(w => console.log(`    - ${w}`))
        totalWarnings++
      }
      console.log('')
    }
  }

  console.log('=== 验证统计 ===')
  console.log(`总数量: ${COMMON_POSES.length}`)
  console.log(`通过: ${totalPass}`)
  console.log(`有问题: ${totalIssues}`)
  console.log(`有警告: ${totalWarnings}`)

} catch (error) {
  console.error('读取文件失败:', error.message)
}
