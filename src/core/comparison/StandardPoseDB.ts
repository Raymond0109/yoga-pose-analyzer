import type { PoseLandmark } from '@/types/pose'

/**
 * 标准体式位置数据库 (扩展版 - 27个体式)
 *
 * 归一化方案：
 * - 原点：髋部中心
 * - 单位：肩宽 = 1.0
 * - 坐标系：x(右), y(上), z(前)
 *
 * z轴深度说明：
 * - z > 0: 身体前侧（靠近观察者）
 * - z < 0: 身体后侧（远离观察者）
 * - z = 0: 身体中线
 */

export interface StandardPoseData {
  id: string
  nameCN: string
  nameEN: string
  nameSanskrit: string
  landmarks: Array<{ x: number; y: number; z: number }>
  jointAngles: Record<string, number>
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  category: string
  muscles: string[]
}

function lm(x: number, y: number, z: number = 0) {
  return { x, y, z }
}

function cloneLandmarks(l: Array<{ x: number; y: number; z: number }>) {
  return l.map(p => ({ ...p }))
}

/**
 * 基础站立模板 (z轴已校准)
 * - 头部z=0.05 (略前倾)
 * - 肩膀z=0 (中线)
 * - 手臂z=0 (自然下垂)
 * - 髋部z=0 (中线)
 * - 膝盖z=0 (中线)
 * - 脚踝z=0 (中线)
 * - 脚趾z=0.15 (前伸)
 *
 * 关键点索引:
 * 0: nose, 1-10: face, 11: left_shoulder, 12: right_shoulder
 * 13: left_elbow, 14: right_elbow, 15: left_wrist, 16: right_wrist
 * 17-22: hands, 23: left_hip, 24: right_hip
 * 25: left_knee, 26: right_knee, 27: left_ankle, 28: right_ankle
 * 29-32: feet
 */
const BASE: Array<{ x: number; y: number; z: number }> = [
  lm(0, 1.5, 0.05), lm(-0.05, 1.55, 0.12), lm(-0.08, 1.55, 0.12),
  lm(-0.11, 1.55, 0.12), lm(0.05, 1.55, 0.12), lm(0.08, 1.55, 0.12),
  lm(0.11, 1.55, 0.12), lm(-0.12, 1.52, 0.08), lm(0.12, 1.52, 0.08),
  lm(0, 1.48, 0.06), lm(0, 1.48, 0.06),
  lm(-0.2, 1.3, 0), lm(0.2, 1.3, 0),
  lm(-0.35, 1.0, 0), lm(0.35, 1.0, 0),      // 肘部 (上臂0.35长)
  lm(-0.45, 0.7, 0), lm(0.45, 0.7, 0),       // 腕部 (前臂0.35长)
  lm(-0.48, 0.68, 0.02), lm(0.48, 0.68, 0.02),
  lm(-0.46, 0.68, 0.02), lm(0.46, 0.68, 0.02),
  lm(-0.47, 0.65, 0.02), lm(0.47, 0.65, 0.02),
  lm(-0.1, 0.8, 0), lm(0.1, 0.8, 0),
  lm(-0.1, 0.45, 0), lm(0.1, 0.45, 0),
  lm(-0.1, 0.05, 0), lm(0.1, 0.05, 0),
  lm(-0.15, 0, 0.1), lm(0.15, 0, 0.1),
  lm(-0.05, 0, 0.15), lm(0.05, 0, 0.15),
]

// ============================================================
// 初级体式 (10个)
// ============================================================

const tadasana: StandardPoseData = {
  id: 'tadasana', nameCN: '山式', nameEN: 'Mountain Pose', nameSanskrit: 'Tadasana',
  difficulty: 'beginner', category: '站立', muscles: ['核心', '腿部', '脊柱'],
  landmarks: cloneLandmarks(BASE),
  // 山式标准角度（瑜伽解剖学）
  // 膝关节：伸直但不锁死 175-180°
  // 髋关节：中立位 175-180°（骨盆水平，不前倾后倾）
  // 肩关节：自然下垂微后收 170-175°
  // 肘关节：自然伸直 175-180°
  jointAngles: {
    left_knee: 178, right_knee: 178,
    left_hip: 178, right_hip: 178,
    left_shoulder: 175, right_shoulder: 175,
    left_elbow: 178, right_elbow: 178,
  },
}

const vrksasana: StandardPoseData = {
  id: 'vrksasana', nameCN: '树式', nameEN: 'Tree Pose', nameSanskrit: 'Vrksasana',
  difficulty: 'beginner', category: '平衡', muscles: ['核心', '腿部', '臀部'],
  landmarks: (() => {
    const l = cloneLandmarks(BASE)
    // 右腿弯曲，脚抵左大腿内侧
    l[26] = { x: 0.15, y: 0.6, z: 0.05 }  // 右膝外展
    l[28] = { x: 0.05, y: 0.55, z: 0.08 }  // 右踝靠近左大腿
    // 双手合十上举 (保持上臂长度0.35)
    l[13] = { x: -0.2, y: 1.1, z: 0.05 }; l[15] = { x: -0.15, y: 1.35, z: 0.05 }
    l[14] = { x: 0.2, y: 1.1, z: 0.05 }; l[16] = { x: 0.15, y: 1.35, z: 0.05 }
    return l
  })(),
  jointAngles: { left_knee: 175, right_knee: 45, left_hip: 175, right_hip: 60, left_shoulder: 160, right_shoulder: 160 },
}

const adho_mukha_svanasana: StandardPoseData = {
  id: 'adho_mukha_svanasana', nameCN: '下犬式', nameEN: 'Downward Dog', nameSanskrit: 'Adho Mukha Svanasana',
  difficulty: 'beginner', category: '倒置', muscles: ['腿部', '肩部', '核心'],
  landmarks: (() => {
    const l = cloneLandmarks(BASE)
    // 髋部抬高，身体呈倒V形
    l[23] = { x: -0.12, y: 1.1, z: -0.15 }; l[24] = { x: 0.12, y: 1.1, z: -0.15 }
    // 手臂向前伸直
    l[11] = { x: -0.2, y: 1.0, z: 0.25 }; l[12] = { x: 0.2, y: 1.0, z: 0.25 }
    l[13] = { x: -0.25, y: 0.8, z: 0.35 }; l[14] = { x: 0.25, y: 0.8, z: 0.35 }
    l[15] = { x: -0.2, y: 0.6, z: 0.45 }; l[16] = { x: 0.2, y: 0.6, z: 0.45 }
    // 头在手臂之间
    l[0] = { x: 0, y: 0.7, z: 0.35 }
    // 腿向后伸直
    l[25] = { x: -0.12, y: 0.7, z: -0.35 }; l[26] = { x: 0.12, y: 0.7, z: -0.35 }
    l[27] = { x: -0.12, y: 0.3, z: -0.55 }; l[28] = { x: 0.12, y: 0.3, z: -0.55 }
    return l
  })(),
  jointAngles: { left_knee: 175, right_knee: 175, left_hip: 90, right_hip: 90, left_shoulder: 170, right_shoulder: 170 },
}

