import * as THREE from 'three'
import type { PoseLandmark } from '@/types/pose'

/**
 * 程序化人体模型
 * 在关节位置创建胶囊体/球体，跟随骨架运动
 */

interface BodyPart {
  mesh: THREE.Mesh
  jointStart: number
  jointEnd: number
  radius: number
  name: string
}

const SKIN_COLOR = 0xE8B89D
const SCALE_X = 1.4
const SCALE_Y = 2.8
const SCALE_Z = 1.0

export class ProceduralBody {
  private scene: THREE.Scene
  private bodyParts: BodyPart[] = []
  private group: THREE.Group

  constructor(scene: THREE.Scene) {
    this.scene = scene
    this.group = new THREE.Group()
    this.scene.add(this.group)
    this.initBodyParts()
  }

  private initBodyParts(): void {
    const skinMat = new THREE.MeshStandardMaterial({
      color: SKIN_COLOR,
      roughness: 0.6,
      metalness: 0.1,
    })

    // 躯干 - 使用多个球体近似
    this.addPart('chest', 11, 12, 0.12, skinMat)      // 肩膀连线
    this.addPart('abdomen', 23, 24, 0.10, skinMat)     // 髋部连线
    this.addPart('spine', 11, 23, 0.08, skinMat, 0.5)  // 脊柱中点

    // 左臂
    this.addPart('leftUpperArm', 11, 13, 0.04, skinMat)
    this.addPart('leftLowerArm', 13, 15, 0.035, skinMat)
    this.addPart('leftHand', 15, 17, 0.025, skinMat, 0.3)

    // 右臂
    this.addPart('rightUpperArm', 12, 14, 0.04, skinMat)
    this.addPart('rightLowerArm', 14, 16, 0.035, skinMat)
    this.addPart('rightHand', 16, 18, 0.025, skinMat, 0.3)

    // 左腿
    this.addPart('leftUpperLeg', 23, 25, 0.06, skinMat)
    this.addPart('leftLowerLeg', 25, 27, 0.045, skinMat)
    this.addPart('leftFoot', 27, 31, 0.03, skinMat, 0.3)

    // 右腿
    this.addPart('rightUpperLeg', 24, 26, 0.06, skinMat)
    this.addPart('rightLowerLeg', 26, 28, 0.045, skinMat)
    this.addPart('rightFoot', 28, 32, 0.03, skinMat, 0.3)

    // 头部
    const headMat = skinMat.clone()
    this.addPart('head', 0, 0, 0.1, headMat, 0, true)
  }

  private addPart(
    name: string,
    jointStart: number,
    jointEnd: number,
    radius: number,
    material: THREE.Material,
    lengthRatio: number = 1,
    isHead: boolean = false
  ): void {
    let geometry: THREE.BufferGeometry

    if (isHead) {
      // 头部用球体
      geometry = new THREE.SphereGeometry(radius, 12, 12)
    } else {
      // 其他部位用胶囊体 (圆柱+两端半球)
      geometry = new THREE.CapsuleGeometry(radius, 0.01, 8, 12)
    }

    const mesh = new THREE.Mesh(geometry, material.clone())
    mesh.visible = false
    this.group.add(mesh)

    this.bodyParts.push({
      mesh,
      jointStart,
      jointEnd,
      radius,
      name,
    })
  }

  /** 更新身体部位位置 */
  update(joints: THREE.Vector3[]): void {
    if (joints.length < 33) return

    for (const part of this.bodyParts) {
      if (part.name === 'head') {
        // 头部位置 = 鼻子位置 + 偏移
        const nose = joints[0]
        const leftEar = joints[7]
        const rightEar = joints[8]
        const earCenter = new THREE.Vector3().addVectors(leftEar, rightEar).multiplyScalar(0.5)
        
        // 头部中心在耳朵上方
        part.mesh.position.copy(earCenter)
        part.mesh.position.y += 0.08
        part.mesh.visible = true
        continue
      }

      const start = joints[part.jointStart]
      const end = joints[part.jointEnd]

      if (!start || !end) {
        part.mesh.visible = false
        continue
      }

      // 位置 = 两点中点
      const center = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5)
      part.mesh.position.copy(center)
      part.mesh.visible = true

      // 朝向和缩放
      const direction = new THREE.Vector3().subVectors(end, start)
      const length = direction.length()

      if (length > 0.01) {
        // 旋转使胶囊体朝向终点
        const up = new THREE.Vector3(0, 1, 0)
        const quaternion = new THREE.Quaternion()
        quaternion.setFromUnitVectors(up, direction.normalize())
        part.mesh.quaternion.copy(quaternion)

        // 缩放胶囊体长度
        part.mesh.scale.set(1, length, 1)
      }
    }
  }

  /** 显示/隐藏 */
  setVisible(visible: boolean): void {
    this.group.visible = visible
  }

  /** 设置颜色 (用于肌肉热力图) */
  setMuscleColor(tension: number): void {
    const color = new THREE.Color()
    // 蓝(0) → 黄(0.5) → 红(1)
    if (tension < 0.5) {
      color.setHSL(0.6 - tension * 0.8, 0.8, 0.5)
    } else {
      color.setHSL(0.1 - (tension - 0.5) * 0.2, 0.9, 0.5)
    }

    for (const part of this.bodyParts) {
      (part.mesh.material as THREE.MeshStandardMaterial).color.copy(color)
    }
  }

  /** 释放资源 */
  dispose(): void {
    this.group.clear()
    this.scene.remove(this.group)
  }
}
