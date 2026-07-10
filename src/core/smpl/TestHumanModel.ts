/**
 * 创建带骨骼的人体测试模型
 * 用于测试骨骼动画功能
 */

import * as THREE from 'three'

export function createTestHumanModel(): THREE.Group {
  const group = new THREE.Group()
  group.name = 'HumanModel'

  // 材质
  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xE8B89D,
    roughness: 0.6,
    metalness: 0.1,
  })

  const jointMat = new THREE.MeshStandardMaterial({
    color: 0x888888,
    roughness: 0.5,
  })

  // 创建骨骼层级
  const bones: THREE.Bone[] = []

  // 0: 骨盆 (根骨骼)
  const pelvis = new THREE.Bone()
  pelvis.name = 'pelvis'
  pelvis.position.set(0, 0.95, 0)
  bones.push(pelvis)

  // 1: 脊柱
  const spine = new THREE.Bone()
  spine.name = 'spine'
  spine.position.set(0, 0.15, 0)
  pelvis.add(spine)
  bones.push(spine)

  // 2: 胸腔
  const chest = new THREE.Bone()
  chest.name = 'chest'
  chest.position.set(0, 0.15, 0)
  spine.add(chest)
  bones.push(chest)

  // 3: 颈部
  const neck = new THREE.Bone()
  neck.name = 'neck'
  neck.position.set(0, 0.15, 0)
  chest.add(neck)
  bones.push(neck)

  // 4: 头部
  const head = new THREE.Bone()
  head.name = 'head'
  head.position.set(0, 0.12, 0)
  neck.add(head)
  bones.push(head)

  // 5: 左肩
  const leftShoulder = new THREE.Bone()
  leftShoulder.name = 'leftShoulder'
  leftShoulder.position.set(-0.2, 0.12, 0)
  chest.add(leftShoulder)
  bones.push(leftShoulder)

  // 6: 左上臂
  const leftUpperArm = new THREE.Bone()
  leftUpperArm.name = 'leftUpperArm'
  leftUpperArm.position.set(-0.05, 0, 0)
  leftShoulder.add(leftUpperArm)
  bones.push(leftUpperArm)

  // 7: 左前臂
  const leftForeArm = new THREE.Bone()
  leftForeArm.name = 'leftForeArm'
  leftForeArm.position.set(-0.25, 0, 0)
  leftUpperArm.add(leftForeArm)
  bones.push(leftForeArm)

  // 8: 左手
  const leftHand = new THREE.Bone()
  leftHand.name = 'leftHand'
  leftHand.position.set(-0.22, 0, 0)
  leftForeArm.add(leftHand)
  bones.push(leftHand)

  // 9: 右肩
  const rightShoulder = new THREE.Bone()
  rightShoulder.name = 'rightShoulder'
  rightShoulder.position.set(0.2, 0.12, 0)
  chest.add(rightShoulder)
  bones.push(rightShoulder)

  // 10: 右上臂
  const rightUpperArm = new THREE.Bone()
  rightUpperArm.name = 'rightUpperArm'
  rightUpperArm.position.set(0.05, 0, 0)
  rightShoulder.add(rightUpperArm)
  bones.push(rightUpperArm)

  // 11: 右前臂
  const rightForeArm = new THREE.Bone()
  rightForeArm.name = 'rightForeArm'
  rightForeArm.position.set(0.25, 0, 0)
  rightUpperArm.add(rightForeArm)
  bones.push(rightForeArm)

  // 12: 右手
  const rightHand = new THREE.Bone()
  rightHand.name = 'rightHand'
  rightHand.position.set(0.22, 0, 0)
  rightForeArm.add(rightHand)
  bones.push(rightHand)

  // 13: 左髋
  const leftHip = new THREE.Bone()
  leftHip.name = 'leftHip'
  leftHip.position.set(-0.1, 0, 0)
  pelvis.add(leftHip)
  bones.push(leftHip)

  // 14: 左大腿
  const leftUpperLeg = new THREE.Bone()
  leftUpperLeg.name = 'leftUpperLeg'
  leftUpperLeg.position.set(0, -0.05, 0)
  leftHip.add(leftUpperLeg)
  bones.push(leftUpperLeg)

  // 15: 左小腿
  const leftLeg = new THREE.Bone()
  leftLeg.name = 'leftLeg'
  leftLeg.position.set(0, -0.4, 0)
  leftUpperLeg.add(leftLeg)
  bones.push(leftLeg)

  // 16: 左脚
  const leftFoot = new THREE.Bone()
  leftFoot.name = 'leftFoot'
  leftFoot.position.set(0, -0.4, 0)
  leftLeg.add(leftFoot)
  bones.push(leftFoot)

  // 17: 右髋
  const rightHip = new THREE.Bone()
  rightHip.name = 'rightHip'
  rightHip.position.set(0.1, 0, 0)
  pelvis.add(rightHip)
  bones.push(rightHip)

  // 18: 右大腿
  const rightUpperLeg = new THREE.Bone()
  rightUpperLeg.name = 'rightUpperLeg'
  rightUpperLeg.position.set(0, -0.05, 0)
  rightHip.add(rightUpperLeg)
  bones.push(rightUpperLeg)

  // 19: 右小腿
  const rightLeg = new THREE.Bone()
  rightLeg.name = 'rightLeg'
  rightLeg.position.set(0, -0.4, 0)
  rightUpperLeg.add(rightLeg)
  bones.push(rightLeg)

  // 20: 右脚
  const rightFoot = new THREE.Bone()
  rightFoot.name = 'rightFoot'
  rightFoot.position.set(0, -0.4, 0)
  rightLeg.add(rightFoot)
  bones.push(rightFoot)

  // 创建骨架
  const skeleton = new THREE.Skeleton(bones)

  // 创建身体部位几何体
  const bodyParts = createBodyParts()

  // 创建蒙皮网格
  const geometry = createGeometryWithSkinning(bodyParts, bones)
  const mesh = new THREE.SkinnedMesh(geometry, skinMat)
  mesh.name = 'HumanBody'
  mesh.add(pelvis)
  mesh.bind(skeleton)
  group.add(mesh)

  // 添加骨骼辅助线（调试用）
  const skeletonHelper = new THREE.SkeletonHelper(mesh)
  group.add(skeletonHelper)

  return group
}

