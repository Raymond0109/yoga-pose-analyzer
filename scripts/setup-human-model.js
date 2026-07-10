#!/usr/bin/env node

/**
 * 人体模型集成脚本
 *
 * 使用方法:
 *   node scripts/setup-human-model.js --source mixamo --model path/to/model.glb
 *
 * 选项:
 *   --source: 模型来源 (mixamo, makehuman, custom)
 *   --model: 模型文件路径 (.glb 或 .gltf)
 *   --output: 输出目录 (默认: public/assets/models/)
 */

const fs = require('fs')
const path = require('path')

// 默认配置
const DEFAULT_CONFIG = {
  source: 'mixamo',
  model: null,
  output: 'public/assets/models',
  // SMPL骨骼映射
  skeletonMap: {
    'mixamorigHips': 'pelvis',
    'mixamorigSpine': 'spine',
    'mixamorigSpine1': 'spine1',
    'mixamorigSpine2': 'spine2',
    'mixamorigNeck': 'neck',
    'mixamorigHead': 'head',
    'mixamorigLeftShoulder': 'left_shoulder',
    'mixamorigLeftArm': 'left_arm',
    'mixamorigLeftForeArm': 'left_foreArm',
    'mixamorigLeftHand': 'left_hand',
    'mixamorigRightShoulder': 'right_shoulder',
    'mixamorigRightArm': 'right_arm',
    'mixamorigRightForeArm': 'right_foreArm',
    'mixamorigRightHand': 'right_hand',
    'mixamorigLeftUpLeg': 'left_upLeg',
    'mixamorigLeftLeg': 'left_leg',
    'mixamorigLeftFoot': 'left_foot',
    'mixamorigRightUpLeg': 'right_upLeg',
    'mixamorigRightLeg': 'right_leg',
    'mixamorigRightFoot': 'right_foot'
  }
}

// 解析命令行参数
function parseArgs() {
  const args = process.argv.slice(2)
  const config = { ...DEFAULT_CONFIG }

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--source' && args[i + 1]) {
      config.source = args[i + 1]
      i++
    } else if (args[i] === '--model' && args[i + 1]) {
      config.model = args[i + 1]
      i++
    } else if (args[i] === '--output' && args[i + 1]) {
      config.output = args[i + 1]
      i++
    }
  }

  return config
}

// 检查模型文件
function validateModel(modelPath) {
  if (!modelPath) {
    console.error('错误: 请指定模型文件路径')
    console.log('使用方法: node scripts/setup-human-model.js --model path/to/model.glb')
    process.exit(1)
  }

  if (!fs.existsSync(modelPath)) {
    console.error(`错误: 模型文件不存在: ${modelPath}`)
    process.exit(1)
  }

  const ext = path.extname(modelPath).toLowerCase()
  if (!['.glb', '.gltf'].includes(ext)) {
    console.error('错误: 模型文件必须是 .glb 或 .gltf 格式')
    process.exit(1)
  }

  return true
}

// 复制模型文件
function copyModel(source, outputDir) {
  const fileName = path.basename(source)
  const destPath = path.join(outputDir, fileName)

  // 创建输出目录
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  // 复制文件
  fs.copyFileSync(source, destPath)
  console.log(`已复制模型到: ${destPath}`)

  return destPath
}

// 生成配置文件
function generateConfig(modelPath, skeletonMap) {
  const config = {
    modelPath: `/assets/models/${path.basename(modelPath)}`,
    skeletonMap,
    // Three.js配置
    threejs: {
      scale: 1.0,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 }
    }
  }

  const configPath = path.join(path.dirname(modelPath), 'human-model-config.json')
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
  console.log(`已生成配置文件: ${configPath}`)

  return config
}

// 主函数
function main() {
  console.log('=== 人体模型集成脚本 ===\n')

  const config = parseArgs()

  // 验证模型
  if (config.model) {
    validateModel(config.model)
  } else {
    console.log('未指定模型文件，显示使用说明:\n')
    console.log('使用方法:')
    console.log('  node scripts/setup-human-model.js --model path/to/model.glb')
    console.log('')
    console.log('模型来源:')
    console.log('  1. Mixamo: https://www.mixamo.com (直接下载glTF)')
    console.log('  2. MakeHuman: https://www.makehumancommunity.org/ (需导出)')
    console.log('  3. 自定义: 任何glTF/glb格式的人体模型')
    console.log('')
    console.log('Mixamo下载步骤:')
    console.log('  1. 访问 https://www.mixamo.com')
    console.log('  2. 选择角色 (推荐 Y Bot)')
    console.log('  3. 点击下载')
    console.log('  4. 格式选择: glTF')
    console.log('  5. 皮肤: With Skin')
    console.log('  6. 下载并解压')
    console.log('  7. 运行: node scripts/setup-human-model.js --model path/to/model.glb')
    process.exit(0)
  }

  // 复制模型
  const outputPath = path.join(process.cwd(), config.output)
  const destPath = copyModel(config.model, outputPath)

  // 生成配置
  generateConfig(destPath, config.skeletonMap)

  console.log('\n=== 集成完成 ===')
  console.log(`模型文件: ${destPath}`)
  console.log('\n下一步:')
  console.log('1. 运行 npm run dev 启动应用')
  console.log('2. 3D视图应显示人体模型')
  console.log('3. 如需调整骨骼映射，编辑 human-model-config.json')
}

main()
