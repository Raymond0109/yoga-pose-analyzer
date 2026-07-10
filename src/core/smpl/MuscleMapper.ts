import type { JointAngle } from '@/types/pose'
import type { MuscleTensionData } from '@/types/smpl'

/** 肌肉群定义 */
interface MuscleDef {
  name: string
  nameCN: string
  category: 'leg' | 'hip' | 'arm' | 'shoulder' | 'core' | 'back'
  relatedJoints: string[]
  /** 关节角度 → 紧张度的映射函数 */
  tensionFn: (angle: number) => number
}

/** 肌肉群定义表 (更完整的解剖学映射) */
const MUSCLE_DEFS: MuscleDef[] = [
  // ===== 腿部 =====
  {
    name: 'quadriceps_l',
    nameCN: '左股四头肌',
    category: 'leg',
    relatedJoints: ['left_knee'],
    tensionFn: (a) => clamp((180 - a) / 90),
  },
  {
    name: 'quadriceps_r',
    nameCN: '右股四头肌',
    category: 'leg',
    relatedJoints: ['right_knee'],
    tensionFn: (a) => clamp((180 - a) / 90),
  },
  {
    name: 'hamstrings_l',
    nameCN: '左腘绳肌',
    category: 'leg',
    relatedJoints: ['left_knee', 'left_hip'],
    tensionFn: (a) => clamp((a - 90) / 90),
  },
  {
    name: 'hamstrings_r',
    nameCN: '右腘绳肌',
    category: 'leg',
    relatedJoints: ['right_knee', 'right_hip'],
    tensionFn: (a) => clamp((a - 90) / 90),
  },
  {
    name: 'calves_l',
    nameCN: '左小腿肌',
    category: 'leg',
    relatedJoints: ['left_knee'],
    tensionFn: (a) => clamp((180 - a) / 120),
  },
  {
    name: 'calves_r',
    nameCN: '右小腿肌',
    category: 'leg',
    relatedJoints: ['right_knee'],
    tensionFn: (a) => clamp((180 - a) / 120),
  },
  // ===== 髋部 =====
  {
    name: 'hip_flexors_l',
    nameCN: '左髋屈肌',
    category: 'hip',
    relatedJoints: ['left_hip'],
    tensionFn: (a) => clamp((180 - a) / 90),
  },
  {
    name: 'hip_flexors_r',
    nameCN: '右髋屈肌',
    category: 'hip',
    relatedJoints: ['right_hip'],
    tensionFn: (a) => clamp((180 - a) / 90),
  },
  {
    name: 'glutes_l',
    nameCN: '左臀大肌',
    category: 'hip',
    relatedJoints: ['left_hip'],
    tensionFn: (a) => clamp((a - 90) / 90),
  },
  {
    name: 'glutes_r',
    nameCN: '右臀大肌',
    category: 'hip',
    relatedJoints: ['right_hip'],
    tensionFn: (a) => clamp((a - 90) / 90),
  },
  // ===== 手臂 =====
  {
    name: 'biceps_l',
    nameCN: '左肱二头肌',
    category: 'arm',
    relatedJoints: ['left_elbow'],
    tensionFn: (a) => clamp((180 - a) / 100),
  },
  {
    name: 'biceps_r',
    nameCN: '右肱二头肌',
    category: 'arm',
    relatedJoints: ['right_elbow'],
    tensionFn: (a) => clamp((180 - a) / 100),
  },
  {
    name: 'triceps_l',
    nameCN: '左肱三头肌',
    category: 'arm',
    relatedJoints: ['left_elbow'],
    tensionFn: (a) => clamp((a - 60) / 120),
  },
  {
    name: 'triceps_r',
    nameCN: '右肱三头肌',
    category: 'arm',
    relatedJoints: ['right_elbow'],
    tensionFn: (a) => clamp((a - 60) / 120),
  },
  // ===== 肩部 =====
  {
    name: 'deltoids_l',
    nameCN: '左三角肌',
    category: 'shoulder',
    relatedJoints: ['left_shoulder'],
    tensionFn: (a) => clamp(a / 120),
  },
  {
    name: 'deltoids_r',
    nameCN: '右三角肌',
    category: 'shoulder',
    relatedJoints: ['right_shoulder'],
    tensionFn: (a) => clamp(a / 120),
  },
  // ===== 核心 =====
  {
    name: 'abs',
    nameCN: '腹肌',
    category: 'core',
    relatedJoints: ['left_hip', 'right_hip'],
    tensionFn: (a) => clamp((120 - a) / 60),
  },
  {
    name: 'lower_back',
    nameCN: '下背部',
    category: 'back',
    relatedJoints: ['left_hip', 'right_hip'],
    tensionFn: (a) => clamp((a - 120) / 60),
  },
]

function clamp(v: number): number {
  return Math.max(0, Math.min(1, v))
}

export class MuscleMapper {
  /** 根据关节角度计算所有肌肉紧张度 */
  calculateTension(angles: JointAngle[]): MuscleTensionData[] {
    const angleMap = new Map(angles.map((a) => [a.joint, a.angle]))

    return MUSCLE_DEFS.map((muscle) => {
      const relatedAngles = muscle.relatedJoints
        .map((j) => angleMap.get(j))
        .filter((a): a is number => a !== undefined)

      if (relatedAngles.length === 0) {
        return { muscle: muscle.name, tension: 0 }
      }

      const avgAngle = relatedAngles.reduce((s, a) => s + a, 0) / relatedAngles.length
      const tension = muscle.tensionFn(avgAngle)

      return { muscle: muscle.name, tension }
    })
  }

  /** 获取肌肉中文名 */
  getMuscleNameCN(muscleName: string): string {
    return MUSCLE_DEFS.find((m) => m.name === muscleName)?.nameCN ?? muscleName
  }

  /** 获取肌肉分类 */
  getMuscleCategory(muscleName: string): string {
    return MUSCLE_DEFS.find((m) => m.name === muscleName)?.category ?? 'unknown'
  }

  /** 获取所有肌肉定义 */
  getAllMuscleDefs(): MuscleDef[] {
    return MUSCLE_DEFS
  }

  /** 获取紧张度对应的颜色 (蓝→黄→红) */
  static tensionToColor(tension: number): { r: number; g: number; b: number } {
    // 使用更直观的颜色映射:
    // 0.0-0.3: 蓝色 (松弛)
    // 0.3-0.6: 黄色 (中等)
    // 0.6-1.0: 红色 (紧张)
    let h: number, s: number, l: number

    if (tension < 0.3) {
      // 蓝色
      h = 0.6
      s = 0.8
      l = 0.4 + tension * 0.3
    } else if (tension < 0.6) {
      // 蓝→黄过渡
      const t = (tension - 0.3) / 0.3
      h = 0.6 - t * 0.45 // 0.6 → 0.15
      s = 0.8
      l = 0.5
    } else {
      // 黄→红过渡
      const t = (tension - 0.6) / 0.4
      h = 0.15 - t * 0.15 // 0.15 → 0.0
      s = 0.9
      l = 0.5 - t * 0.1
    }

    return hslToRgb(h, s, l)
  }

  /** 获取紧张度等级描述 */
  static tensionLevel(tension: number): { level: string; color: string } {
    if (tension < 0.3) return { level: '松弛', color: '#4A90D9' }
    if (tension < 0.6) return { level: '中等', color: '#F5A623' }
    return { level: '紧张', color: '#D0021B' }
  }
}

/** HSL → RGB */
function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  let r: number, g: number, b: number

  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }

  return { r, g, b }
}
