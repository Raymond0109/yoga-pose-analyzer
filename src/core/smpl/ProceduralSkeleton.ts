import * as THREE from 'three'
import type { PoseLandmark, PoseDifference } from '@/types/pose'

/**
 * 程序化骨骼人体 v5 — 矫正可视化
 */

interface SegDef {
  name: string
  from: number
  to: number
  rTop: number
  rBot: number
}

const SEGS: SegDef[] = [
  { name: 'Torso',    from: -1, to: -2, rTop: 0.07, rBot: 0.09 },
  { name: 'Neck',     from: -2, to: -3, rTop: 0.030, rBot: 0.040 },
  { name: 'Chest',    from: 12, to: 11, rTop: 0.035, rBot: 0.035 },
  { name: 'LArm',     from: 11, to: 13, rTop: 0.032, rBot: 0.028 },
  { name: 'LForeArm', from: 13, to: 15, rTop: 0.028, rBot: 0.020 },
  { name: 'LHand',    from: 15, to: 19, rTop: 0.020, rBot: 0.010 },
  { name: 'RArm',     from: 12, to: 14, rTop: 0.032, rBot: 0.028 },
  { name: 'RForeArm', from: 14, to: 16, rTop: 0.028, rBot: 0.020 },
  { name: 'RHand',    from: 16, to: 20, rTop: 0.020, rBot: 0.010 },
  { name: 'LThigh',   from: 23, to: 25, rTop: 0.055, rBot: 0.042 },
  { name: 'LCalf',    from: 25, to: 27, rTop: 0.042, rBot: 0.030 },
  { name: 'LFoot',    from: 27, to: 31, rTop: 0.030, rBot: 0.020 },
  { name: 'RThigh',   from: 24, to: 26, rTop: 0.055, rBot: 0.042 },
  { name: 'RCalf',    from: 26, to: 28, rTop: 0.042, rBot: 0.030 },
  { name: 'RFoot',    from: 28, to: 32, rTop: 0.030, rBot: 0.020 },
]

const JOINT_DEFS: [number, number][] = [
  [-2, 0.045],
  [11, 0.035], [12, 0.035],
  [13, 0.025], [14, 0.025],
  [15, 0.018], [16, 0.018],
  [23, 0.055], [24, 0.055],
  [25, 0.040], [26, 0.040],
  [27, 0.030], [28, 0.030],
]

// 关节名 → landmark索引
const JOINT_NAME_MAP: Record<string, number> = {
  left_elbow: 13, right_elbow: 14,
  left_knee: 25, right_knee: 26,
  left_hip: 23, right_hip: 24,
  left_shoulder: 11, right_shoulder: 12,
}

// 关节名 → [父landmark, 子landmark]（用于计算肢体方向）
const JOINT_LIMB_MAP: Record<string, [number, number]> = {
  left_elbow: [11, 15],     // 肩→腕（整条手臂方向）
  right_elbow: [12, 16],
  left_knee: [23, 27],      // 髋→踝（整条腿方向）
  right_knee: [24, 28],
  left_hip: [11, 25],       // 肩→膝（躯干到大腿方向）
  right_hip: [12, 26],
  left_shoulder: [0, 13],   // 头→肘（肩的朝向）
  right_shoulder: [0, 14],
}

