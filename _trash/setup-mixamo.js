#!/usr/bin/env node

/**
 * Mixamo 模型设置脚本
 * 
 * 使用方法:
 * 1. 从 Mixamo 下载模型 (FBX 格式, T-Pose)
 * 2. 将下载的文件放到 assets/models/mixamo/ 目录
 * 3. 运行此脚本: node scripts/setup-mixamo.js
 */

const fs = require('fs')
const path = require('path')

const MODELS_DIR = path.join(__dirname, '../assets/models/mixamo')
const PUBLIC_MODELS_DIR = path.join(__dirname, '../public/assets/models/mixamo')

// 确保目录存在
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
    console.log(`Created directory: ${dir}`)
  }
}

// 主函数
function main() {
  console.log('=== Mixamo 模型设置 ===\n')
  
  ensureDir(MODELS_DIR)
  ensureDir(PUBLIC_MODELS_DIR)
  
  // 检查是否有模型文件
  const files = fs.readdirSync(MODELS_DIR)
  const modelFiles = files.filter(f => 
    f.endsWith('.fbx') || f.endsWith('.glb') || f.endsWith('.gltf')
  )
  
  if (modelFiles.length === 0) {
    console.log('未找到模型文件。')
    console.log('请从 Mixamo 下载模型并放到以下目录:')
    console.log(`  ${MODELS_DIR}`)
    console.log('\n下载设置:')
    console.log('  - 格式: FBX (for Unity)')
    console.log('  - 姿势: T-Pose')
    console.log('  - 皮肤: With Skin')
    console.log('\n推荐角色: Y Bot 或 X Bot')
    process.exit(1)
  }
  
  console.log(`找到 ${modelFiles.length} 个模型文件:`)
  modelFiles.forEach(f => console.log(`  - ${f}`))
  
  // 复制到 public 目录
  modelFiles.forEach(file => {
    const src = path.join(MODELS_DIR, file)
    const dest = path.join(PUBLIC_MODELS_DIR, file)
    
    fs.copyFileSync(src, dest)
    console.log(`Copied: ${file} -> public/assets/models/mixamo/`)
  })
  
  // 创建模型配置
  const config = {
    primaryModel: modelFiles[0],
    models: modelFiles.map(f => ({
      name: path.basename(f, path.extname(f)),
      file: f,
      format: path.extname(f).slice(1)
    }))
  }
  
  const configPath = path.join(PUBLIC_MODELS_DIR, 'config.json')
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
  console.log(`\nCreated config: ${configPath}`)
  
  console.log('\n=== 设置完成 ===')
  console.log('\n下一步:')
  console.log('1. 重新启动应用: npm run dev')
  console.log('2. 应用会自动加载 Mixamo 模型')
}

main()
