import * as THREE from 'three'
import type { PoseLandmark } from '@/types/pose'

/**
 * 程序化骨骼人体 v4 — 颈部连接 + 关节球过渡
 */

// 身体段: [名称, 起始, 结束, 起始半径, 结束半径]
// -1=髋中心, -2=肩中心, -3=颈部(肩中心→鼻子的2/3处)
interface SegDef {
  name: string
  from: number
  to: number
  rTop: number
  rBot: number
}

const SEGS: SegDef[] = [
  { name: 'Torso',    from: -1, to: -2, rTop: 0.07, rBot: 0.09 },
  { name: 'Neck',     from: -2, to: -3, rTop: 0.05, rBot: 0.06 },
  { name: 'Chest',    from: 12, to: 11, rTop: 0.04, rBot: 0.04 },
  { name: 'LArm',     from: 11, to: 13, rTop: 0.032, rBot: 0.028 },
  { name: 'LForeArm', from: 13, to: 15, rTop: 0.028, rBot: 0.020 },
  { name: 'RArm',     from: 12, to: 14, rTop: 0.032, rBot: 0.028 },
  { name: 'RForeArm', from: 14, to: 16, rTop: 0.028, rBot: 0.020 },
  { name: 'LThigh',   from: 23, to: 25, rTop: 0.055, rBot: 0.042 },
  { name: 'LCalf',    from: 25, to: 27, rTop: 0.042, rBot: 0.030 },
  { name: 'RThigh',   from: 24, to: 26, rTop: 0.055, rBot: 0.042 },
  { name: 'RCalf',    from: 26, to: 28, rTop: 0.042, rBot: 0.030 },
]

// 关节球: [位置landmark索引, 半径]
const JOINT_DEFS: [number, number][] = [
  [-2, 0.06],  // 肩中心（最大）
  [11, 0.035], // 左肩
  [12, 0.035], // 右肩
  [13, 0.025], // 左肘
  [14, 0.025], // 右肘
  [15, 0.018], // 左腕
  [16, 0.018], // 右腕
  [23, 0.055], // 左髋
  [24, 0.055], // 右髋
  [25, 0.040], // 左膝
  [26, 0.040], // 右膝
  [27, 0.030], // 左踝
  [28, 0.030], // 右踝
]

const BODY_COLOR = 0x6ba8c9
const JOINT_COLOR = 0x5a9ab8
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
  private jointMeshes: { mesh: THREE.Mesh; idx: number }[] = []

  constructor(scene: THREE.Scene) {
    this.scene = scene
    this.group = new THREE.Group()

    const bodyMat = new THREE.MeshStandardMaterial({
      color: BODY_COLOR,
      roughness: 0.35,
      metalness: 0.08,
    })

    const jointMat = new THREE.MeshStandardMaterial({
      color: JOINT_COLOR,
      roughness: 0.3,
      metalness: 0.1,
    })

    // 身体段
    for (const def of SEGS) {
      const geo = makeCapsuleGeo(def.rTop, def.rBot)
      const mesh = new THREE.Mesh(geo, bodyMat.clone())
      mesh.name = def.name
      this.group.add(mesh)
      this.parts.push({ mesh, def })
    }

    // 头部
    const headGeo = new THREE.SphereGeometry(0.075, 16, 16)
    this.headSphere = new THREE.Mesh(headGeo, bodyMat.clone())
    this.headSphere.name = 'Head'
    this.group.add(this.headSphere)

    // 关节球
    for (const [idx, radius] of JOINT_DEFS) {
      const geo = new THREE.SphereGeometry(radius, 10, 10)
      const mesh = new THREE.Mesh(geo, jointMat.clone())
      mesh.name = `joint_${idx}`
      this.group.add(mesh)
      this.jointMeshes.push({ mesh, idx })
    }

    this.scene.add(this.group)
  }

  update(landmarks: PoseLandmark[]): void {
    if (!landmarks || landmarks.length < 33) return

    const jp = this.computePositions(landmarks)

    // 更新身体段
    for (const { def, mesh } of this.parts) {
      const from = jp[def.from]
      const to = jp[def.to]
      if (!from || !to) { mesh.visible = false; continue }

      const dir = new THREE.Vector3().subVectors(to, from)
      const len = dir.length()
      if (len < 0.001) { mesh.visible = false; continue }
      mesh.visible = true

      mesh.position.lerpVectors(from, to, 0.5)
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize())
      mesh.scale.set(1, len, 1)
    }

    // 头部
    this.updateHead(jp)

    // 关节球
    for (const { mesh, idx } of this.jointMeshes) {
      const pos = jp[idx]
      if (pos) {
        mesh.position.copy(pos)
        mesh.visible = true
      } else {
        mesh.visible = false
      }
    }
  }

  private computePositions(landmarks: PoseLandmark[]): Record<number, THREE.Vector3> {
    const jp: Record<number, THREE.Vector3> = {}

    for (let i = 0; i < 33; i++) {
      const lm = landmarks[i]
      if (!lm) continue
      jp[i] = new THREE.Vector3(
        (lm.x - 0.5) * 1.4,
        (1 - lm.y) * 2.8,
        (lm.z || 0),
      )
    }

    // 虚拟landmark
    if (jp[23] && jp[24]) {
      jp[-1] = new THREE.Vector3().addVectors(jp[23], jp[24]).multiplyScalar(0.5) // 髋中心
    }
    if (jp[11] && jp[12]) {
      jp[-2] = new THREE.Vector3().addVectors(jp[11], jp[12]).multiplyScalar(0.5) // 肩中心
    }
    if (jp[-2] && jp[0]) {
      // 颈部：肩中心到鼻子的60%处
      jp[-3] = new THREE.Vector3().lerpVectors(jp[-2], jp[0], 0.6)
    }

    return jp
  }

  private updateHead(jp: Record<number, THREE.Vector3>): void {
    const nose = jp[0]
    const neck = jp[-3]
    if (!nose) { this.headSphere.visible = false; return }
    this.headSphere.visible = true

    // 头部中心：鼻子稍微往后偏移
    const earMid = (jp[7] && jp[8])
      ? new THREE.Vector3().addVectors(jp[7], jp[8]).multiplyScalar(0.5)
      : undefined

    if (earMid) {
      this.headSphere.position.lerpVectors(nose, earMid, 0.3)
      this.headSphere.position.y += 0.05
    } else if (neck) {
      const headDir = new THREE.Vector3().subVectors(nose, neck).normalize()
      this.headSphere.position.copy(nose).addScaledVector(headDir, 0.06)
    } else {
      this.headSphere.position.copy(nose).add(new THREE.Vector3(0, 0.06, 0))
    }
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
