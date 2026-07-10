import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import type { PoseLandmark } from '@/types/pose'

// MediaPipe 33 个关键点的骨骼连接定义
const SKELETON_CONNECTIONS: [number, number][] = [
  // 躯干
  [11, 12], // 左肩-右肩
  [23, 24], // 左髋-右髋
  [11, 23], // 左肩-左髋
  [12, 24], // 右肩-右髋
  // 左臂
  [11, 13], // 左肩-左肘
  [13, 15], // 左肘-左腕
  // 右臂
  [12, 14], // 右肩-右肘
  [14, 16], // 右肘-右腕
  // 左腿
  [23, 25], // 左髋-左膝
  [25, 27], // 左膝-左踝
  // 右腿
  [24, 26], // 右髋-右膝
  [26, 28], // 右膝-右踝
  // 脊柱
  [0, 11],  // 鼻-左肩 (近似)
  [0, 12],  // 鼻-右肩
]

// 骨骼颜色
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

  constructor(container: HTMLElement) {
    this.container = container

    // 场景
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x1a1a2e)

    // 相机
    this.camera = new THREE.PerspectiveCamera(
      50,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    )
    this.camera.position.set(0, 1.2, 3)

    // 渲染器
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setSize(container.clientWidth, container.clientHeight)
    this.renderer.setPixelRatio(window.devicePixelRatio)
    container.appendChild(this.renderer.domElement)

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.target.set(0, 1, 0)
    this.controls.enableDamping = true

    // 光照
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.6))
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8)
    dirLight.position.set(2, 5, 3)
    this.scene.add(dirLight)

    // 地面网格
    const gridHelper = new THREE.GridHelper(4, 20, 0x333333, 0x222222)
    this.scene.add(gridHelper)

    // 初始化骨骼
    this.initSkeleton()

    this.animate()
  }

  /** 初始化骨骼几何体 */
  private initSkeleton(): void {
    const jointGeo = new THREE.SphereGeometry(0.03, 16, 16)
    const jointMat = new THREE.MeshStandardMaterial({ color: JOINT_COLOR })

    // 创建 33 个关节球
    for (let i = 0; i < 33; i++) {
      const mesh = new THREE.Mesh(jointGeo, jointMat)
      mesh.visible = false
      this.scene.add(mesh)
      this.joints.push(mesh)
    }

    // 创建骨骼连接
    const boneMat = new THREE.MeshStandardMaterial({ color: BONE_COLOR })
    for (let i = 0; i < SKELETON_CONNECTIONS.length; i++) {
      const geo = new THREE.CylinderGeometry(0.015, 0.015, 1, 8)
      geo.translate(0, 0.5, 0)
      geo.rotateX(Math.PI / 2)
      const mesh = new THREE.Mesh(geo, boneMat)
      mesh.visible = false
      this.scene.add(mesh)
      this.bones.push(mesh)
    }
  }

  /** 更新姿态 */
  updatePose(landmarks: PoseLandmark[]): void {
    if (!landmarks || landmarks.length < 33) return

    // 更新关节位置
    for (let i = 0; i < 33; i++) {
      const lm = landmarks[i]
      // MediaPipe 坐标系: x 右, y 下, z 前 → Three.js: x 右, y 上, z 前
      this.joints[i].position.set(lm.x - 0.5, -lm.y + 1, -lm.z)
      this.joints[i].visible = lm.visibility > 0.3
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

      // 计算骨骼方向和长度
      const startVec = startJoint.position
      const endVec = endJoint.position
      const direction = new THREE.Vector3().subVectors(endVec, startVec)
      const length = direction.length()

      // 设置位置和方向
      this.bones[i].position.copy(startVec)
      this.bones[i].scale.set(1, 1, length)
      this.bones[i].lookAt(endVec)
    }
  }

  /** 设置问题关节高亮 */
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
      const mat = this.joints[idx].material as THREE.MeshStandardMaterial
      if (problemJoints.includes(name)) {
        mat.color.setHex(PROBLEM_COLOR)
      } else {
        mat.color.setHex(JOINT_COLOR)
      }
    }
  }

  /** 重置相机 */
  resetCamera(): void {
    this.camera.position.set(0, 1.2, 3)
    this.controls.target.set(0, 1, 0)
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
    this.container.removeChild(this.renderer.domElement)
  }
}
