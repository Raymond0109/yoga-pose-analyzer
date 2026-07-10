/**
 * SMPL 模型集成模块
 *
 * SMPL (Skinned Multi-Person Linear Model) 是参数化人体模型
 * - 形状参数 β (10维): 控制体型高矮胖瘦
 * - 姿态参数 θ (72维 = 24关节 × 3): 控制各关节旋转
 * - 输出: 6890个顶点的3D网格 + 24个骨骼关节
 *
 * 注意: SMPL模型文件需要从 https://smpl.is.tue.mpg.de 下载
 * 下载后需要转换为JSON格式供浏览器使用
 */

import * as THREE from 'three'

/** SMPL模型参数 */
export interface SMPLParams {
  betas: number[]      // 形状参数 (10维)
  pose: number[]       // 姿态参数 (72维)
  transl: number[]     // 平移参数 (3维)
}

/** SMPL模型数据 */
export interface SMPLModelData {
  vertices_template: number[][]  // 模板顶点 (6890 × 3)
  faces: number[][]              // 面片索引
  joint_regressor: number[][]    // 关节回归器
  weights: number[][]            # 蒙皮权重
  posedirs: number[][][]         // 姿态混合形状
  shapedirs: number[][][]        // 形状混合形状
  kintree_table: number[][]      // 骨骼层级表
  J: number[][]                  // 关节位置
}

/** 默认SMPL参数 */
export const DEFAULT_SMPL_PARAMS: SMPLParams = {
  betas: new Array(10).fill(0),
  pose: new Array(72).fill(0),
  transl: [0, 0, 0],
}

/**
 * SMPL模型管理器
 */
export class SMPLModelManager {
  private modelData: SMPLModelData | null = null
  private isLoaded = false

  /**
   * 加载SMPL模型数据
   * @param path JSON格式的模型文件路径
   */
  async loadModel(path: string): Promise<void> {
    try {
      const response = await fetch(path)
      if (!response.ok) {
        throw new Error(`Failed to load SMPL model: ${response.statusText}`)
      }
      this.modelData = await response.json()
      this.isLoaded = true
      console.log('SMPL model loaded successfully')
    } catch (error) {
      console.error('Failed to load SMPL model:', error)
      throw error
    }
  }

  /**
   * 检查模型是否已加载
   */
  isModelLoaded(): boolean {
    return this.isLoaded && this.modelData !== null
  }

  /**
   * 生成人体网格
   * @param params SMPL参数
   * @returns 顶点数组和面片索引
   */
  generateMesh(params: SMPLParams): { vertices: number[][], faces: number[][] } | null {
    if (!this.modelData) {
      console.warn('SMPL model not loaded')
      return null
    }

    // 简化版SMPL前向传播
    // 实际实现需要完整的线性混合蒙皮算法
    const vertices = this.modelData.vertices_template.map((v, i) => {
      // 应用形状混合形状
      let x = v[0], y = v[1], z = v[2]
      
      if (this.modelData!.shapedirs && this.modelData!.shapedirs[i]) {
        for (let b = 0; b < 10; b++) {
          if (this.modelData!.shapedirs[i][b]) {
            x += this.modelData!.shapedirs[i][b][0] * params.betas[b]
            y += this.modelData!.shapedirs[i][b][1] * params.betas[b]
            z += this.modelData!.shapedirs[i][b][2] * params.betas[b]
          }
        }
      }

      return [x + params.transl[0], y + params.transl[1], z + params.transl[2]]
    })

    return {
      vertices,
      faces: this.modelData.faces,
    }
  }

  /**
   * 获取关节位置
   */
  getJointPositions(params: SMPLParams): number[][] | null {
    if (!this.modelData) return null

    // 使用关节回归器从顶点计算关节位置
    const mesh = this.generateMesh(params)
    if (!mesh) return null

    const joints: number[][] = []
    for (let j = 0; j < 24; j++) {
      let x = 0, y = 0, z = 0
      for (let i = 0; i < 6890; i++) {
        const w = this.modelData.joint_regressor[j][i]
        x += mesh.vertices[i][0] * w
        y += mesh.vertices[i][1] * w
        z += mesh.vertices[i][2] * w
      }
      joints.push([x, y, z])
    }

    return joints
  }

