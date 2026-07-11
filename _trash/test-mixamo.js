/**
 * 测试 Mixamo 模型加载
 * 运行: node scripts/test-mixamo.js
 */

const fs = require('fs')
const path = require('path')

// 检查模型文件
const modelDir = path.join(__dirname, '../public/assets/models/mixamo')
console.log('=== Mixamo Model Test ===')
console.log('Model directory:', modelDir)

if (!fs.existsSync(modelDir)) {
  console.log('ERROR: Model directory does not exist')
  process.exit(1)
}

const files = fs.readdirSync(modelDir)
console.log('Files in directory:', files)

const fbxFiles = files.filter(f => f.endsWith('.fbx'))
console.log('FBX files:', fbxFiles)

if (fbxFiles.length === 0) {
  console.log('ERROR: No FBX files found')
  process.exit(1)
}

// 检查文件大小
fbxFiles.forEach(file => {
  const filePath = path.join(modelDir, file)
  const stats = fs.statSync(filePath)
  console.log(`File: ${file}`)
  console.log(`  Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`)
  console.log(`  Modified: ${stats.mtime}`)
})

// 检查 FBX 文件头
const fbxFile = path.join(modelDir, fbxFiles[0])
const buffer = Buffer.alloc(20)
const fd = fs.openSync(fbxFile, 'r')
fs.readSync(fd, buffer, 0, 20, 0)
fs.closeSync(fd)

console.log('\nFBX file header (first 20 bytes):')
console.log(buffer.toString('ascii', 0, 18))

// 检查是否是有效的 FBX 文件
if (buffer.toString('ascii', 0, 18) === 'Kaydara FBX Binary') {
  console.log('\n✓ Valid FBX binary file')
} else {
  console.log('\n✗ Not a valid FBX binary file')
  console.log('Expected: Kaydara FBX Binary')
  console.log('Got:', buffer.toString('ascii', 0, 18))
}

console.log('\n=== Test Complete ===')