// 身体部位定义
interface BodyPart {
  name: string
  geometry: THREE.BufferGeometry
  boneIndices: number[]
  boneWeights: number[]
}

function createBodyParts(): BodyPart[] {
  const parts: BodyPart[] = []

  // 头部
  const headGeo = new THREE.SphereGeometry(0.1, 16, 16)
  headGeo.translate(0, 0.05, 0)
  parts.push({
    name: 'head',
    geometry: headGeo,
    boneIndices: [4, 3, 0, 0],
    boneWeights: [1.0, 0.0, 0.0, 0.0],
  })

  // 躯干
  const torsoGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.4, 8)
  torsoGeo.translate(0, 0.2, 0)
  parts.push({
    name: 'torso',
    geometry: torsoGeo,
    boneIndices: [2, 1, 0, 0],
    boneWeights: [0.6, 0.4, 0.0, 0.0],
  })

  // 左上臂
  const leftUpperArmGeo = new THREE.CylinderGeometry(0.04, 0.035, 0.25, 8)
  leftUpperArmGeo.rotateZ(Math.PI / 2)
  leftUpperArmGeo.translate(-0.125, 0, 0)
  parts.push({
    name: 'leftUpperArm',
    geometry: leftUpperArmGeo,
    boneIndices: [6, 5, 0, 0],
    boneWeights: [0.7, 0.3, 0.0, 0.0],
  })

  // 左前臂
  const leftForeArmGeo = new THREE.CylinderGeometry(0.035, 0.03, 0.22, 8)
  leftForeArmGeo.rotateZ(Math.PI / 2)
  leftForeArmGeo.translate(-0.11, 0, 0)
  parts.push({
    name: 'leftForeArm',
    geometry: leftForeArmGeo,
    boneIndices: [7, 6, 0, 0],
    boneWeights: [0.8, 0.2, 0.0, 0.0],
  })

  // 右上臂
  const rightUpperArmGeo = new THREE.CylinderGeometry(0.04, 0.035, 0.25, 8)
  rightUpperArmGeo.rotateZ(-Math.PI / 2)
  rightUpperArmGeo.translate(0.125, 0, 0)
  parts.push({
    name: 'rightUpperArm',
    geometry: rightUpperArmGeo,
    boneIndices: [10, 9, 0, 0],
    boneWeights: [0.7, 0.3, 0.0, 0.0],
  })

  // 右前臂
  const rightForeArmGeo = new THREE.CylinderGeometry(0.035, 0.03, 0.22, 8)
  rightForeArmGeo.rotateZ(-Math.PI / 2)
  rightForeArmGeo.translate(0.11, 0, 0)
  parts.push({
    name: 'rightForeArm',
    geometry: rightForeArmGeo,
    boneIndices: [11, 10, 0, 0],
    boneWeights: [0.8, 0.2, 0.0, 0.0],
  })

  // 左大腿
  const leftThighGeo = new THREE.CylinderGeometry(0.06, 0.05, 0.4, 8)
  leftThighGeo.translate(0, -0.2, 0)
  parts.push({
    name: 'leftThigh',
    geometry: leftThighGeo,
    boneIndices: [14, 13, 0, 0],
    boneWeights: [0.7, 0.3, 0.0, 0.0],
  })

  // 左小腿
  const leftLegGeo = new THREE.CylinderGeometry(0.05, 0.04, 0.4, 8)
  leftLegGeo.translate(0, -0.2, 0)
  parts.push({
    name: 'leftLeg',
    geometry: leftLegGeo,
    boneIndices: [15, 14, 0, 0],
    boneWeights: [0.8, 0.2, 0.0, 0.0],
  })

  // 右大腿
  const rightThighGeo = new THREE.CylinderGeometry(0.06, 0.05, 0.4, 8)
  rightThighGeo.translate(0, -0.2, 0)
  parts.push({
    name: 'rightThigh',
    geometry: rightThighGeo,
    boneIndices: [18, 17, 0, 0],
    boneWeights: [0.7, 0.3, 0.0, 0.0],
  })

  // 右小腿
  const rightLegGeo = new THREE.CylinderGeometry(0.05, 0.04, 0.4, 8)
  rightLegGeo.translate(0, -0.2, 0)
  parts.push({
    name: 'rightLeg',
    geometry: rightLegGeo,
    boneIndices: [19, 18, 0, 0],
    boneWeights: [0.8, 0.2, 0.0, 0.0],
  })

  return parts
}