const utkatasana: StandardPoseData = {
  id: 'utkatasana', nameCN: '幻椅式', nameEN: 'Chair Pose', nameSanskrit: 'Utkatasana',
  difficulty: 'beginner', category: '站立', muscles: ['股四头肌', '臀大肌', '核心'],
  landmarks: (() => {
    const l = cloneLandmarks(BASE)
    // 膝盖弯曲，身体后坐
    l[23] = { x: -0.1, y: 0.7, z: 0.05 }; l[24] = { x: 0.1, y: 0.7, z: 0.05 }
    l[25] = { x: -0.15, y: 0.5, z: 0.12 }; l[26] = { x: 0.15, y: 0.5, z: 0.12 }
    // 双臂上举 (保持上臂长度)
    l[11] = { x: -0.2, y: 1.35, z: 0 }; l[12] = { x: 0.2, y: 1.35, z: 0 }
    l[13] = { x: -0.15, y: 1.55, z: 0 }; l[14] = { x: 0.15, y: 1.55, z: 0 }
    l[15] = { x: -0.1, y: 1.7, z: 0 }; l[16] = { x: 0.1, y: 1.7, z: 0 }
    return l
  })(),
  jointAngles: { left_knee: 95, right_knee: 95, left_hip: 95, right_hip: 95, left_shoulder: 170, right_shoulder: 170 },
}

const balasana: StandardPoseData = {
  id: 'balasana', nameCN: '婴儿式', nameEN: "Child's Pose", nameSanskrit: 'Balasana',
  difficulty: 'beginner', category: '跪姿', muscles: ['背部', '臀部'],
  landmarks: (() => {
    const l = cloneLandmarks(BASE)
    // 跪坐
    l[23] = { x: -0.1, y: 0.5, z: -0.08 }; l[24] = { x: 0.1, y: 0.5, z: -0.08 }
    l[25] = { x: -0.15, y: 0.35, z: 0.08 }; l[26] = { x: 0.15, y: 0.35, z: 0.08 }
    l[27] = { x: -0.15, y: 0.2, z: -0.08 }; l[28] = { x: 0.15, y: 0.2, z: -0.08 }
    // 身体前屈
    l[11] = { x: -0.15, y: 0.6, z: 0.15 }; l[12] = { x: 0.15, y: 0.6, z: 0.15 }
    l[0] = { x: 0, y: 0.4, z: 0.35 }
    // 手臂前伸
    l[13] = { x: -0.2, y: 0.5, z: 0.45 }; l[15] = { x: -0.2, y: 0.4, z: 0.75 }
    l[14] = { x: 0.2, y: 0.5, z: 0.45 }; l[16] = { x: 0.2, y: 0.4, z: 0.75 }
    return l
  })(),
  jointAngles: { left_knee: 90, right_knee: 90, left_hip: 45, right_hip: 45, left_shoulder: 160, right_shoulder: 160 },
}

const bhujangasana: StandardPoseData = {
  id: 'bhujangasana', nameCN: '眼镜蛇式', nameEN: 'Cobra Pose', nameSanskrit: 'Bhujangasana',
  difficulty: 'beginner', category: '俯卧', muscles: ['背部', '手臂', '核心'],
  landmarks: (() => {
    const l = cloneLandmarks(BASE)
    // 俯卧，腿贴地
    l[23] = { x: -0.1, y: 0.15, z: -0.08 }; l[24] = { x: 0.1, y: 0.15, z: -0.08 }
    l[25] = { x: -0.1, y: 0.1, z: -0.28 }; l[26] = { x: 0.1, y: 0.1, z: -0.28 }
    l[27] = { x: -0.1, y: 0.05, z: -0.48 }; l[28] = { x: 0.1, y: 0.05, z: -0.48 }
    // 上身后弯
    l[11] = { x: -0.2, y: 0.5, z: 0.08 }; l[12] = { x: 0.2, y: 0.5, z: 0.08 }
    l[0] = { x: 0, y: 0.7, z: 0.12 }
    // 手臂支撑 (保持上臂长度)
    l[13] = { x: -0.2, y: 0.35, z: 0.12 }; l[14] = { x: 0.2, y: 0.35, z: 0.12 }
    l[15] = { x: -0.2, y: 0.25, z: 0.08 }; l[16] = { x: 0.2, y: 0.25, z: 0.08 }
    return l
  })(),
  jointAngles: { left_knee: 175, right_knee: 175, left_hip: 160, right_hip: 160, left_shoulder: 100, right_shoulder: 100, left_elbow: 150, right_elbow: 150 },
}

const setu_bandhasana: StandardPoseData = {
  id: 'setu_bandhasana', nameCN: '桥式', nameEN: 'Bridge Pose', nameSanskrit: 'Setu Bandhasana',
  difficulty: 'beginner', category: '仰卧', muscles: ['臀大肌', '腿部', '背部'],
  landmarks: (() => {
    const l = cloneLandmarks(BASE)
    // 仰卧，臀部抬起
    l[0] = { x: 0, y: 0.2, z: -0.12 }
    l[11] = { x: -0.2, y: 0.2, z: 0 }; l[12] = { x: 0.2, y: 0.2, z: 0 }
    l[23] = { x: -0.1, y: 0.5, z: 0 }; l[24] = { x: 0.1, y: 0.5, z: 0 }
    l[25] = { x: -0.2, y: 0.35, z: 0.15 }; l[26] = { x: 0.2, y: 0.35, z: 0.15 }
    l[27] = { x: -0.2, y: 0.1, z: 0.25 }; l[28] = { x: 0.2, y: 0.1, z: 0.25 }
    // 手臂放在身体两侧 (保持上臂长度0.35)
    l[13] = { x: -0.35, y: 0.15, z: 0 }; l[15] = { x: -0.45, y: 0.12, z: 0.08 }
    l[14] = { x: 0.35, y: 0.15, z: 0 }; l[16] = { x: 0.45, y: 0.12, z: 0.08 }
    return l
  })(),
  jointAngles: { left_knee: 100, right_knee: 100, left_hip: 120, right_hip: 120, left_shoulder: 170, right_shoulder: 170 },
}

const ustrasana: StandardPoseData = {
  id: 'ustrasana', nameCN: '骆驼式', nameEN: 'Camel Pose', nameSanskrit: 'Ustrasana',
  difficulty: 'beginner', category: '跪姿', muscles: ['髋屈肌', '腹部', '背部'],
  landmarks: (() => {
    const l = cloneLandmarks(BASE)
    // 跪立，身体后弯
    l[0] = { x: 0, y: 1.3, z: -0.18 }
    l[11] = { x: -0.2, y: 1.1, z: -0.08 }; l[12] = { x: 0.2, y: 1.1, z: -0.08 }
    l[23] = { x: -0.1, y: 0.6, z: 0 }; l[24] = { x: 0.1, y: 0.6, z: 0 }
    l[25] = { x: -0.15, y: 0.4, z: 0.08 }; l[26] = { x: 0.15, y: 0.4, z: 0.08 }
    l[27] = { x: -0.15, y: 0.15, z: 0 }; l[28] = { x: 0.15, y: 0.15, z: 0 }
    l[13] = { x: -0.2, y: 0.5, z: 0.08 }; l[15] = { x: -0.2, y: 0.5, z: 0.12 }
    l[14] = { x: 0.2, y: 0.5, z: 0.08 }; l[16] = { x: 0.2, y: 0.5, z: 0.12 }
    return l
  })(),
  jointAngles: { left_knee: 100, right_knee: 100, left_hip: 150, right_hip: 150, left_shoulder: 130, right_shoulder: 130 },
}

