import * as THREE from 'three'
import type { PoseLandmark } from '@/types/pose'

/**
 * 程序化骨骼人体 v3 — 胶囊体 + 胸肩 + 改善材质
 */

interface SegDef {
  name: string
  from: number
  to: number
  rTop: number
  rBot: number
}

const SEGS: SegDef[] = [
  // 躯干（-1=髋中心, -2=肩中心）
  { name: 'Torso',    from: -1, to: -2, rTop: 0.07, rBot: 0.09 },
  // 胸肩（横跨双肩）
  { name: 'Chest',    from: 12, to: 11, rTop: 0.04, rBot: 0.04 },
  // 左臂
  { name: 'LArm',     from: 11, to: 13, rTop: 0.032, rBot: 0.028 },
  { name: 'LForeArm', from: 13, to: 15, rTop: 0.028, rBot: 0.020 },
  // 右臂
  { name: 'RArm',     from: 12, to: 14, rTop: 0.032, rBot: 0.028 },
  { name: 'RForeArm', from: 14, to: 16, rTop: 0.028, rBot: 0.020 },
  // 左腿
  { name: 'LThigh',   from: 23, to: 25, rTop: 0.055, rBot: 0.042 },
  { name: 'LCalf',    from: 25, to: 27, rTop: 0.042, rBot: 0.030 },
  // 右腿
  { name: 'RThigh',   from: 24, to: 26, rTop: 0.055, rBot: 0.042 },
  { name: 'RCalf',    from: 26, to: 28, rTop: 0.042, rBot: 0.030 },
]

const BODY_COLOR = 0x6ba8c9
const RADIAL_SEGS = 10

function makeCapsuleGeo(rTop: number, rBot: number): THREE.BufferGeometry {
  const positions: number[] = []
  const indices: number[] = []
  const rings = 6

  for (let r = 0; r <= rings; r++) {
    const t = r / rings
    const y = -0.5 + t
    const radius = rBot + (rTop - rBot) * t
    for (let s = 0; s <= RADIAL_SEGS; s++) {
      const a = (s / RADIAL_SEGS) * Math.PI * 2
      positions.push(Math.cos(a) * radius, y, Math.sin(a) * radius)
    }
  }

  for (let r = 0; r < rings; r++) {
    for (let s = 0; s < RADIAL_SEGS; s++) {
      const a = r * (RADIAL_SEGS + 1) + s
      const b = a + 1
      const c = a + RADIAL_SEGS + 1
      const d = c + 1
      indices.push(a, c, b, b, c, d)
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  return geo
}

export class ProceduralSkeleton {
  private scene: THREE.Scene
  private group: THREE.Group
  private parts: { mesh: THREE.Mesh; def: SegDef }[] = []
  private headSphere: THREE.Mesh
  private jointSpheres: THREE.Mesh[] = []
  private material: THREE.MeshStandardMaterial

  constructor(scene: THREE.Scene) {
    this.scene = scene
    this.group = new THREE.Group()

    this.material = new THREE.MeshStandardMaterial({
      color: BODY_COLOR,
      roughness: 0.35,
      metalness: 0.08,
    })

    // 创建身体段
    for (const def of SEGS) {
      const geo = makeCapsuleGeo(def.rTop, def.rBot)
      const mesh = new THREE.Mesh(geo, this.material.clone())
      mesh.name = def.name
      this.group.add(mesh)
      this.parts.push({ mesh, def })
    }

    // 头部
    const headGeo = new THREE.SphereGeometry(0.075, 16, 16)
    this.headSphere = new THREE.Mesh(headGeo, this.material.clone())
    this.headSphere.name = 'Head'
    this.group.add(this.headSphere)

    // 关节小球（半透明）
    const jointMat = new THREE.MeshStandardMaterial({
      color: 0x52c41a,
      transparent: true,
      opacity: 0.6,
      roughness: 0.5,
    })
    const jointGeo = new THREE.SphereGeometry(0.018, 8, 8)
    const jointIndices = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28]
    for (const idx of jointIndices) {
      const mesh = new THREE.Mesh(jointGeo, jointMat.clone())
      mesh.name = `joint_${idx}`
      this.group.add(mesh)
      this.jointSpheres.push(mesh)
    }

    this.scene.add(this.group)
  }

  update(landmarks: PoseLandmark[]): void {
    if (!landmarks || landmarks.length < 33) return

    const jp: THREE.Vector3[] = []
    for (let i = 0; i < 33; i++) {
      const lm = landmarks[i]
      if (!lm) { jp.push(new THREE.Vector3()); continue }
      jp.push(new THREE.Vector3(
        (lm.x - 0.5) * 1.4,
        (1 - lm.y) * 2.8,
        (lm.z || 0),
      ))
    }

    // 计算虚拟landmark: 髋中心(-1) 和 肩中心(-2)
    jp[-1] = new THREE.Vector3().addVectors(jp[23], jp[24]).multiplyScalar(0.5)
    jp[-2] = new THREE.Vector3().addVectors(jp[11], jp[12]).multiplyScalar(0.5)

    // 更新身体段
    for (const part of this.parts) {
      const { def, mesh } = part
      const from = jp[def.from]
      const to = jp[def.to]
      const dir = new THREE.Vector3().subVectors(to, from)
      const len = dir.length()
      if (len < 0.001) { mesh.visible = false; continue }
      mesh.visible = true

      mesh.position.lerpVectors(from, to, 0.5)
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize())
      mesh.scale.set(1, len, 1)
    }

    // 头部
    const nosePos = jp[0]
    const earMid = (jp[7] && jp[8])
      ? new THREE.Vector3().addVectors(jp[7], jp[8]).multiplyScalar(0.5)
      : nosePos.clone().add(new THREE.Vector3(0, 0, 0.05))
    const headCenter = new THREE.Vector3().lerpVectors(nosePos, earMid, 0.25)
    headCenter.y += 0.07
    this.headSphere.position.copy(headCenter)

    // 关节小球
    const jointIndices = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28]
    for (let i = 0; i < jointIndices.length; i++) {
      this.jointSpheres[i].position.copy(jp[jointIndices[i]])
      this.jointSpheres[i].visible = (landmarks[jointIndices[i]]?.visibility ?? 0) > 0.3
    }
  }

  /** 隐藏内部骨架（由 SMPLRenderer 控制） */
  hideSkeleton(): void {
    // 这个方法由外部调用，隐藏 SMPLRenderer 的绿色球体和蓝色线条
  }

  setVisible(visible: boolean): void { this.group.visible = visible }
  dispose(): void {
    this.scene.remove(this.group)
    this.group.traverse(child => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose()
        ;(child.material as THREE.Material).dispose()
      }
    })
  }
}
