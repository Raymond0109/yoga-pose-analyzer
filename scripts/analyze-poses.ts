/**
 * 体式图片分析脚本
 * 用 MediaPipe 分析 Yoga_base 中的图片，提取关节角度
 */

import { MediaPipePose } from './src/core/pose/MediaPipePose'
import { AngleCalculator } from './src/core/pose/AngleCalculator'
import * as fs from 'fs'
import * as path from 'path'

const YOGA_BASE = '/Users/ray/Yoga_base'

// 要分析的体式图片
const POSE_IMAGES: Record<string, string> = {
  'tadasana': '山式.jpeg',
  'vrksasana': '树式.jpg',
  'virabhadrasana_i': '战士1式.jpg',
  'virabhadrasana_ii': '战士2式.jpg',
  'trikonasana': '三角式.jpg',
  'adho_mukha_svanasana': '下犬式.jpg',
  'utkatasana': '幻椅式.webp',
  'virabhadrasana_iii': '战士3式.jpg',
  'bhujangasana': '眼鏡蛇式.jpg',
  'setu_bandhasana': '橋式.jpg',
}

async function analyzePose(imagePath: string, poseName: string) {
  const estimator = new MediaPipePose()
  await estimator.initialize()

  // 加载图片
  const img = new Image()
  img.src = imagePath

  return new Promise<any>((resolve) => {
    img.onload = async () => {
      const result = estimator.estimate(img, performance.now())
      if (result) {
        const angles = AngleCalculator.calculateAllAngles(result.landmarks)
        resolve({
          pose: poseName,
          landmarks: result.landmarks.map((lm: any) => ({
            x: lm.x, y: lm.y, z: lm.z, visibility: lm.visibility
          })),
          angles: angles.map((a: any) => ({
            joint: a.joint,
            angle: Math.round(a.angle * 10) / 10,
            axis: a.axis,
          })),
        })
      } else {
        resolve({ pose: poseName, error: 'No pose detected' })
      }
      estimator.dispose()
    }
    img.onerror = () => {
      resolve({ pose: poseName, error: 'Failed to load image' })
    }
  })
}

async function main() {
  const results: any[] = []

  for (const [poseId, fileName] of Object.entries(POSE_IMAGES)) {
    const imagePath = path.join(YOGA_BASE, fileName)
    if (!fs.existsSync(imagePath)) {
      console.log(`Skipping ${poseId}: file not found`)
      continue
    }

    console.log(`Analyzing ${poseId} (${fileName})...`)
    try {
      const result = await analyzePose(imagePath, poseId)
      results.push(result)
      console.log(`  Angles: ${result.angles?.map((a: any) => `${a.joint}=${a.angle}°`).join(', ')}`)
    } catch (e) {
      console.log(`  Error: ${e}`)
    }
  }

  // 保存结果
  const outputPath = path.join(YOGA_BASE, 'pose_analysis_results.json')
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2))
  console.log(`\nResults saved to ${outputPath}`)
}

main().catch(console.error)