const baddha_konasana: StandardPoseData = {
  id: 'baddha_konasana', nameCN: '蝴蝶式', nameEN: 'Butterfly Pose', nameSanskrit: 'Baddha Konasana',
  difficulty: 'beginner', category: '坐姿', muscles: ['髋部', '大腿内侧'],
  landmarks: (() => {
    const l = cloneLandmarks(BASE)
    l[0] = { x: 0, y: 0.9, z: 0.05 }
    l[11] = { x: -0.2, y: 0.8, z: 0 }; l[12] = { x: 0.2, y: 0.8, z: 0 }
    l[23] = { x: -0.1, y: 0.45, z: 0 }; l[24] = { x: 0.1, y: 0.45, z: 0 }
    l[25] = { x: -0.2, y: 0.35, z: 0.12 }; l[26] = { x: 0.2, y: 0.35, z: 0.12 }
    l[27] = { x: -0.15, y: 0.35, z: 0.18 }; l[28] = { x: 0.15, y: 0.35, z: 0.18 }
    l[13] = { x: -0.2, y: 0.55, z: 0.12 }; l[15] = { x: -0.15, y: 0.45, z: 0.18 }
    l[14] = { x: 0.2, y: 0.55, z: 0.12 }; l[16] = { x: 0.15, y: 0.45, z: 0.18 }
    return l
  })(),
  jointAngles: { left_knee: 110, right_knee: 110, left_hip: 80, right_hip: 80, left_shoulder: 150, right_shoulder: 150 },
}

const savasana: StandardPoseData = {
  id: 'savasana', nameCN: '挺尸式', nameEN: 'Corpse Pose', nameSanskrit: 'Savasana',
  difficulty: 'beginner', category: '仰卧', muscles: ['全身放松'],
  landmarks: (() => {
    const l = cloneLandmarks(BASE)
    l[0] = { x: 0, y: 0.15, z: -0.08 }
    l[11] = { x: -0.2, y: 0.15, z: 0 }; l[12] = { x: 0.2, y: 0.15, z: 0 }
    l[23] = { x: -0.1, y: 0.15, z: 0 }; l[24] = { x: 0.1, y: 0.15, z: 0 }
    l[13] = { x: -0.3, y: 0.15, z: 0 }; l[15] = { x: -0.4, y: 0.12, z: 0 }
    l[14] = { x: 0.3, y: 0.15, z: 0 }; l[16] = { x: 0.4, y: 0.12, z: 0 }
    l[25] = { x: -0.1, y: 0.12, z: 0.28 }; l[26] = { x: 0.1, y: 0.12, z: 0.28 }
    l[27] = { x: -0.1, y: 0.1, z: 0.58 }; l[28] = { x: 0.1, y: 0.1, z: 0.58 }
    return l
  })(),
  jointAngles: { left_knee: 175, right_knee: 175, left_hip: 175, right_hip: 175, left_shoulder: 175, right_shoulder: 175 },
}

// ============================================================
// 中级体式 (8个)
// ============================================================

const virabhadrasana_i: StandardPoseData = {
  id: 'virabhadrasana_i', nameCN: '战士一式', nameEN: 'Warrior I', nameSanskrit: 'Virabhadrasana I',
  difficulty: 'intermediate', category: '站立', muscles: ['股四头肌', '臀大肌', '髋屈肌'],
  landmarks: (() => {
    const l = cloneLandmarks(BASE)
    l[23] = { x: -0.15, y: 0.65, z: 0.08 }; l[24] = { x: 0.15, y: 0.65, z: -0.08 }
    l[25] = { x: -0.2, y: 0.5, z: 0.12 }; l[26] = { x: 0.15, y: 0.45, z: -0.18 }
    l[27] = { x: -0.2, y: 0.05, z: 0.08 }; l[28] = { x: 0.15, y: 0.05, z: -0.28 }
    l[13] = { x: -0.1, y: 1.5, z: 0 }; l[15] = { x: -0.08, y: 1.7, z: 0 }
    l[14] = { x: 0.1, y: 1.5, z: 0 }; l[16] = { x: 0.08, y: 1.7, z: 0 }
    return l
  })(),
  jointAngles: { left_knee: 90, right_knee: 175, left_hip: 95, right_hip: 160, left_shoulder: 175, right_shoulder: 175 },
}

const virabhadrasana_ii: StandardPoseData = {
  id: 'virabhadrasana_ii', nameCN: '战士二式', nameEN: 'Warrior II', nameSanskrit: 'Virabhadrasana II',
  difficulty: 'intermediate', category: '站立', muscles: ['股四头肌', '三角肌', '核心'],
  landmarks: (() => {
    const l = cloneLandmarks(BASE)
    l[25] = { x: -0.2, y: 0.5, z: 0.08 }; l[23] = { x: -0.15, y: 0.75, z: 0 }
    l[26] = { x: 0.2, y: 0.45, z: -0.08 }
    l[13] = { x: -0.5, y: 1.3, z: 0 }; l[15] = { x: -0.7, y: 1.3, z: 0 }
    l[14] = { x: 0.5, y: 1.3, z: 0 }; l[16] = { x: 0.7, y: 1.3, z: 0 }
    l[0] = { x: -0.05, y: 1.5, z: 0 }
    return l
  })(),
  jointAngles: { left_knee: 90, right_knee: 175, left_hip: 90, right_hip: 140, left_shoulder: 90, right_shoulder: 90 },
}

const trikonasana: StandardPoseData = {
  id: 'trikonasana', nameCN: '三角式', nameEN: 'Triangle Pose', nameSanskrit: 'Trikonasana',
  difficulty: 'intermediate', category: '站立', muscles: ['腿部', '侧腰', '肩部'],
  landmarks: (() => {
    const l = cloneLandmarks(BASE)
    l[23] = { x: -0.2, y: 0.8, z: 0 }; l[24] = { x: 0.2, y: 0.8, z: 0 }
    l[25] = { x: -0.2, y: 0.45, z: 0 }; l[26] = { x: 0.2, y: 0.45, z: 0 }
    l[27] = { x: -0.2, y: 0.05, z: 0 }; l[28] = { x: 0.2, y: 0.05, z: 0 }
    l[0] = { x: 0.1, y: 1.3, z: 0 }
    l[11] = { x: -0.1, y: 1.2, z: 0 }; l[12] = { x: 0.25, y: 1.1, z: 0 }
    // 左手向下触地 (缩短前臂长度)
    l[13] = { x: 0.05, y: 0.9, z: 0 }; l[15] = { x: 0.15, y: 0.5, z: 0 }
    // 右手向上
    l[14] = { x: 0.3, y: 1.4, z: 0 }; l[16] = { x: 0.3, y: 1.6, z: 0 }
    return l
  })(),
  jointAngles: { left_knee: 175, right_knee: 175, left_hip: 120, right_hip: 120, left_shoulder: 170, right_shoulder: 30 },
}

