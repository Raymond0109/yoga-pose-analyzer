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
  // 脊柱 (用肩中点-髋中点近似)
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
  8: 'deltoids_l',     // 左肩-左肘
  9: 'biceps_l',       // 左肘-左腕
  12: 'deltoids_r',    // 右肩-右肘
  13: 'biceps_r',      // 右肘-右腕
  16: 'quadriceps_l',  // 左髋-左膝
  17: 'hamstrings_l',  // 左膝-左踝
  20: 'quadriceps_r',  // 右髋-右膝
  21: 'hamstrings_r',  // 右膝-右踝
}

const BONE_COLOR = 0x4a90d9
const JOINT_COLOR = 0x52c41a
const PROBLEM_COLOR = 0xff4d4f

export class SMPLRenderer {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private controls: OrbitControls
  private joints: THREE.Mesh[] = []
  private bones: THREE.Mesh[] = []
  private container: HTMLElement
  private showMuscles = false

  constructor(container: HTMLElement) {
    this.container = container

    const width = container.clientWidth || 800
    const height = container.clientHeight || 600

    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x1a1a2e)

    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100)
    this.camera.position.set(0, 1.5, 3.5)
    this.camera.lookAt(0, 1.2, 0)

    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setSize(width, height)
    this.renderer.setPixelRatio(window.devicePixelRatio)
    container.appendChild(this.renderer.domElement)

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.target.set(0, 1.2, 0)
    this.controls.enableDamping = true

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.6))
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8)
    dirLight.position.set(2, 5, 3)
    this.scene.add(dirLight)

    const gridHelper = new THREE.GridHelper(4, 20, 0x333333, 0x222222)
    this.scene.add(gridHelper)

    this.initSkeleton()
    this.animate()
  }

  private initSkeleton(): void {
    const jointGeo = new THREE.SphereGeometry(0.025, 12, 12)
    const jointMat = new THREE.MeshStandardMaterial({ color: JOINT_COLOR })

    // 创建 33 个关节球
    for (let i = 0; i < 33; i++) {
      const mesh = new THREE.Mesh(jointGeo, jointMat.clone())
      mesh.visible = false
      this.scene.add(mesh)
      this.joints.push(mesh)
    }

    // 创建骨骼连接
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

  updatePose(landmarks: PoseLandmark[]): void {
    if (!landmarks || landmarks.length < 33) return

    // 人体比例缩放 (Y轴放大以匹配真实比例)
    const scaleX = 1.4   // 宽度收窄
    const scaleY = 2.8   // 身高拉长
    const scaleZ = 1.0

    for (let i = 0; i < 33; i++) {
      const lm = landmarks[i]
      if (!lm) continue

      // MediaPipe: x(0→1), y(0→1上到下), z(深度)
      // Three.js: x右, y上, z前
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
    }
  }

  highlightProblemJoints(problemJoints: string[]): void {
    const jointNameToIndex: Record<string, number> = {
      left_elbow: 13,
      right_elbow: 14,
      left_knee: 25,
      right_knee: 26,
      left_hip: 23,
      right_hip: 24,
      left_shoulder: 11,
      right_shoulder: 12,
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

  resetCamera(): void {
    this.camera.position.set(0, 1.2, 3.0)
    this.controls.target.set(0, 1.0, 0)
    this.controls.update()
  }

  private animate = (): void => {
    requestAnimationFrame(this.animate)
    this.controls.update()
    this.renderer.render(this.scene, this.camera)
  }

  resize(width: number, height: number): void {
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height)
  }

  dispose(): void {
    this.renderer.dispose()
    this.controls.dispose()
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement)
    }
  }
}
