import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import type { PoseLandmark } from '@/types/pose'
import type { MuscleTensionData } from '@/types/smpl'
import { MuscleMapper } from './MuscleMapper'

// MediaPipe 33 关键点骨骼连接 (完整定义)
const SKELETON_CONNECTIONS: [number, number][] = [
  // 头部
  [0, 1], [0, 2], [1, 3], [2, 4],           // 鼻-左右眼-左右耳
  // 躯干
  [11, 12],                                   // 左肩-右肩
  [23, 24],                                   // 左髋-右髋
  [11, 23], [12, 24],                         // 肩-髋 (侧面)
  [11, 12], [23, 24],                         // 肩连线, 髋连线
  // 左臂
  [11, 13], [13, 15],                         // 左肩-左肘-左腕
  [15, 17], [15, 19], [15, 21],              // 左腕-左拇指-左小指-左食指
  // 右臂
  [12, 14], [14, 16],                         // 右肩-右肘-右腕
  [16, 18], [16, 20], [16, 22],              // 右腕-右拇指-右小指-右食指
  // 左腿
  [23, 25], [25, 27],                         // 左髋-左膝-左踝
  [27, 29], [27, 31],                         // 左踝-左脚跟-左脚尖
  // 右腿
  [24, 26], [26, 28],                         // 右髋-右膝-右踝
  [28, 30], [28, 32],                         // 右踝-右脚跟-右脚尖
]

// 骨骼 → 肌肉映射
const BONE_TO_MUSCLE: Record<number, string> = {
  0: 'abs', 1: 'abs',
  2: 'deltoids_l', 3: 'biceps_l',
  4: 'deltoids_r', 5: 'biceps_r',
  6: 'abs', 7: 'abs', 8: 'abs', 9: 'abs',
  10: 'quadriceps_l', 11: 'hamstrings_l',
  12: 'quadriceps_r', 13: 'hamstrings_r',
  14: 'calves_l', 15: 'calves_l',
  16: 'calves_r', 17: 'calves_r',
}

const BONE_COLOR = 0x4a90d9
const JOINT_COLOR = 0x52c41a
const PROBLEM_COLOR = 0xff4d4f
const SKIN_COLOR = 0xE8B89D

/** SMPL模型数据接口 */
interface SMPLModelData {
  vertices_template: number[][]
  faces: number[][]
  J: number[][]
  kintree_table: number[][]
  num_vertices: number
  num_joints: number
}

export class SMPLRenderer {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private controls: OrbitControls
  private joints: THREE.Mesh[] = []
  private bones: THREE.Mesh[] = []
  private container: HTMLElement
  private showMuscles = false
  private showMesh = true

  // SMPL模型相关
  private smplModelData: SMPLModelData | null = null
  private humanMesh: THREE.Mesh | null = null
  private meshCenter: THREE.Vector3 = new THREE.Vector3()
  private meshSize: THREE.Vector3 = new THREE.Vector3()