const BODY_COLOR = 0xc9a88a
const JOINT_COLOR = 0xb89878
const SEVERITY_COLORS = {
  good: 0x52c41a,
  warning: 0xfaad14,
  bad: 0xff4d4f,
}
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
  private jointMeshes: { mesh: THREE.Mesh; idx: number; origColor: number }[] = []
  private correctionArrows: THREE.Group
  private correctionLabels: THREE.Sprite[] = []
  private lastLandmarks: PoseLandmark[] = []

  constructor(scene: THREE.Scene) {
    this.scene = scene
    this.group = new THREE.Group()
    this.correctionArrows = new THREE.Group()
    this.group.add(this.correctionArrows)

    const bodyMat = new THREE.MeshStandardMaterial({
      color: BODY_COLOR, roughness: 0.55, metalness: 0.02,
    })
    const jointMat = new THREE.MeshStandardMaterial({
      color: JOINT_COLOR, roughness: 0.45, metalness: 0.05,
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
    this.headSphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.075, 16, 16), bodyMat.clone(),
    )
    this.headSphere.name = 'Head'
    this.group.add(this.headSphere)

    // 关节球
    for (const [idx, radius] of JOINT_DEFS) {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(radius, 10, 10),
        jointMat.clone(),
      )
      mesh.name = `joint_${idx}`
      this.group.add(mesh)
      this.jointMeshes.push({ mesh, idx, origColor: JOINT_COLOR })
    }

    this.scene.add(this.group)
  }

  update(landmarks: PoseLandmark[]): void {
    if (!landmarks || landmarks.length < 33) return
    this.lastLandmarks = landmarks

    const jp = this.computePositions(landmarks)

    // 身体段
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
      if (pos) { mesh.position.copy(pos); mesh.visible = true }
      else { mesh.visible = false }
    }
  }

  /** 显示矫正可视化 */
  showCorrections(differences: PoseDifference[], jp?: Record<number, THREE.Vector3>): void {
    this.clearCorrections()

    const positions = jp || this.computePositions(this.lastLandmarks)

    for (const diff of differences) {
      if (diff.severity === 'good') continue

      const idx = JOINT_NAME_MAP[diff.joint]
      if (idx === undefined) continue

      // 高亮关节球
      const jm = this.jointMeshes.find(j => j.idx === idx)
      if (jm) {
        ;(jm.mesh.material as THREE.MeshStandardMaterial).color.setHex(
          SEVERITY_COLORS[diff.severity],
        )
      }

      // 计算矫正方向
      const pos = positions[idx]
      if (!pos) continue

      const limbDef = JOINT_LIMB_MAP[diff.joint]
      if (!limbDef) continue

      const [parentIdx, childIdx] = limbDef
      const parentPos = positions[parentIdx]
      const childPos = positions[childIdx]
      if (!parentPos || !childPos) continue

      // 肢体方向（从关节到子节点）
      const limbDir = new THREE.Vector3().subVectors(childPos, pos).normalize()

      // 垂直方向：肢体方向 × 世界Y轴 = 水平垂直方向
      const up = new THREE.Vector3(0, 1, 0)
      const perpDir = new THREE.Vector3().crossVectors(limbDir, up).normalize()

      // 如果垂直方向太小（肢体接近垂直），用另一个垂直方向
      if (perpDir.lengthSq() < 0.01) {
        perpDir.crossVectors(limbDir, new THREE.Vector3(1, 0, 0)).normalize()
      }

      // delta > 0 表示当前角度 > 目标角度（需要弯曲更多）
      // delta < 0 表示当前角度 < 目标角度（需要伸直）
      // 箭头方向：垂直于肢体，指向修正方向
      const sign = diff.delta > 0 ? 1 : -1
      const arrowDir = perpDir.multiplyScalar(sign)

      // 箭头长度与偏差成正比
      const arrowLen = Math.min(Math.abs(diff.delta) / 60, 0.3)

      // 创建箭头
      const arrowGroup = new THREE.Group()
      arrowGroup.position.copy(pos)

      const color = SEVERITY_COLORS[diff.severity]

      // 箭头杆
      const shaftGeo = new THREE.CylinderGeometry(0.008, 0.008, arrowLen, 6)
      shaftGeo.translate(0, arrowLen / 2, 0)
      const shaft = new THREE.Mesh(shaftGeo, new THREE.MeshBasicMaterial({ color }))
      shaft.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), arrowDir)
      arrowGroup.add(shaft)

      // 箭头尖
      const headGeo = new THREE.ConeGeometry(0.02, 0.04, 8)
      headGeo.translate(0, arrowLen + 0.02, 0)
      const head = new THREE.Mesh(headGeo, new THREE.MeshBasicMaterial({ color }))
      head.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), arrowDir)
      arrowGroup.add(head)

      this.correctionArrows.add(arrowGroup)

      // 偏差标签
      const canvas = document.createElement('canvas')
      canvas.width = 128
      canvas.height = 48
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = diff.severity === 'bad' ? '#ff4d4f' : '#faad14'
      ctx.fillRect(0, 0, 128, 48)
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 20px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(`${diff.delta > 0 ? '+' : ''}${diff.delta.toFixed(0)}°`, 64, 32)

      const texture = new THREE.CanvasTexture(canvas)
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }))
      sprite.position.copy(pos).addScaledVector(arrowDir, arrowLen + 0.08)
      sprite.scale.set(0.12, 0.05, 1)
      this.group.add(sprite)
      this.correctionLabels.push(sprite)
    }
  }

  clearCorrections(): void {
    // 清除箭头
    while (this.correctionArrows.children.length > 0) {
      const child = this.correctionArrows.children[0] as THREE.Group
      child.traverse(c => {
        if (c instanceof THREE.Mesh) {
          c.geometry.dispose()
          ;(c.material as THREE.Material).dispose()
        }
      })
      this.correctionArrows.remove(child)
    }

    // 清除标签
    for (const sprite of this.correctionLabels) {
      ;(sprite.material as THREE.Material).dispose()
      this.group.remove(sprite)
    }
    this.correctionLabels = []

    // 恢复关节球颜色
    for (const jm of this.jointMeshes) {
      ;(jm.mesh.material as THREE.MeshStandardMaterial).color.setHex(jm.origColor)
    }
  }

  private computePositions(landmarks: PoseLandmark[]): Record<number, THREE.Vector3> {
    const jp: Record<number, THREE.Vector3> = {}
    for (let i = 0; i < 33; i++) {
      const lm = landmarks[i]
      if (!lm) continue
      jp[i] = new THREE.Vector3((lm.x - 0.5) * 1.4, (1 - lm.y) * 2.8, (lm.z || 0))
    }
    if (jp[23] && jp[24]) jp[-1] = new THREE.Vector3().addVectors(jp[23], jp[24]).multiplyScalar(0.5)
    if (jp[11] && jp[12]) jp[-2] = new THREE.Vector3().addVectors(jp[11], jp[12]).multiplyScalar(0.5)
    if (jp[-2] && jp[0]) jp[-3] = new THREE.Vector3().lerpVectors(jp[-2], jp[0], 0.45)
    return jp
  }

  private updateHead(jp: Record<number, THREE.Vector3>): void {
    const neck = jp[-3]
    const nose = jp[0]
    if (!nose) { this.headSphere.visible = false; return }
    this.headSphere.visible = true
    if (neck) {
      const headDir = new THREE.Vector3().subVectors(nose, neck).normalize()
      this.headSphere.position.copy(neck).addScaledVector(headDir, 0.12)
    } else {
      this.headSphere.position.copy(nose).add(new THREE.Vector3(0, 0.08, 0))
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