const utthita_parsvakonasana: StandardPoseData = {
  id: 'utthita_parsvakonasana', nameCN: '侧角伸展式', nameEN: 'Extended Side Angle', nameSanskrit: 'Utthita Parsvakonasana',
  difficulty: 'intermediate', category: '站立', muscles: ['股四头肌', '侧腰', '核心'],
  landmarks: (() => {
    const l = cloneLandmarks(BASE)
    l[23] = { x: -0.2, y: 0.6, z: 0.08 }; l[24] = { x: 0.2, y: 0.8, z: -0.08 }
    l[25] = { x: -0.25, y: 0.5, z: 0.12 }; l[26] = { x: 0.2, y: 0.45, z: -0.08 }
    l[11] = { x: -0.15, y: 1.0, z: 0 }; l[12] = { x: 0.2, y: 1.1, z: 0 }
    l[13] = { x: -0.2, y: 0.7, z: 0.08 }; l[15] = { x: -0.15, y: 0.5, z: 0.12 }
    l[14] = { x: 0.3, y: 1.3, z: -0.08 }; l[16] = { x: 0.5, y: 1.5, z: -0.12 }
    l[0] = { x: 0, y: 1.1, z: 0 }
    return l
  })(),
  jointAngles: { left_knee: 90, right_knee: 175, left_hip: 95, right_hip: 140, left_shoulder: 120, right_shoulder: 40 },
}

const plank: StandardPoseData = {
  id: 'plank', nameCN: '平板式', nameEN: 'Plank Pose', nameSanskrit: 'Phalakasana',
  difficulty: 'intermediate', category: '俯卧', muscles: ['核心', '手臂', '肩部'],
  landmarks: (() => {
    const l = cloneLandmarks(BASE)
    l[0] = { x: 0, y: 0.8, z: 0.28 }
    l[11] = { x: -0.2, y: 0.8, z: 0.28 }; l[12] = { x: 0.2, y: 0.8, z: 0.28 }
    l[23] = { x: -0.1, y: 0.75, z: -0.08 }; l[24] = { x: 0.1, y: 0.75, z: -0.08 }
    l[25] = { x: -0.1, y: 0.7, z: -0.28 }; l[26] = { x: 0.1, y: 0.7, z: -0.28 }
    l[27] = { x: -0.1, y: 0.65, z: -0.48 }; l[28] = { x: 0.1, y: 0.65, z: -0.48 }
    // 手臂支撑 (保持上臂和前臂长度)
    l[13] = { x: -0.2, y: 0.65, z: 0.32 }; l[15] = { x: -0.2, y: 0.5, z: 0.38 }
    l[14] = { x: 0.2, y: 0.65, z: 0.32 }; l[16] = { x: 0.2, y: 0.5, z: 0.38 }
    return l
  })(),
  jointAngles: { left_knee: 175, right_knee: 175, left_hip: 170, right_hip: 170, left_shoulder: 170, right_shoulder: 170, left_elbow: 175, right_elbow: 175 },
}

const ardha_matsyendrasana: StandardPoseData = {
  id: 'ardha_matsyendrasana', nameCN: '半鱼王式', nameEN: 'Half Lord of Fish', nameSanskrit: 'Ardha Matsyendrasana',
  difficulty: 'intermediate', category: '坐姿', muscles: ['脊柱旋转', '臀部', '核心'],
  landmarks: (() => {
    const l = cloneLandmarks(BASE)
    l[0] = { x: 0.05, y: 0.9, z: 0 }
    l[11] = { x: -0.15, y: 0.8, z: 0 }; l[12] = { x: 0.15, y: 0.8, z: 0 }
    l[23] = { x: -0.1, y: 0.45, z: 0 }; l[24] = { x: 0.1, y: 0.45, z: 0 }
    l[25] = { x: -0.2, y: 0.4, z: 0.12 }; l[26] = { x: 0.05, y: 0.45, z: 0.08 }
    l[27] = { x: -0.2, y: 0.35, z: 0.18 }; l[28] = { x: -0.15, y: 0.4, z: 0.12 }
    l[13] = { x: -0.1, y: 0.7, z: 0.12 }; l[15] = { x: 0.15, y: 0.7, z: 0.12 }
    l[14] = { x: 0.1, y: 0.7, z: -0.08 }; l[16] = { x: -0.15, y: 0.6, z: -0.08 }
    return l
  })(),
  jointAngles: { left_knee: 100, right_knee: 100, left_hip: 90, right_hip: 90, left_shoulder: 130, right_shoulder: 130 },
}

const kapotasana: StandardPoseData = {
  id: 'kapotasana', nameCN: '鸽式', nameEN: 'Pigeon Pose', nameSanskrit: 'Kapotasana',
  difficulty: 'intermediate', category: '坐姿', muscles: ['髋屈肌', '臀部', '核心'],
  landmarks: (() => {
    const l = cloneLandmarks(BASE)
    l[0] = { x: 0, y: 0.8, z: 0.08 }
    l[11] = { x: -0.2, y: 0.7, z: 0 }; l[12] = { x: 0.2, y: 0.7, z: 0 }
    l[23] = { x: -0.1, y: 0.45, z: 0 }; l[24] = { x: 0.1, y: 0.45, z: 0 }
    l[25] = { x: -0.2, y: 0.35, z: 0.12 }; l[26] = { x: 0.15, y: 0.4, z: -0.18 }
    l[27] = { x: -0.2, y: 0.3, z: 0.18 }; l[28] = { x: 0.2, y: 0.35, z: -0.28 }
    l[13] = { x: -0.25, y: 0.6, z: 0.08 }; l[15] = { x: -0.3, y: 0.55, z: 0.12 }
    l[14] = { x: 0.25, y: 0.6, z: 0.08 }; l[16] = { x: 0.3, y: 0.55, z: 0.12 }
    return l
  })(),
  jointAngles: { left_knee: 100, right_knee: 160, left_hip: 90, right_hip: 160, left_shoulder: 150, right_shoulder: 150 },
}

const sarvangasana: StandardPoseData = {
  id: 'sarvangasana', nameCN: '肩倒立', nameEN: 'Shoulder Stand', nameSanskrit: 'Sarvangasana',
  difficulty: 'advanced', category: '倒置', muscles: ['核心', '肩部', '腿部'],
  landmarks: (() => {
    const l = cloneLandmarks(BASE)
    l[0] = { x: 0, y: 0.2, z: 0 }
    l[11] = { x: -0.15, y: 0.15, z: 0 }; l[12] = { x: 0.15, y: 0.15, z: 0 }
    l[23] = { x: -0.1, y: 0.8, z: 0 }; l[24] = { x: 0.1, y: 0.8, z: 0 }
    l[25] = { x: -0.1, y: 1.2, z: 0 }; l[26] = { x: 0.1, y: 1.2, z: 0 }
    l[27] = { x: -0.1, y: 1.5, z: 0 }; l[28] = { x: 0.1, y: 1.5, z: 0 }
    l[13] = { x: -0.15, y: 0.2, z: 0.08 }; l[15] = { x: -0.15, y: 0.3, z: 0.12 }
    l[14] = { x: 0.15, y: 0.2, z: 0.08 }; l[16] = { x: 0.15, y: 0.3, z: 0.12 }
    return l
  })(),
  jointAngles: { left_knee: 175, right_knee: 175, left_hip: 175, right_hip: 175, left_shoulder: 150, right_shoulder: 150 },
}

