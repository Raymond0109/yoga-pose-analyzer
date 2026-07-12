/**
 * 高级图片预处理器
 * 专门处理解剖图/非标准图片，转换为 MediaPipe 可识别的格式
 */

export class AdvancedPreprocessor {
  /**
   * 解剖图 → 真人风格转换
   * 核心思路：提取轮廓，填充为类肤色，去除肌肉纹理
   */
  static anatomyToRealistic(imageData: ImageData): ImageData {
    const { width, height, data } = imageData
    const output = new Uint8ClampedArray(data.length)

    // 1. 转灰度
    const gray = new Uint8Array(width * height)
    for (let i = 0; i < data.length; i += 4) {
      gray[i / 4] = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
    }

    // 2. 自适应阈值二值化
    const binary = new Uint8Array(width * height)
    const blockSize = 15
    const c = 10
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sum = 0, count = 0
        for (let dy = -blockSize; dy <= blockSize; dy++) {
          for (let dx = -blockSize; dx <= blockSize; dx++) {
            const nx = x + dx, ny = y + dy
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              sum += gray[ny * width + nx]
              count++
            }
          }
        }
        const threshold = sum / count - c
        binary[y * width + x] = gray[y * width + x] > threshold ? 255 : 0
      }
    }

    // 3. 膨胀+腐蚀去噪
    const cleaned = morphologyClose(binary, width, height)

    // 4. 填充为类肤色（浅色前景，深色背景）
    const skinR = 220, skinG = 185, skinB = 165
    const bgR = 40, bgG = 40, bgB = 50

    for (let i = 0; i < width * height; i++) {
      const pi = i * 4
      if (cleaned[i] > 0) {
        // 前景：类肤色 + 原图边缘信息
        const edge = gray[i] > 100 ? 0.7 : 0.3
        output[pi] = skinR * edge + data[pi] * (1 - edge)
        output[pi + 1] = skinG * edge + data[pi + 1] * (1 - edge)
        output[pi + 2] = skinB * edge + data[pi + 2] * (1 - edge)
      } else {
        // 背景：深色
        output[pi] = bgR
        output[pi + 1] = bgG
        output[pi + 2] = bgB
      }
      output[pi + 3] = 255
    }

    return new ImageData(output, width, height)
  }

  /**
   * 轮廓提取（Sobel + 阈值）
   */
  static extractEdges(imageData: ImageData): ImageData {
    const { width, height, data } = imageData
    const output = new Uint8ClampedArray(data.length)

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4

        // Sobel
        const gx = (
          -data[((y - 1) * width + x - 1) * 4] +
          data[((y - 1) * width + x + 1) * 4] +
          -2 * data[(y * width + x - 1) * 4] +
          2 * data[(y * width + x + 1) * 4] +
          -data[((y + 1) * width + x - 1) * 4] +
          data[((y + 1) * width + x + 1) * 4]
        ) / 8

        const gy = (
          -data[((y - 1) * width + x - 1) * 4] +
          -2 * data[((y - 1) * width + x) * 4] +
          -data[((y - 1) * width + x + 1) * 4] +
          data[((y + 1) * width + x - 1) * 4] +
          2 * data[((y + 1) * width + x) * 4] +
          data[((y + 1) * width + x + 1) * 4]
        ) / 8

        const edge = Math.min(255, Math.sqrt(gx * gx + gy * gy))
        const v = edge > 30 ? 255 : 0
        output[idx] = v
        output[idx + 1] = v
        output[idx + 2] = v
        output[idx + 3] = 255
      }
    }

    return new ImageData(output, width, height)
  }

  /**
   * 增强肤色区域（保留原色，只微调对比度）
   */
  static enhanceSkinTones(imageData: ImageData): ImageData {
    const { data } = imageData
    const output = new Uint8ClampedArray(data)

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2]

      // 轻微增强对比度（不改变色调）
      const factor = 1.05
      output[i] = Math.min(255, r * factor)
      output[i + 1] = Math.min(255, g * factor)
      output[i + 2] = Math.min(255, b * factor)
      output[i + 3] = data[i + 3]
    }

    return new ImageData(output, data.length / 4)
  }
}

/**
 * 形态学闭运算（先膨胀后腐蚀，填充小孔）
 */
function morphologyClose(binary: Uint8Array, width: number, height: number): Uint8Array {
  // 简化版：3x3 膨胀 + 3x3 腐蚀
  let temp = dilate(binary, width, height)
  return erode(temp, width, height)
}

function dilate(input: Uint8Array, width: number, height: number): Uint8Array {
  const output = new Uint8Array(input.length)
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let max = 0
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          max = Math.max(max, input[(y + dy) * width + (x + dx)])
        }
      }
      output[y * width + x] = max
    }
  }
  return output
}

function erode(input: Uint8Array, width: number, height: number): Uint8Array {
  const output = new Uint8Array(input.length)
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let min = 255
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          min = Math.min(min, input[(y + dy) * width + (x + dx)])
        }
      }
      output[y * width + x] = min
    }
  }
  return output
}
