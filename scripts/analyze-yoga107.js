#!/usr/bin/env node

/**
 * Yoga-107 数据集分析脚本
 * 运行: node scripts/analyze-yoga107.js
 */

const fs = require('fs')
const path = require('path')

// 读取Yoga-107数据
const YOGA107_PATH = path.join(__dirname, '../src/data/yoga107.ts')
const MAPPING_PATH = path.join(__dirname, '../src/data/poseMapping.ts')

// 从文件中提取Yoga-107数据
function extractYoga107Data(content) {
  const poses = []
  const regex = /\{\s*id:\s*(\d+),\s*englishName:\s*"([^"]+)",\s*sanskritName:\s*"([^"]+)",\s*categories:\s*\[([^\]]+)\],\s*difficulty:\s*(\d+)\s*\}/g
  
  let match
  while ((match = regex.exec(content)) !== null) {
    poses.push({
      id: parseInt(match[1]),
      englishName: match[2],
      sanskritName: match[3],
      categories: match[4].split(',').map(c => c.trim().replace(/"/g, '')),
      difficulty: parseInt(match[5])
    })
  }
  
  return poses
}

// 从映射文件中提取我们的体式
function extractOurPoses(content) {
  const mapping = {}
  const regex = /'([^']+)':\s*'([^']+)'/g
  
  let match
  while ((match = regex.exec(content)) !== null) {
    mapping[match[1]] = match[2]
  }
  
  return mapping
}

// 主分析函数
function analyze() {
  console.log('=== Yoga-107 数据集分析报告 ===\n')
  
  try {
    // 读取文件
    const yoga107Content = fs.readFileSync(YOGA107_PATH, 'utf-8')
    const mappingContent = fs.readFileSync(MAPPING_PATH, 'utf-8')
    
    // 提取数据
    const yoga107Poses = extractYoga107Data(yoga107Content)
    const ourMapping = extractOurPoses(mappingContent)
    
    console.log(`Yoga-107 数据集总数量: ${yoga107Poses.length}`)
    console.log(`我们的体式总数量: ${Object.keys(ourMapping).length}\n`)
    
    // 统计难度分布
    const difficultyStats = { 1: 0, 2: 0, 3: 0 }
    yoga107Poses.forEach(p => {
      difficultyStats[p.difficulty] = (difficultyStats[p.difficulty] || 0) + 1
    })
    
    console.log('Yoga-107 难度分布:')
    console.log(`  初级 (1): ${difficultyStats[1]}`)
    console.log(`  中级 (2): ${difficultyStats[2]}`)
    console.log(`  高级 (3): ${difficultyStats[3]}\n`)
    
    // 统计分类分布
    const categoryStats = new Map()
    yoga107Poses.forEach(p => {
      p.categories.forEach(c => {
        categoryStats.set(c, (categoryStats.get(c) || 0) + 1)
      })
    })
    
    console.log('Yoga-107 分类分布 (前10):')
    const sortedCategories = Array.from(categoryStats.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
    
    sortedCategories.forEach(([category, count]) => {
      console.log(`  ${category}: ${count}`)
    })
    
    // 找出我们已经有的体式
    const ourSanskritNames = new Set(Object.values(ourMapping))
    const mappedPoses = yoga107Poses.filter(p => ourSanskritNames.has(p.sanskritName))
    const missingPoses = yoga107Poses.filter(p => !ourSanskritNames.has(p.sanskritName))
    
    console.log(`\n=== 映射统计 ===`)
    console.log(`已映射体式: ${mappedPoses.length}`)
    console.log(`缺失体式: ${missingPoses.length}\n`)
    
    // 显示已映射的体式
    console.log('=== 已映射的体式 ===')
    mappedPoses.forEach(p => {
      const ourId = Object.entries(ourMapping).find(([_, sanskrit]) => sanskrit === p.sanskritName)?.[0]
      console.log(`  ${ourId} -> ${p.sanskritName} (${p.englishName})`)
    })
    
    // 显示缺失的体式 (按难度分组)
    console.log('\n=== 缺失的体式 (按难度) ===')
    
    const missingByDifficulty = { 1: [], 2: [], 3: [] }
    missingPoses.forEach(p => {
      missingByDifficulty[p.difficulty].push(p)
    })
    
    Object.entries(missingByDifficulty).forEach(([difficulty, poses]) => {
      const difficultyName = difficulty === '1' ? '初级' : difficulty === '2' ? '中级' : '高级'
      console.log(`\n${difficultyName} (${poses.length}个):`)
      poses.forEach(p => {
        console.log(`  - ${p.englishName} (${p.sanskritName})`)
      })
    })
    
    // 推荐优先添加的体式 (常用且难度适中)
    console.log('\n=== 推荐优先添加的体式 ===')
    const recommended = missingPoses
      .filter(p => p.difficulty <= 2) // 初级和中级
      .filter(p => {
        // 过滤掉一些不太常用的体式
        const commonCategories = ['Standing', 'Seated', 'Backbends', 'Forward Bend']
        return p.categories.some(c => commonCategories.includes(c))
      })
      .slice(0, 10)
    
    recommended.forEach(p => {
      console.log(`  - ${p.englishName} (${p.sanskritName}) - ${p.categories.join(', ')}`)
    })
    
  } catch (error) {
    console.error('分析失败:', error.message)
  }
}

// 运行分析
analyze()