// ============================================================
// 高级体式 (6个)
// ============================================================

const virabhadrasana_iii: StandardPoseData = {
  id: 'virabhadrasana_iii', nameCN: '战士三式', nameEN: 'Warrior III', nameSanskrit: 'Virabhadrasana III',
  difficulty: 'advanced', category: '站立', muscles: ['臀大肌', '核心', '背部'],
  landmarks: (() => {
    const l = cloneLandmarks(BASE)
    l[23] = { x: -0.1, y: 0.7, z: 0 }; l[24] = { x: 0.1, y: 0.7, z: 0 }
    l[25] = { x: -0.1, y: 0.45, z: 0 }; l[26] = { x: 0.3, y: 0.75, z: -0.18 }
    l[27] = { x: -0.1, y: 0.05, z: 0 }; l[28] = { x: 0.5, y: 0.8, z: -0.28 }
    l[11] = { x: -0.2, y: 1.2, z: 0.18 }; l[12] = { x: 0.2, y: 1.2, z: 0.18 }
    l[13] = { x: -0.2, y: 1.1, z: 0.38 }; l[15] = { x: -0.2, y: 1.0, z: 0.58 }
    l[14] = { x: 0.2, y: 1.1, z: 0.38 }; l[16] = { x: 0.2, y: 1.0, z: 0.58 }
    l[0] = { x: 0, y: 1.1, z: 0.18 }
    return l
  })(),
  jointAngles: { left_knee: 175, right_knee: 175, left_hip: 170, right_hip: 170, left_shoulder: 170, right_shoulder: 170 },
}

const natarajasana: StandardPoseData = {
  id: 'natarajasana', nameCN: '舞王式', nameEN: 'Dancer Pose', nameSanskrit: 'Natarajasana',
  difficulty: 'advanced', category: '平衡', muscles: ['核心', '腿部', '背部'],
  landmarks: (() => {
    const l = cloneLandmarks(BASE)
    l[23] = { x: -0.1, y: 0.7, z: 0 }; l[24] = { x: 0.1, y: 0.7, z: 0 }
    l[25] = { x: -0.1, y: 0.45, z: 0 }; l[26] = { x: 0.15, y: 0.7, z: -0.18 }
    l[27] = { x: -0.1, y: 0.05, z: 0 }; l[28] = { x: 0.2, y: 0.8, z: -0.28 }
    l[11] = { x: -0.2, y: 1.2, z: 0 }; l[12] = { x: 0.2, y: 1.3, z: 0 }
    l[13] = { x: -0.2, y: 1.4, z: 0 }; l[15] = { x: -0.2, y: 1.6, z: 0 }
    l[14] = { x: 0.2, y: 1.2, z: -0.08 }; l[16] = { x: 0.2, y: 0.8, z: -0.22 }
    return l
  })(),
  jointAngles: { left_knee: 175, right_knee: 90, left_hip: 175, right_hip: 130, left_shoulder: 170, right_shoulder: 150 },
}

const chaturanga: StandardPoseData = {
  id: 'chaturanga', nameCN: '鳄鱼式', nameEN: 'Chaturanga', nameSanskrit: 'Chaturanga Dandasana',
  difficulty: 'advanced', category: '俯卧', muscles: ['肱三头肌', '核心', '肩部'],
  landmarks: (() => {
    const l = cloneLandmarks(BASE)
    l[0] = { x: 0, y: 0.5, z: 0.28 }
    l[11] = { x: -0.2, y: 0.5, z: 0.28 }; l[12] = { x: 0.2, y: 0.5, z: 0.28 }
    l[23] = { x: -0.1, y: 0.45, z: -0.08 }; l[24] = { x: 0.1, y: 0.45, z: -0.08 }
    l[25] = { x: -0.1, y: 0.4, z: -0.28 }; l[26] = { x: 0.1, y: 0.4, z: -0.28 }
    l[27] = { x: -0.1, y: 0.35, z: -0.48 }; l[28] = { x: 0.1, y: 0.35, z: -0.48 }
    l[13] = { x: -0.2, y: 0.4, z: 0.28 }; l[15] = { x: -0.2, y: 0.35, z: 0.28 }
    l[14] = { x: 0.2, y: 0.4, z: 0.28 }; l[16] = { x: 0.2, y: 0.35, z: 0.28 }
    return l
  })(),
  jointAngles: { left_knee: 175, right_knee: 175, left_hip: 175, right_hip: 175, left_shoulder: 100, right_shoulder: 100, left_elbow: 100, right_elbow: 100 },
}

const navasana: StandardPoseData = {
  id: 'navasana', nameCN: '船式', nameEN: 'Boat Pose', nameSanskrit: 'Navasana',
  difficulty: 'advanced', category: '坐姿', muscles: ['核心', '髋屈肌'],
  landmarks: (() => {
    const l = cloneLandmarks(BASE)
    l[23] = { x: -0.1, y: 0.5, z: 0 }; l[24] = { x: 0.1, y: 0.5, z: 0 }
    l[25] = { x: -0.15, y: 0.6, z: 0.28 }; l[26] = { x: 0.15, y: 0.6, z: 0.28 }
    l[27] = { x: -0.2, y: 0.7, z: 0.48 }; l[28] = { x: 0.2, y: 0.7, z: 0.48 }
    l[11] = { x: -0.18, y: 0.7, z: -0.08 }; l[12] = { x: 0.18, y: 0.7, z: -0.08 }
    l[0] = { x: 0, y: 0.9, z: -0.08 }
    l[13] = { x: -0.2, y: 0.7, z: 0.18 }; l[15] = { x: -0.2, y: 0.7, z: 0.38 }
    l[14] = { x: 0.2, y: 0.7, z: 0.18 }; l[16] = { x: 0.2, y: 0.7, z: 0.38 }
    return l
  })(),
  jointAngles: { left_knee: 175, right_knee: 175, left_hip: 50, right_hip: 50, left_shoulder: 60, right_shoulder: 60 },
}

const bakasana: StandardPoseData = {
  id: 'bakasana', nameCN: '乌鸦式', nameEN: 'Crow Pose', nameSanskrit: 'Bakasana',
  difficulty: 'advanced', category: '平衡', muscles: ['手臂', '核心', '肩部'],
  landmarks: (() => {
    const l = cloneLandmarks(BASE)
    l[0] = { x: 0, y: 0.7, z: 0.18 }
    l[11] = { x: -0.2, y: 0.65, z: 0.12 }; l[12] = { x: 0.2, y: 0.65, z: 0.12 }
    l[23] = { x: -0.1, y: 0.6, z: 0.08 }; l[24] = { x: 0.1, y: 0.6, z: 0.08 }
    l[25] = { x: -0.15, y: 0.55, z: 0.18 }; l[26] = { x: 0.15, y: 0.55, z: 0.18 }
    l[27] = { x: -0.1, y: 0.5, z: 0.22 }; l[28] = { x: 0.1, y: 0.5, z: 0.22 }
    l[13] = { x: -0.2, y: 0.55, z: 0.18 }; l[15] = { x: -0.2, y: 0.5, z: 0.22 }
    l[14] = { x: 0.2, y: 0.55, z: 0.18 }; l[16] = { x: 0.2, y: 0.5, z: 0.22 }
    return l
  })(),
  jointAngles: { left_knee: 110, right_knee: 110, left_hip: 90, right_hip: 90, left_shoulder: 120, right_shoulder: 120, left_elbow: 100, right_elbow: 100 },
}