// 创建带蒙皮的几何体
function createGeometryWithSkinning(
  parts: BodyPart[],
  _bones: THREE.Bone[]
): THREE.BufferGeometry {
  // 合并所有几何体
  const geometries = parts.map(p => p.geometry)
  const merged = mergeGeometries(geometries)

  // 添加蒙皮属性
  const vertexCount = merged.attributes.position.count
  const skinIndices = new Float32Array(vertexCount * 4)
  const skinWeights = new Float32Array(vertexCount * 4)

  // 简单分配：每个顶点绑定到最近的骨骼
  // 这里简化处理，实际需要更精确的权重计算
  let vertexOffset = 0
  for (const part of parts) {
    const partVertexCount = part.geometry.attributes.position.count
    for (let i = 0; i < partVertexCount; i++) {
      const idx = (vertexOffset + i) * 4
      skinIndices[idx] = part.boneIndices[0]
      skinIndices[idx + 1] = part.boneIndices[1]
      skinIndices[idx + 2] = part.boneIndices[2]
      skinIndices[idx + 3] = part.boneIndices[3]
      skinWeights[idx] = part.boneWeights[0]
      skinWeights[idx + 1] = part.boneWeights[1]
      skinWeights[idx + 2] = part.boneWeights[2]
      skinWeights[idx + 3] = part.boneWeights[3]
    }
    vertexOffset += partVertexCount
  }

  merged.setAttribute('skinIndex', new THREE.BufferAttribute(skinIndices, 4))
  merged.setAttribute('skinWeight', new THREE.BufferAttribute(skinWeights, 4))

  return merged
}

// 合并几何体
function mergeGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
  let totalVertices = 0
  let totalIndices = 0

  for (const geo of geometries) {
    totalVertices += geo.attributes.position.count
    if (geo.index) {
      totalIndices += geo.index.count
    }
  }

  const positions = new Float32Array(totalVertices * 3)
  const normals = new Float32Array(totalVertices * 3)
  const indices = new Uint32Array(totalIndices)

  let vertexOffset = 0
  let indexOffset = 0

  for (const geo of geometries) {
    const posArray = geo.attributes.position.array as Float32Array
    const normArray = geo.attributes.normal?.array as Float32Array

    positions.set(posArray, vertexOffset * 3)
    if (normArray) {
      normals.set(normArray, vertexOffset * 3)
    }

    if (geo.index) {
      const idxArray = geo.index.array as Uint16Array
      for (let i = 0; i < idxArray.length; i++) {
        indices[indexOffset + i] = idxArray[i] + vertexOffset
      }
      indexOffset += idxArray.length
    }

    vertexOffset += geo.attributes.position.count
  }

  const merged = new THREE.BufferGeometry()
  merged.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  merged.setAttribute('normal', new THREE.BufferAttribute(normals, 3))
  merged.setIndex(new THREE.BufferAttribute(indices, 1))

  return merged
}