  constructor(container: HTMLElement) {
    this.container = container

    const width = container.clientWidth || 800
    const height = container.clientHeight || 600

    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x1a1a2e)

    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100)
    this.camera.position.set(0, 1.2, 3.0)
    this.camera.lookAt(0, 1.0, 0)

    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setSize(width, height)
    this.renderer.setPixelRatio(window.devicePixelRatio)
    container.appendChild(this.renderer.domElement)

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.target.set(0, 1.0, 0)
    this.controls.enableDamping = true

    // 光照
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.6))
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8)
    dirLight.position.set(2, 5, 3)
    this.scene.add(dirLight)

    const gridHelper = new THREE.GridHelper(4, 20, 0x333333, 0x222222)
    this.scene.add(gridHelper)

    this.initSkeleton()
    this.animate()
  }

  /** 初始化骨架 */
  private initSkeleton(): void {
    const jointGeo = new THREE.SphereGeometry(0.025, 12, 12)
    const jointMat = new THREE.MeshStandardMaterial({ color: JOINT_COLOR })

    for (let i = 0; i < 33; i++) {
      const mesh = new THREE.Mesh(jointGeo, jointMat.clone())
      mesh.visible = false
      this.scene.add(mesh)
      this.joints.push(mesh)
    }

    const boneMat = new THREE.MeshStandardMaterial({ color: BONE_COLOR })
    for (let i = 0; i < SKELETON_CONNECTIONS.length; i++) {
      const geo = new THREE.CylinderGeometry(0.012, 0.012, 1, 8)
      geo.translate(0, 0.5, 0)
      geo.rotateX(Math.PI / 2)
      const mesh = new THREE.Mesh(geo, boneMat.clone())
      mesh.visible = false
      this.scene.add(mesh)
      this.bones.push(mesh)
    }
  }

  /** 加载SMPL模型 */
  async loadSMPLModel(modelPath: string): Promise<void> {
    try {
      const response = await fetch(modelPath)
      if (!response.ok) {
        throw new Error(`Failed to load model: ${response.statusText}`)
      }
      this.smplModelData = await response.json()
      console.log('SMPL model loaded:', this.smplModelData?.num_vertices, 'vertices')

      // 创建人体网格
      this.createHumanMesh()
      console.log('SMPL mesh created')
    } catch (error) {
      console.error('Failed to load SMPL model:', error)
      throw error
    }
  }

  /** 创建人体网格 */
  private createHumanMesh(): void {
    if (!this.smplModelData) {
      console.warn('No SMPL model data')
      return
    }

    console.log('Creating mesh with', this.smplModelData.num_vertices, 'vertices')

    const geometry = new THREE.BufferGeometry()

    // 设置顶点
    const vertices = new Float32Array(this.smplModelData.vertices_template.flat())
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))

    // 设置面片
    const indices = new Uint32Array(this.smplModelData.faces.flat())
    geometry.setIndex(new THREE.BufferAttribute(indices, 1))

    // 计算法线
    geometry.computeVertexNormals()

    // 计算包围盒
    geometry.computeBoundingBox()
    const box = geometry.boundingBox!
    box.getCenter(this.meshCenter)
    box.getSize(this.meshSize)
    console.log('Mesh center:', this.meshCenter, 'size:', this.meshSize)

    const material = new THREE.MeshStandardMaterial({
      color: SKIN_COLOR,
      roughness: 0.7,
      metalness: 0.1,
      side: THREE.DoubleSide,
    })

    this.humanMesh = new THREE.Mesh(geometry, material)
    this.scene.add(this.humanMesh)

    // 测试：添加一个参考立方体
    const testGeo = new THREE.BoxGeometry(0.1, 0.1, 0.1)
    const testMat = new THREE.MeshStandardMaterial({ color: 0xff0000 })
    const testCube = new THREE.Mesh(testGeo, testMat)
    testCube.position.set(0, 1, 0)
    this.scene.add(testCube)

    console.log('Human mesh added to scene, position:', this.humanMesh.position)
    console.log('Test cube added at (0, 1, 0)')
  }

  /** 更新姿态 */
  updatePose(landmarks: PoseLandmark[]): void {
    if (!landmarks || landmarks.length < 33) return

    const scaleX = 1.4
    const scaleY = 2.8
    const scaleZ = 1.0

    // 更新关节位置
    for (let i = 0; i < 33; i++) {
      const lm = landmarks[i]
      if (!lm) continue

      const x = (lm.x - 0.5) * scaleX
      const y = (1 - lm.y) * scaleY
      const z = (lm.z || 0) * scaleZ

      this.joints[i].position.set(x, y, z)
      this.joints[i].visible = (lm.visibility ?? 0.5) > 0.2
    }

    // 更新骨骼连接
    for (let i = 0; i < SKELETON_CONNECTIONS.length; i++) {
      const [start, end] = SKELETON_CONNECTIONS[i]
      const startJoint = this.joints[start]
      const endJoint = this.joints[end]

      if (!startJoint.visible || !endJoint.visible) {
        this.bones[i].visible = false
        continue
      }

      this.bones[i].visible = true

      const startVec = startJoint.position
      const endVec = endJoint.position
      const direction = new THREE.Vector3().subVectors(endVec, startVec)
      const length = direction.length()

      if (length < 0.01) {
        this.bones[i].visible = false
        continue
      }

      this.bones[i].position.copy(startVec)
      this.bones[i].scale.set(1, 1, length)
      this.bones[i].lookAt(endVec)
    }

    // 更新SMPL网格（如果已加载）
    if (this.humanMesh && this.showMesh) {
      console.log('Updating SMPL mesh...')
      this.updateHumanMesh(landmarks)
    }
  }

  /** 更新人体网格姿态 */
  private updateHumanMesh(landmarks: PoseLandmark[]): void {
    if (!this.humanMesh || !this.smplModelData) {
      console.log('updateHumanMesh: no mesh or model data')
      return
    }

    const scaleX = 1.4
    const scaleY = 2.8
    const scaleZ = 1.0

    // 计算骨架的髋部中心位置
    const hipCenter = new THREE.Vector3(
      ((landmarks[23].x + landmarks[24].x) / 2 - 0.5) * scaleX,
      (1 - (landmarks[23].y + landmarks[24].y) / 2) * scaleY,
      ((landmarks[23].z + landmarks[24].z) / 2) * scaleZ
    )

    // 计算肩膀中心
    const shoulderCenter = new THREE.Vector3(
      ((landmarks[11].x + landmarks[12].x) / 2 - 0.5) * scaleX,
      (1 - (landmarks[11].y + landmarks[12].y) / 2) * scaleY,
      ((landmarks[11].z + landmarks[12].z) / 2) * scaleZ
    )

    // 计算躯干长度 (肩膀到髋部)
    const torsoLength = shoulderCenter.distanceTo(hipCenter)

    // 计算网格需要的缩放比例
    // 模型原始躯干长度大约是 meshSize.y 的一半
    const modelTorsoLength = this.meshSize.y * 0.4
    const scaleFactor = torsoLength / modelTorsoLength

    // 设置网格缩放
    this.humanMesh.scale.set(scaleFactor, scaleFactor, scaleFactor)

    // 计算网格位置 (髋部中心减去模型中心的缩放偏移)
    const scaledCenter = this.meshCenter.clone().multiplyScalar(scaleFactor)
    this.humanMesh.position.set(
      hipCenter.x - scaledCenter.x,
      hipCenter.y - scaledCenter.y + this.meshSize.y * scaleFactor * 0.5,
      hipCenter.z - scaledCenter.z
    )

    // 每100帧输出一次日志
    if (Math.random() < 0.01) {
      console.log('SMPL mesh update:', {
        hipCenter: { x: hipCenter.x.toFixed(2), y: hipCenter.y.toFixed(2), z: hipCenter.z.toFixed(2) },
        scaleFactor: scaleFactor.toFixed(2),
        meshPosition: { 
          x: this.humanMesh.position.x.toFixed(2), 
          y: this.humanMesh.position.y.toFixed(2), 
          z: this.humanMesh.position.z.toFixed(2) 
        },
        meshSize: { x: this.meshSize.x.toFixed(2), y: this.meshSize.y.toFixed(2) }
      })
    }

    // 计算躯干方向用于旋转
    const up = new THREE.Vector3().subVectors(shoulderCenter, hipCenter).normalize()
    const defaultUp = new THREE.Vector3(0, 1, 0)

    // 只在方向差异明显时才旋转
    if (up.dot(defaultUp) < 0.99) {
      const quaternion = new THREE.Quaternion()
      quaternion.setFromUnitVectors(defaultUp, up)
      this.humanMesh.quaternion.copy(quaternion)
    } else {
      this.humanMesh.quaternion.identity()
    }
  }

  /** 更新肌肉热力图 */
  updateMuscleHeatmap(tensions: MuscleTensionData[]): void {
    if (!this.showMuscles) return

    const tensionMap = new Map(tensions.map((t) => [t.muscle, t.tension]))

    for (let i = 0; i < this.bones.length; i++) {
      const muscleName = BONE_TO_MUSCLE[i]
      if (!muscleName) continue

      const tension = tensionMap.get(muscleName) ?? 0
      const color = MuscleMapper.tensionToColor(tension)
      const mat = this.bones[i].material as THREE.MeshStandardMaterial
      mat.color.setRGB(color.r, color.g, color.b)
      mat.emissive.setRGB(color.r * 0.15, color.g * 0.15, color.b * 0.15)
    }

    // 更新人体网格颜色
    if (this.humanMesh && this.showMesh) {
      this.updateMeshMuscleColor(tensions)
    }
  }

  /** 更新网格肌肉颜色 */
  private updateMeshMuscleColor(tensions: MuscleTensionData[]): void {
    if (!this.humanMesh) return

    const tensionMap = new Map(tensions.map((t) => [t.muscle, t.tension]))

    // 计算平均紧张度
    const avgTension = tensions.length > 0
      ? tensions.reduce((s, t) => s + t.tension, 0) / tensions.length
      : 0

    const color = MuscleMapper.tensionToColor(avgTension)
    const mat = this.humanMesh.material as THREE.MeshStandardMaterial
    mat.color.setRGB(color.r, color.g, color.b)
  }

  /** 切换肌肉显示模式 */
  setShowMuscles(show: boolean): void {
    this.showMuscles = show
    if (!show) {
      for (const bone of this.bones) {
        const mat = bone.material as THREE.MeshStandardMaterial
        mat.color.setHex(BONE_COLOR)
        mat.emissive.setHex(0x000000)
      }
      if (this.humanMesh) {
        const mat = this.humanMesh.material as THREE.MeshStandardMaterial
        mat.color.setHex(SKIN_COLOR)
        mat.emissive.setHex(0x000000)
      }
    }
  }

  /** 切换网格显示模式 */
  setShowMesh(show: boolean): void {
    this.showMesh = show
    if (this.humanMesh) {
      this.humanMesh.visible = show
    }
  }

  /** 高亮问题关节 */
  highlightProblemJoints(problemJoints: string[]): void {
    const jointNameToIndex: Record<string, number> = {
      left_elbow: 13, right_elbow: 14,
      left_knee: 25, right_knee: 26,
      left_hip: 23, right_hip: 24,
      left_shoulder: 11, right_shoulder: 12,
    }

    for (const [name, idx] of Object.entries(jointNameToIndex)) {
      if (idx < this.joints.length) {
        const mat = this.joints[idx].material as THREE.MeshStandardMaterial
        if (problemJoints.includes(name)) {
          mat.color.setHex(PROBLEM_COLOR)
        } else {
          mat.color.setHex(JOINT_COLOR)
        }
      }
    }
  }

  /** 重置相机 */
  resetCamera(): void {
    this.camera.position.set(0, 1.2, 3.0)
    this.controls.target.set(0, 1.0, 0)
    this.controls.update()
  }

  /** 动画循环 */
  private animate = (): void => {
    requestAnimationFrame(this.animate)
    this.controls.update()
    this.renderer.render(this.scene, this.camera)
  }

  /** 调整大小 */
  resize(width: number, height: number): void {
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height)
  }

  /** 释放资源 */
  dispose(): void {
    this.renderer.dispose()
    this.controls.dispose()
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement)
    }
  }
}