const sirsasana: StandardPoseData = {
  id: 'sirsasana', nameCN: '头倒立', nameEN: 'Headstand', nameSanskrit: 'Salamba Sirsasana',
  difficulty: 'advanced', category: '倒置', muscles: ['核心', '肩部', '手臂'],
  landmarks: (() => {
    const l = cloneLandmarks(BASE)
    l[0] = { x: 0, y: 0.1, z: 0 }
    l[11] = { x: -0.15, y: 0.15, z: 0 }; l[12] = { x: 0.15, y: 0.15, z: 0 }
    l[23] = { x: -0.1, y: 1.0, z: 0 }; l[24] = { x: 0.1, y: 1.0, z: 0 }
    l[25] = { x: -0.1, y: 1.4, z: 0 }; l[26] = { x: 0.1, y: 1.4, z: 0 }
    l[27] = { x: -0.1, y: 1.7, z: 0 }; l[28] = { x: 0.1, y: 1.7, z: 0 }
    l[13] = { x: -0.15, y: 0.2, z: 0.08 }; l[15] = { x: -0.15, y: 0.3, z: 0.12 }
    l[14] = { x: 0.15, y: 0.2, z: 0.08 }; l[16] = { x: 0.15, y: 0.3, z: 0.12 }
    return l
  })(),
  jointAngles: { left_knee: 175, right_knee: 175, left_hip: 175, right_hip: 175, left_shoulder: 150, right_shoulder: 150 },
}

// ============================================================
// 新增体式 (来自Yoga-107推荐)
// ============================================================

/** 巴拉瓦伽式：坐姿扭转 */
const bharadvajasana_i: StandardPoseData = {
  id: 'bharadvajasana_i', nameCN: '巴拉瓦伽式', nameEN: "Bharadvaja's Twist", nameSanskrit: 'Bharadvajasana I',
  difficulty: 'beginner', category: '坐姿', muscles: ['脊柱旋转', '臀部', '核心'],
  landmarks: (() => {
    const l = cloneLandmarks(BASE)
    l[0] = { x: 0.05, y: 0.9, z: 0 }
    l[11] = { x: -0.15, y: 0.8, z: 0 }; l[12] = { x: 0.15, y: 0.8, z: 0 }
    l[23] = { x: -0.15, y: 0.45, z: 0 }; l[24] = { x: 0.15, y: 0.45, z: 0 }
    // 腿部交叉 (保持大腿长度)
    l[25] = { x: -0.25, y: 0.35, z: 0.12 }; l[26] = { x: 0.05, y: 0.4, z: 0.08 }
    l[27] = { x: -0.2, y: 0.35, z: 0.18 }; l[28] = { x: -0.15, y: 0.35, z: 0.12 }
    l[13] = { x: -0.1, y: 0.7, z: 0.12 }; l[15] = { x: 0.15, y: 0.7, z: 0.12 }
    l[14] = { x: 0.1, y: 0.7, z: -0.08 }; l[16] = { x: -0.15, y: 0.6, z: -0.08 }
    return l
  })(),
  jointAngles: { left_knee: 100, right_knee: 100, left_hip: 90, right_hip: 90, left_shoulder: 130, right_shoulder: 130 },
}

/** 大脚趾式：站立前弯手抓大脚趾 */
const padangusthasana: StandardPoseData = {
  id: 'padangusthasana', nameCN: '大脚趾式', nameEN: 'Big Toe Pose', nameSanskrit: 'Padangusthasana',
  difficulty: 'beginner', category: '站姿', muscles: ['腿后侧', '背部', '核心'],
  landmarks: (() => {
    const l = cloneLandmarks(BASE)
    l[0] = { x: 0, y: 0.6, z: 0.15 }
    l[11] = { x: -0.2, y: 0.7, z: 0.1 }; l[12] = { x: 0.2, y: 0.7, z: 0.1 }
    l[13] = { x: -0.2, y: 0.5, z: 0.2 }; l[15] = { x: -0.15, y: 0.2, z: 0.15 }
    l[14] = { x: 0.2, y: 0.5, z: 0.2 }; l[16] = { x: 0.15, y: 0.2, z: 0.15 }
    return l
  })(),
  jointAngles: { left_knee: 175, right_knee: 175, left_hip: 45, right_hip: 45, left_shoulder: 150, right_shoulder: 150 },
}

/** 弓式：俯卧后弯 */
const dhanurasana: StandardPoseData = {
  id: 'dhanurasana', nameCN: '弓式', nameEN: 'Bow Pose', nameSanskrit: 'Dhanurasana',
  difficulty: 'intermediate', category: '俯卧', muscles: ['背部', '腿部', '核心'],
  landmarks: (() => {
    const l = cloneLandmarks(BASE)
    l[0] = { x: 0, y: 0.6, z: 0.2 }
    l[11] = { x: -0.2, y: 0.5, z: 0.1 }; l[12] = { x: 0.2, y: 0.5, z: 0.1 }
    l[23] = { x: -0.1, y: 0.15, z: -0.08 }; l[24] = { x: 0.1, y: 0.15, z: -0.08 }
    // 腿部向后弯曲 (保持大腿长度)
    l[25] = { x: -0.2, y: 0.35, z: -0.2 }; l[26] = { x: 0.2, y: 0.35, z: -0.2 }
    l[27] = { x: -0.2, y: 0.55, z: -0.1 }; l[28] = { x: 0.2, y: 0.55, z: -0.1 }
    l[13] = { x: -0.2, y: 0.4, z: -0.05 }; l[15] = { x: -0.15, y: 0.55, z: -0.1 }
    l[14] = { x: 0.2, y: 0.4, z: -0.05 }; l[16] = { x: 0.15, y: 0.55, z: -0.1 }
    return l
  })(),
  jointAngles: { left_knee: 120, right_knee: 120, left_hip: 160, right_hip: 160, left_shoulder: 140, right_shoulder: 140 },
}

