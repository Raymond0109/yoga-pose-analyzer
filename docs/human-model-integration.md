/**
 * 人体模型集成方案
 *
 * 由于SMPL模型需要注册，我们提供三种替代方案：
 *
 * 方案A: MakeHuman生成 (推荐)
 *   1. 安装 MakeHuman: https://www.makehumancommunity.org/
 *   2. 创建基础人体模型
 *   3. 导出为glTF格式
 *   4. 使用Mixamo添加骨骼动画
 *
 * 方案B: Mixamo直接使用
 *   1. 访问 https://www.mixamo.com
 *   2. 选择角色模型
 *   3. 下载glTF格式
 *   4. 集成到Three.js
 *
 * 方案C: 程序化模型增强 (当前方案改进)
 *   1. 使用多个胶囊体组合
 *   2. 添加更精细的关节控制
 *   3. 实现肌肉形变效果
 */

// 方案A: MakeHuman + Mixamo 工作流
export const MAKEHUMAN_WORKFLOW = {
  steps: [
    {
      step: 1,
      title: '安装MakeHuman',
      description: '下载并安装 MakeHuman Community Edition',
      url: 'https://www.makehumancommunity.org/',
      notes: '支持 Windows/macOS/Linux'
    },
    {
      step: 2,
      title: '创建人体模型',
      description: '在MakeHuman中创建基础人体模型',
      settings: {
        gender: 'neutral',
        age: 'adult',
        weight: 'average',
        height: 'average',
        muscle: 'average'
      }
    },
    {
      step: 3,
      title: '导出为FBX/OBJ',
      description: '导出模型为FBX或OBJ格式',
      notes: '确保勾选"skeleton"选项'
    },
    {
      step: 4,
      title: '上传到Mixamo',
      description: '访问 mixamo.com 上传模型',
      url: 'https://www.mixamo.com',
      notes: 'Mixamo会自动绑定骨骼'
    },
    {
      step: 5,
      title: '下载glTF',
      description: '从Mixamo下载glTF格式',
      settings: {
        format: 'glTF',
        skin: 'with Skin',
        fps: '30'
      }
    },
    {
      step: 6,
      title: '集成到Three.js',
      description: '使用GLTFLoader加载模型',
      notes: '使用SkeletonUtils进行骨骼控制'
    }
  ]
}

// 方案B: Mixamo直接使用
export const MIXAMO_WORKFLOW = {
  steps: [
    {
      step: 1,
      title: '访问Mixamo',
      description: '打开 https://www.mixamo.com',
      url: 'https://www.mixamo.com'
    },
    {
      step: 2,
      title: '选择角色',
      description: '从预设角色中选择一个',
      notes: '推荐选择"Y Bot"或"X Bot"'
    },
    {
      step: 3,
      title: '下载模型',
      description: '下载glTF格式（With Skin）',
      settings: {
        format: 'glTF',
        skin: 'with Skin',
        fps: '30'
      }
    },
    {
      step: 4,
      title: '集成到项目',
      description: '将模型文件放入 assets/models/ 目录',
      notes: '需要 .gltf + .bin + 纹理文件'
    }
  ]
}

// 方案C: 程序化模型增强
export const PROCEDURAL_WORKFLOW = {
  steps: [
    {
      step: 1,
      title: '增强当前模型',
      description: '使用更精细的几何体组合',
      improvements: [
        '使用Subdivision Surface细分曲面',
        '添加法线贴图增加细节',
        '实现肌肉形变效果'
      ]
    },
    {
      step: 2,
      title: '添加骨骼系统',
      description: '实现完整的骨骼动画',
      features: [
        '24个标准骨骼',
        '逆运动学(IK)',
        '肌肉形变'
      ]
    }
  ]
}

// glTF加载器配置
export const GLTF_CONFIG = {
  // 模型路径
  modelPath: '/assets/models/human.glb',
  // 动画配置
  animation: {
    loop: true,
    crossFadeDuration: 0.3
  },
  // 骨骼控制
  skeleton: {
    jointCount: 24,
    // SMPL骨骼映射
    jointMap: {
      'pelvis': 0,
      'spine': 3,
      'spine1': 6,
      'spine2': 9,
      'neck': 12,
      'head': 15,
      'left_shoulder': 13,
      'left_arm': 16,
      'left_foreArm': 18,
      'left_hand': 20,
      'right_shoulder': 14,
      'right_arm': 17,
      'right_foreArm': 19,
      'right_hand': 21,
      'left_upLeg': 1,
      'left_leg': 4,
      'left_foot': 7,
      'right_upLeg': 2,
      'right_leg': 5,
      'right_foot': 8
    }
  }
}

// Three.js骨骼控制代码示例
export const SKELETON_CONTROL_EXAMPLE = `
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { SkeletonUtils } from 'three/addons/utils/SkeletonUtils.js'

class HumanModelController {
  private mixer: THREE.AnimationMixer | null = null
  private skeleton: THREE.Skeleton | null = null
  private model: THREE.Group | null = null

  async loadModel(path: string): Promise<void> {
    const loader = new GLTFLoader()
    const gltf = await loader.loadAsync(path)

    this.model = gltf.scene
    this.skeleton = SkeletonUtils.getSkeleton(this.model)

    if (gltf.animations.length > 0) {
      this.mixer = new THREE.AnimationMixer(this.model)
      const action = this.mixer.clipAction(gltf.animations[0])
      action.play()
    }
  }

  // 更新骨骼姿态
  updatePose(jointAngles: Map<string, THREE.Euler>): void {
    if (!this.skeleton) return

    jointAngles.forEach((rotation, boneName) => {
      const bone = this.skeleton.bones.find(b => b.name === boneName)
      if (bone) {
        bone.rotation.copy(rotation)
      }
    })
  }

  // 更新动画
  update(delta: number): void {
    this.mixer?.update(delta)
  }

  getModel(): THREE.Group | null {
    return this.model
  }
}
`

// MakeHuman Python脚本示例
export const MAKEHUMAN_SCRIPT = `
import bpy
import makehuman

# 创建基础人体
human = makehuman.Human()
human.setGender('average')
human.setAge('adult')
human.setWeight('average')
human.setHeight('average')

# 应用骨骼
skeleton = makehuman.getSkeleton('default')
human.setSkeleton(skeleton)

# 导出为glTF
export_path = '/path/to/output/human.glb'
makehuman.export(export_path, format='glTF')
`

// Mixamo API集成示例
export const MIXAMO_API_EXAMPLE = `
// Mixamo API 可用于自动化下载
// 注意：Mixamo API可能需要认证

async function downloadMixamoModel(characterId: string, animationId: string) {
  const response = await fetch('https://www.mixamo.com/api/v1/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_TOKEN'
    },
    body: JSON.stringify({
      character_id: characterId,
      animation_id: animationId,
      format: 'gltf'
    })
  })

  return await response.blob()
}
`