  /**
   * 创建Three.js网格对象
   */
  createThreeMesh(params: SMPLParams): THREE.Mesh | null {
    const meshData = this.generateMesh(params)
    if (!meshData) return null

    const geometry = new THREE.BufferGeometry()
    
    // 设置顶点
    const vertices = new Float32Array(meshData.vertices.flat())
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
    
    // 设置面片
    const indices = new Uint32Array(meshData.faces.flat())
    geometry.setIndex(new THREE.BufferAttribute(indices, 1))
    
    // 计算法线
    geometry.computeVertexNormals()

    const material = new THREE.MeshStandardMaterial({
      color: 0xE8B89D,  // 肤色
      roughness: 0.7,
      metalness: 0.1,
    })

    return new THREE.Mesh(geometry, material)
  }
}

/**
 * MediaPipe landmarks → SMPL参数回归器
 */
export class SMPLRegressor {
  /**
   * 从MediaPipe landmarks回归SMPL姿态参数
   * @param landmarks 33个3D关键点
   * @returns SMPL姿态参数 (72维)
   */
  static regressPose(landmarks: Array<{ x: number; y: number; z: number }>): number[] {
    if (landmarks.length < 33) {
      return new Array(72).fill(0)
    }

    const pose = new Array(72).fill(0)

    // 计算关节旋转 (简化版)
    // 实际实现需要更复杂的几何求解
    
    // 骨盆 (0-2)
    // 默认为T-pose，不需要额外旋转

    // 左腿 (3-5: 左髋, 6-8: 左膝)
    const leftHipAngle = this.calculateJointAngle(
      landmarks[11], landmarks[23], landmarks[25]
    )
    pose[3] = leftHipAngle.x
    pose[4] = leftHipAngle.y
    pose[5] = leftHipAngle.z

    // 右腿 (6-8: 右髋, 9-11: 右膝)
    const rightHipAngle = this.calculateJointAngle(
      landmarks[12], landmarks[24], landmarks[26]
    )
    pose[6] = rightHipAngle.x
    pose[7] = rightHipAngle.y
    pose[8] = rightHipAngle.z

    // 左膝 (9-11)
    const leftKneeAngle = this.calculateJointAngle(
      landmarks[23], landmarks[25], landmarks[27]
    )
    pose[9] = leftKneeAngle.x
    pose[10] = leftKneeAngle.y
    pose[11] = leftKneeAngle.z

    // 右膝 (12-14)
    const rightKneeAngle = this.calculateJointAngle(
      landmarks[24], landmarks[26], landmarks[28]
    )
    pose[12] = rightKneeAngle.x
    pose[13] = rightKneeAngle.y
    pose[14] = rightKneeAngle.z

    // 脊柱 (15-17, 18-20, 21-23)
    const spineAngle = this.calculateSpineAngle(landmarks)
    pose[15] = spineAngle.x
    pose[16] = spineAngle.y
    pose[17] = spineAngle.z

    // 左臂 (24-26: 左肩, 27-29: 左肘)
    const leftShoulderAngle = this.calculateJointAngle(
      landmarks[23], landmarks[11], landmarks[13]
    )
    pose[24] = leftShoulderAngle.x
    pose[25] = leftShoulderAngle.y
    pose[26] = leftShoulderAngle.z

    // 右臂 (27-29: 右肩, 30-32: 右肘)
    const rightShoulderAngle = this.calculateJointAngle(
      landmarks[24], landmarks[12], landmarks[14]
    )
    pose[27] = rightShoulderAngle.x
    pose[28] = rightShoulderAngle.y
    pose[29] = rightShoulderAngle.z

    // 左肘 (30-32)
    const leftElbowAngle = this.calculateJointAngle(
      landmarks[11], landmarks[13], landmarks[15]
    )
    pose[30] = leftElbowAngle.x
    pose[31] = leftElbowAngle.y
    pose[32] = leftElbowAngle.z

    // 右肘 (33-35)
    const rightElbowAngle = this.calculateJointAngle(
      landmarks[12], landmarks[14], landmarks[16]
    )
    pose[33] = rightElbowAngle.x
    pose[34] = rightElbowAngle.y
    pose[35] = rightElbowAngle.z

    return pose
  }