/** 猫牛式：四点跪姿脊柱活动 */
const chakravakasana: StandardPoseData = {
  id: 'chakravakasana', nameCN: '猫牛式', nameEN: 'Cat Cow Pose', nameSanskrit: 'Chakravakasana',
  difficulty: 'beginner', category: '跪姿', muscles: ['脊柱', '核心', '背部'],
  landmarks: (() => {
    const l = cloneLandmarks(BASE)
    l[0] = { x: 0, y: 0.8, z: 0.25 }
    l[11] = { x: -0.2, y: 0.75, z: 0.2 }; l[12] = { x: 0.2, y: 0.75, z: 0.2 }
    l[23] = { x: -0.1, y: 0.55, z: -0.1 }; l[24] = { x: 0.1, y: 0.55, z: -0.1 }
    l[25] = { x: -0.15, y: 0.4, z: 0.05 }; l[26] = { x: 0.15, y: 0.4, z: 0.05 }
    l[27] = { x: -0.15, y: 0.2, z: -0.08 }; l[28] = { x: 0.15, y: 0.2, z: -0.08 }
    // 手臂支撑 (保持上臂长度)
    l[13] = { x: -0.2, y: 0.6, z: 0.28 }; l[15] = { x: -0.2, y: 0.45, z: 0.32 }
    l[14] = { x: 0.2, y: 0.6, z: 0.28 }; l[16] = { x: 0.2, y: 0.45, z: 0.32 }
    return l
  })(),
  jointAngles: { left_knee: 100, right_knee: 100, left_hip: 120, right_hip: 120, left_shoulder: 160, right_shoulder: 160 },
}

/** 牛面式：坐姿开髋 */
const gomukhasana: StandardPoseData = {
  id: 'gomukhasana', nameCN: '牛面式', nameEN: 'Cow Face Pose', nameSanskrit: 'Gomukhasana',
  difficulty: 'intermediate', category: '坐姿', muscles: ['髋部', '肩部', '手臂'],
  landmarks: (() => {
    const l = cloneLandmarks(BASE)
    l[0] = { x: 0, y: 0.9, z: 0.05 }
    l[11] = { x: -0.15, y: 0.8, z: 0 }; l[12] = { x: 0.15, y: 0.8, z: 0 }
    l[23] = { x: -0.15, y: 0.45, z: 0 }; l[24] = { x: 0.15, y: 0.45, z: 0 }
    // 腿部交叉 (保持大腿长度)
    l[25] = { x: -0.25, y: 0.35, z: 0.12 }; l[26] = { x: 0.05, y: 0.4, z: 0.08 }
    l[27] = { x: -0.2, y: 0.35, z: 0.18 }; l[28] = { x: -0.15, y: 0.35, z: 0.12 }
    l[13] = { x: -0.2, y: 0.55, z: 0.12 }; l[15] = { x: -0.15, y: 0.45, z: 0.18 }
    l[14] = { x: 0.2, y: 0.55, z: 0.12 }; l[16] = { x: 0.15, y: 0.45, z: 0.18 }
    return l
  })(),
  jointAngles: { left_knee: 110, right_knee: 110, left_hip: 80, right_hip: 80, left_shoulder: 150, right_shoulder: 150 },
}

/** 海豚式：前臂倒立准备 */
const ardha_pincha_mayurasana: StandardPoseData = {
  id: 'ardha_pincha_mayurasana', nameCN: '海豚式', nameEN: 'Dolphin Pose', nameSanskrit: 'Ardha Pincha Mayurasana',
  difficulty: 'intermediate', category: '倒置', muscles: ['肩部', '核心', '腿部'],
  landmarks: (() => {
    const l = cloneLandmarks(BASE)
    l[0] = { x: 0, y: 0.6, z: 0.35 }
    l[11] = { x: -0.2, y: 0.8, z: 0.25 }; l[12] = { x: 0.2, y: 0.8, z: 0.25 }
    l[13] = { x: -0.25, y: 0.6, z: 0.35 }; l[14] = { x: 0.25, y: 0.6, z: 0.35 }
    l[15] = { x: -0.2, y: 0.45, z: 0.4 }; l[16] = { x: 0.2, y: 0.45, z: 0.4 }
    l[23] = { x: -0.12, y: 1.1, z: -0.15 }; l[24] = { x: 0.12, y: 1.1, z: -0.15 }
    l[25] = { x: -0.12, y: 0.7, z: -0.35 }; l[26] = { x: 0.12, y: 0.7, z: -0.35 }
    l[27] = { x: -0.12, y: 0.3, z: -0.55 }; l[28] = { x: 0.12, y: 0.3, z: -0.55 }
    return l
  })(),
  jointAngles: { left_knee: 175, right_knee: 175, left_hip: 90, right_hip: 90, left_shoulder: 160, right_shoulder: 160 },
}

/** 鹰式：站立平衡 */
const garudasana: StandardPoseData = {
  id: 'garudasana', nameCN: '鹰式', nameEN: 'Eagle Pose', nameSanskrit: 'Garudasana',
  difficulty: 'intermediate', category: '平衡', muscles: ['腿部', '肩部', '核心'],
  landmarks: (() => {
    const l = cloneLandmarks(BASE)
    l[23] = { x: -0.1, y: 0.7, z: 0 }; l[24] = { x: 0.1, y: 0.7, z: 0 }
    l[25] = { x: -0.1, y: 0.45, z: 0 }; l[26] = { x: 0.15, y: 0.5, z: 0.05 }
    l[27] = { x: -0.1, y: 0.05, z: 0 }; l[28] = { x: 0.05, y: 0.45, z: 0.08 }
    // 手臂交叉 (保持上臂长度)
    l[11] = { x: -0.15, y: 1.25, z: 0 }; l[12] = { x: 0.15, y: 1.25, z: 0 }
    l[13] = { x: -0.2, y: 1.1, z: 0.05 }; l[15] = { x: 0.2, y: 1.1, z: 0.05 }
    l[14] = { x: 0.2, y: 1.1, z: 0.05 }; l[16] = { x: -0.2, y: 1.1, z: 0.05 }
    return l
  })(),
  jointAngles: { left_knee: 175, right_knee: 45, left_hip: 175, right_hip: 60, left_shoulder: 140, right_shoulder: 140 },
}

/** 简易坐姿 */
const sukhasana: StandardPoseData = {
  id: 'sukhasana', nameCN: '简易坐姿', nameEN: 'Easy Pose', nameSanskrit: 'Sukhasana',
  difficulty: 'beginner', category: '坐姿', muscles: ['髋部', '背部'],
  landmarks: (() => {
    const l = cloneLandmarks(BASE)
    l[0] = { x: 0, y: 0.9, z: 0.05 }
    l[11] = { x: -0.2, y: 0.8, z: 0 }; l[12] = { x: 0.2, y: 0.8, z: 0 }
    l[23] = { x: -0.15, y: 0.45, z: 0 }; l[24] = { x: 0.15, y: 0.45, z: 0 }
    // 腿部交叉 (保持大腿长度)
    l[25] = { x: -0.25, y: 0.35, z: 0.12 }; l[26] = { x: 0.25, y: 0.35, z: 0.12 }
    l[27] = { x: -0.2, y: 0.35, z: 0.18 }; l[28] = { x: 0.2, y: 0.35, z: 0.18 }
    l[13] = { x: -0.25, y: 0.6, z: 0.1 }; l[15] = { x: -0.2, y: 0.5, z: 0.15 }
    l[14] = { x: 0.25, y: 0.6, z: 0.1 }; l[16] = { x: 0.2, y: 0.5, z: 0.15 }
    return l
  })(),
  jointAngles: { left_knee: 110, right_knee: 110, left_hip: 80, right_hip: 80, left_shoulder: 150, right_shoulder: 150 },
}

