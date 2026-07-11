import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import type { PoseLandmark } from '@/types/pose'

// MediaPipe 33 关键点骨骼连接
const SKELETON_CONNECTIONS: [number, number][] = [
  [0, 1], [0, 2], [1, 3], [2, 4],
  [11, 12], [23, 24], [11, 23], [12, 24],
  [11, 13], [13, 15], [15, 17], [15, 19], [15, 21],
  [12, 14], [14, 16], [16, 18], [16, 20], [16, 22],
  [23, 25], [25, 27], [27, 29], [27, 31],
  [24, 26], [26, 28], [28, 30], [28, 32],
]

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

  /** 初始化33关节 + 骨骼连线 */
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

  /** 更新姿态：驱动关节位置和骨骼连线 */
  updatePose(landmarks: PoseLandmark[]): {
    hipCenter: { x: number; y: number; z: number }
    shoulderCenter: { x: number; y: number; z: number }
    meshPosition: { x: number; y: number; z: number }
    meshScale: number
    torsoLength: number
  } | null {
    if (!landmarks || landmarks.length < 33) return null

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

    // 计算调试数据
    const hipX = ((landmarks[23].x + landmarks[24].x) / 2 - 0.5) * scaleX
    const hipY = (1 - (landmarks[23].y + landmarks[24].y) / 2) * scaleY
    const hipZ = ((landmarks[23].z + landmarks[24].z) / 2)
    const shoulderY = (1 - (landmarks[11].y + landmarks[12].y) / 2) * scaleY
    const shoulderX = ((landmarks[11].x + landmarks[12].x) / 2 - 0.5) * scaleX
    const torsoLength = Math.abs(shoulderY - hipY)

    return {
      hipCenter: { x: hipX, y: hipY, z: hipZ },
      shoulderCenter: { x: shoulderX, y: shoulderY, z: hipZ },
      meshPosition: { x: hipX, y: (hipY + shoulderY) / 2, z: hipZ },
      meshScale: 1,
      torsoLength,
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
