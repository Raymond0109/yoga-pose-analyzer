import type { JointAngle } from '@/types/pose'
import type { MuscleTensionData } from '@/types/smpl'

/** 肌肉群定义 */
interface MuscleDef {
  name: string
  nameCN: string
  relatedJoints: string[]
  /** 关节角度 → 紧张度的映射函数 */
  tensionFn: (angle: number) => number
}

/** 肌肉群定义表 */
const MUSCLE_DEFS: MuscleDef[] = [
  // 腿部
  {
    name: 'quadriceps_l',
    nameCN: '左股四头肌',
    relatedJoints: ['left_knee'],
    tensionFn: (a) => clamp((180 - a) / 90), // 膝盖越弯越紧
  },
  {
    name: 'quadriceps_r',
    nameCN: '右股四头肌',
    relatedJoints: ['right_knee'],
    tensionFn: (a) => clamp((180 - a) / 90),
  },
  {
    name: 'hamstrings_l',
    nameCN: '左腘绳肌',
    relatedJoints: ['left_knee', 'left_hip'],
    tensionFn: (a) => clamp((a - 90) / 90), // 伸直时紧张
  },
  {
    name: 'hamstrings_r',
    nameCN: '右腘绳肌',
    relatedJoints: ['right_knee', 'right_hip'],
    tensionFn: (a) => clamp((a - 90) / 90),
  },
  // 髋部
  {
    name: 'hip_flexors_l',
    nameCN: '左髋屈肌',
    relatedJoints: ['left_hip'],
    tensionFn: (a) => clamp((180 - a) / 90),
  },
  {
    name: 'hip_flexors_r',
    nameCN: '右髋屈肌',
    relatedJoints: ['right_hip'],
    tensionFn: (a) => clamp((180 - a) / 90),
  },
  // 手臂
  {
    name: 'biceps_l',
    nameCN: '左肱二头肌',
    relatedJoints: ['left_elbow'],
    tensionFn: (a) => clamp((180 - a) / 100),
  },
  {
    name: 'biceps_r',
    nameCN: '右肱二头肌',
    relatedJoints: ['right_elbow'],
    tensionFn: (a) => clamp((180 - a) / 100),
  },
  {
    name: 'triceps_l',
    nameCN: '左肱三头肌',
    relatedJoints: ['left_elbow'],
    tensionFn: (a) => clamp((a - 60) / 120),
  },
  {
    name: 'triceps_r',
    nameCN: '右肱三头肌',
    relatedJoints: ['right_elbow'],
    tensionFn: (a) => clamp((a - 60) / 120),
  },
  // 肩部
  {
    name: 'deltoids_l',
    nameCN: '左三角肌',
    relatedJoints: ['left_shoulder'],
    tensionFn: (a) => clamp(a / 120),
  },
  {
    name: 'deltoids_r',
    nameCN: '右三角肌',
    relatedJoints: ['right_shoulder'],
    tensionFn: (a) => clamp(a / 120),
  },
  // 核心
  {
    name: 'core',
    nameCN: '核心肌群',
    relatedJoints: ['left_hip', 'right_hip'],
    tensionFn: (a) => clamp((120 - a) / 60), // 弯曲时紧张
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
      // 获取相关关节角度的平均值
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

  /** 获取紧张度对应的颜色 (蓝→黄→红) */
  static tensionToColor(tension: number): { r: number; g: number; b: number } {
    // HSL: 蓝(0.6) → 红(0.0)
    const h = (1 - tension) * 0.6
    const s = 0.9
    const l = 0.35 + tension * 0.2

    return hslToRgb(h, s, l)
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