/** 高弓步 */
const utthita_ashwa_sanchalanasana: StandardPoseData = {
  id: 'utthita_ashwa_sanchalanasana', nameCN: '高弓步', nameEN: 'High Lunge', nameSanskrit: 'Utthita Ashwa Sanchalanasana',
  difficulty: 'beginner', category: '站姿', muscles: ['股四头肌', '臀大肌', '核心'],
  landmarks: (() => {
    const l = cloneLandmarks(BASE)
    l[23] = { x: -0.15, y: 0.65, z: 0.08 }; l[24] = { x: 0.15, y: 0.7, z: -0.08 }
    // 腿部 (保持大腿长度0.35)
    l[25] = { x: -0.25, y: 0.4, z: 0.15 }; l[26] = { x: 0.2, y: 0.45, z: -0.2 }
    l[27] = { x: -0.25, y: 0.05, z: 0.1 }; l[28] = { x: 0.2, y: 0.05, z: -0.3 }
    l[11] = { x: -0.18, y: 1.3, z: 0 }; l[12] = { x: 0.18, y: 1.3, z: 0 }
    l[13] = { x: -0.15, y: 1.5, z: 0 }; l[15] = { x: -0.1, y: 1.65, z: 0 }
    l[14] = { x: 0.15, y: 1.5, z: 0 }; l[16] = { x: 0.1, y: 1.65, z: 0 }
    return l
  })(),
  jointAngles: { left_knee: 95, right_knee: 170, left_hip: 95, right_hip: 160, left_shoulder: 170, right_shoulder: 170 },
}

/** 广角前弯 */
const prasarita_padottanasana: StandardPoseData = {
  id: 'prasarita_padottanasana', nameCN: '广角前弯', nameEN: 'Wide-Legged Forward Bend', nameSanskrit: 'Prasarita Padottanasana',
  difficulty: 'beginner', category: '站姿', muscles: ['腿后侧', '背部', '髋部'],
  landmarks: (() => {
    const l = cloneLandmarks(BASE)
    // 双腿分开
    l[23] = { x: -0.3, y: 0.8, z: 0 }; l[24] = { x: 0.3, y: 0.8, z: 0 }
    l[25] = { x: -0.3, y: 0.45, z: 0 }; l[26] = { x: 0.3, y: 0.45, z: 0 }
    l[27] = { x: -0.3, y: 0.05, z: 0 }; l[28] = { x: 0.3, y: 0.05, z: 0 }
    // 身体前弯
    l[0] = { x: 0, y: 0.5, z: 0.25 }
    l[11] = { x: -0.2, y: 0.6, z: 0.15 }; l[12] = { x: 0.2, y: 0.6, z: 0.15 }
    l[13] = { x: -0.3, y: 0.4, z: 0.25 }; l[15] = { x: -0.25, y: 0.2, z: 0.2 }
    l[14] = { x: 0.3, y: 0.4, z: 0.25 }; l[16] = { x: 0.25, y: 0.2, z: 0.2 }
    return l
  })(),
  jointAngles: { left_knee: 175, right_knee: 175, left_hip: 60, right_hip: 60, left_shoulder: 150, right_shoulder: 150 },
}

// ============================================================
// 导出
// ============================================================

export const STANDARD_POSE_DATABASE: StandardPoseData[] = [
  // 初级
  tadasana, vrksasana, adho_mukha_svanasana, utkatasana,
  balasana, bhujangasana, setu_bandhasana, ustrasana, baddha_konasana, savasana,
  bharadvajasana_i, padangusthasana, chakravakasana, sukhasana, utthita_ashwa_sanchalanasana, prasarita_padottanasana,
  // 中级
  virabhadrasana_i, virabhadrasana_ii, trikonasana, utthita_parsvakonasana,
  plank, ardha_matsyendrasana, kapotasana, sarvangasana,
  dhanurasana, gomukhasana, ardha_pincha_mayurasana, garudasana,
  // 高级
  virabhadrasana_iii, natarajasana, chaturanga, navasana, bakasana, sirsasana,
]

export function getStandardPoseData(id: string): StandardPoseData | undefined {
  return STANDARD_POSE_DATABASE.find(p => p.id === id)
}

export function normalizeLandmarks(landmarks: Array<{ x: number; y: number; z: number }>) {
  if (landmarks.length < 33) return landmarks
  const hipCenter = {
    x: (landmarks[23].x + landmarks[24].x) / 2,
    y: (landmarks[23].y + landmarks[24].y) / 2,
    z: (landmarks[23].z + landmarks[24].z) / 2,
  }
  const shoulderWidth = Math.sqrt(
    (landmarks[11].x - landmarks[12].x) ** 2 +
    (landmarks[11].y - landmarks[12].y) ** 2 +
    (landmarks[11].z - landmarks[12].z) ** 2
  )
  if (shoulderWidth < 0.001) return landmarks
  return landmarks.map(lm => ({
    x: (lm.x - hipCenter.x) / shoulderWidth,
    y: (lm.y - hipCenter.y) / shoulderWidth,
    z: (lm.z - hipCenter.z) / shoulderWidth,
  }))
}

export function calculatePoseDistance(pose1: Array<{ x: number; y: number; z: number }>, pose2: Array<{ x: number; y: number; z: number }>) {
  const keyJoints = [
    { idx: 11, weight: 1.5 }, { idx: 12, weight: 1.5 },
    { idx: 13, weight: 1.2 }, { idx: 14, weight: 1.2 },
    { idx: 15, weight: 1.0 }, { idx: 16, weight: 1.0 },
    { idx: 23, weight: 1.5 }, { idx: 24, weight: 1.5 },
    { idx: 25, weight: 1.3 }, { idx: 26, weight: 1.3 },
    { idx: 27, weight: 1.0 }, { idx: 28, weight: 1.0 },
  ]
  let totalDist = 0, totalWeight = 0
  for (const { idx, weight } of keyJoints) {
    if (idx < pose1.length && idx < pose2.length) {
      const dx = pose1[idx].x - pose2[idx].x
      const dy = pose1[idx].y - pose2[idx].y
      const dz = pose1[idx].z - pose2[idx].z
      totalDist += Math.sqrt(dx * dx + dy * dy + dz * dz) * weight
      totalWeight += weight
    }
  }
  return totalWeight > 0 ? totalDist / totalWeight : Infinity
}

// 向后兼容导出
import type { StandardPose, JointAngle } from '@/types/pose'

export const STANDARD_POSES: StandardPose[] = STANDARD_POSE_DATABASE.map(p => ({
  id: p.id, nameCN: p.nameCN, nameEN: p.nameEN, nameSanskrit: p.nameSanskrit,
  difficulty: p.difficulty, category: p.category, description: '', benefits: [],
  targetAngles: Object.entries(p.jointAngles).map(([joint, angle]) => ({
    joint, angle,
    axis: (joint.includes('shoulder') ? 'abduction' : 'flexion') as 'flexion' | 'abduction',
  })),
  tolerance: 20, keyPoints: [], commonMistakes: [],
}))

export function getStandardPose(id: string): StandardPose | undefined {
  return STANDARD_POSES.find(p => p.id === id)
}