  /**
   * 计算关节角度 (三点确定一个角度)
   */
  private static calculateJointAngle(
    p1: { x: number; y: number; z: number },
    p2: { x: number; y: number; z: number },  // 关节点
    p3: { x: number; y: number; z: number }
  ): { x: number; y: number; z: number } {
    const v1 = { x: p1.x - p2.x, y: p1.y - p2.y, z: p1.z - p2.z }
    const v2 = { x: p3.x - p2.x, y: p3.y - p2.y, z: p3.z - p2.z }

    // 计算叉积得到旋转轴
    const cross = {
      x: v1.y * v2.z - v1.z * v2.y,
      y: v1.z * v2.x - v1.x * v2.z,
      z: v1.x * v2.y - v1.y * v2.x,
    }

    // 计算点积得到角度
    const dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z
    const len1 = Math.sqrt(v1.x ** 2 + v1.y ** 2 + v1.z ** 2)
    const len2 = Math.sqrt(v2.x ** 2 + v2.y ** 2 + v2.z ** 2)

    if (len1 < 0.001 || len2 < 0.001) {
      return { x: 0, y: 0, z: 0 }
    }

    const cosAngle = Math.max(-1, Math.min(1, dot / (len1 * len2)))
    const angle = Math.acos(cosAngle)

    // 归一化旋转轴
    const crossLen = Math.sqrt(cross.x ** 2 + cross.y ** 2 + cross.z ** 2)
    if (crossLen < 0.001) {
      return { x: 0, y: 0, z: 0 }
    }

    return {
      x: (cross.x / crossLen) * angle,
      y: (cross.y / crossLen) * angle,
      z: (cross.z / crossLen) * angle,
    }
  }

  /**
   * 计算脊柱角度
   */
  private static calculateSpineAngle(
    landmarks: Array<{ x: number; y: number; z: number }>
  ): { x: number; y: number; z: number } {
    // 使用肩膀和髋部的相对位置计算脊柱弯曲
    const shoulderCenter = {
      x: (landmarks[11].x + landmarks[12].x) / 2,
      y: (landmarks[11].y + landmarks[12].y) / 2,
      z: (landmarks[11].z + landmarks[12].z) / 2,
    }
    const hipCenter = {
      x: (landmarks[23].x + landmarks[24].x) / 2,
      y: (landmarks[23].y + landmarks[24].y) / 2,
      z: (landmarks[23].z + landmarks[24].z) / 2,
    }

    // 脊柱方向向量
    const spine = {
      x: shoulderCenter.x - hipCenter.x,
      y: shoulderCenter.y - hipCenter.y,
      z: shoulderCenter.z - hipCenter.z,
    }

    // 理想脊柱方向 (垂直向上)
    const ideal = { x: 0, y: 1, z: 0 }

    // 计算旋转
    const cross = {
      x: spine.y * ideal.z - spine.z * ideal.y,
      y: spine.z * ideal.x - spine.x * ideal.z,
      z: spine.x * ideal.y - spine.y * ideal.x,
    }

    const dot = spine.x * ideal.x + spine.y * ideal.y + spine.z * ideal.z
    const spineLen = Math.sqrt(spine.x ** 2 + spine.y ** 2 + spine.z ** 2)
    const idealLen = Math.sqrt(ideal.x ** 2 + ideal.y ** 2 + ideal.z ** 2)

    if (spineLen < 0.001 || idealLen < 0.001) {
      return { x: 0, y: 0, z: 0 }
    }

    const cosAngle = Math.max(-1, Math.min(1, dot / (spineLen * idealLen)))
    const angle = Math.acos(cosAngle)

    const crossLen = Math.sqrt(cross.x ** 2 + cross.y ** 2 + cross.z ** 2)
    if (crossLen < 0.001) {
      return { x: 0, y: 0, z: 0 }
    }

    return {
      x: (cross.x / crossLen) * angle * 0.5,  // 缩放因子
      y: (cross.y / crossLen) * angle * 0.5,
      z: (cross.z / crossLen) * angle * 0.5,
    }
  }
}
