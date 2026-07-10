import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import type { PoseLandmark } from '@/types/pose'
import type { MuscleTensionData } from '@/types/smpl'
import { MuscleMapper } from './MuscleMapper'
import { ProceduralBody } from './ProceduralBody'

// MediaPipe 33 关键点骨骼连接
const SKELETON_CONNECTIONS: [number, number][] = [
  [0, 1], [0, 2], [1, 3], [2, 4],
  [11, 12], [23, 24], [11, 23], [12, 24],
  [11, 13], [13, 15], [15, 17], [15, 19], [15, 21],
  [12, 14], [14, 16], [16, 18], [16, 20], [16, 22],
  [23, 25], [25, 27], [27, 29], [27, 31],
  [24, 26], [26, 28], [28, 30], [28, 32],
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

export class SMPLRenderer {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private controls: OrbitControls
  private joints: THREE.Mesh[] = []
  private bones: THREE.Mesh[] = []
  private container: HTMLElement
  private showMuscles = false
  private showBody = true

  // 程序化身体
  private proceduralBody: ProceduralBody | null = null

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
    this.proceduralBody = new ProceduralBody(this.scene)
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

  /** 更新姿态 */
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
    const jointPositions: THREE.Vector3[] = []
    for (let i = 0; i < 33; i++) {
      const lm = landmarks[i]
      if (!lm) {
        jointPositions.push(new THREE.Vector3())
        continue
      }

      const x = (lm.x - 0.5) * scaleX
      const y = (1 - lm.y) * scaleY
      const z = (lm.z || 0) * scaleZ

      this.joints[i].position.set(x, y, z)
      this.joints[i].visible = (lm.visibility ?? 0.5) > 0.2
      jointPositions.push(new THREE.Vector3(x, y, z))
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

    // 更新程序化身体
    if (this.proceduralBody && this.showBody) {
      this.proceduralBody.update(jointPositions)
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

    // 更新身体颜色
    if (this.proceduralBody) {
      const avgTension = tensions.length > 0
        ? tensions.reduce((s, t) => s + t.tension, 0) / tensions.length
        : 0
      this.proceduralBody.setMuscleColor(avgTension)
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

  /** 切换身体显示 */
  setShowBody(show: boolean): void {
    this.showBody = show
    if (this.proceduralBody) {
      this.proceduralBody.setVisible(show)
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
    this.proceduralBody?.dispose()
    this.renderer.dispose()
    this.controls.dispose()
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement)
    }
  }
}
