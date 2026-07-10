import type { PoseLandmark } from '@/types/pose'

/**
 * 标准体式位置数据库 (扩展版 - 27个体式)
 *
 * 归一化方案：
 * - 原点：髋部中心
 * - 单位：肩宽 = 1.0
 * - 坐标系：x(右), y(上), z(前)
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
  muscles: string[]  // 主要涉及的肌肉群
}

function lm(x: number, y: number, z: number = 0) {
  return { x, y, z }
}

function cloneLandmarks(l: Array<{ x: number; y: number; z: number }>) {
  return l.map(p => ({ ...p }))
}

// 基础站立模板
const BASE: Array<{ x: number; y: number; z: number }> = [
  lm(0, 1.5, 0), lm(-0.05, 1.55, 0.1), lm(-0.08, 1.55, 0.1),
  lm(-0.11, 1.55, 0.1), lm(0.05, 1.55, 0.1), lm(0.08, 1.55, 0.1),
  lm(0.11, 1.55, 0.1), lm(-0.12, 1.52, 0.08), lm(0.12, 1.52, 0.08),
  lm(0, 1.48, 0.05), lm(0, 1.48, 0.05),
  lm(-0.2, 1.3, 0), lm(0.2, 1.3, 0),
  lm(-0.35, 1.1, 0), lm(0.35, 1.1, 0),
  lm(-0.45, 0.9, 0), lm(0.45, 0.9, 0),
  lm(-0.48, 0.88, 0.02), lm(0.48, 0.88, 0.02),
  lm(-0.46, 0.88, 0.02), lm(0.46, 0.88, 0.02),
  lm(-0.47, 0.85, 0.02), lm(0.47, 0.85, 0.02),
  lm(-0.1, 0.8, 0), lm(0.1, 0.8, 0),
  lm(-0.1, 0.45, 0), lm(0.1, 0.45, 0),
  lm(-0.1, 0.05, 0), lm(0.1, 0.05, 0),
  lm(-0.15, 0, 0.1), lm(0.15, 0, 0.1),
  lm(-0.05, 0, 0.15), lm(0.05, 0, 0.15),
]

// ============================================================
// 初级体式 (8个)
// ============================================================

const tadasana: StandardPoseData = {
  id: 'tadasana', nameCN: '山式', nameEN: 'Mountain Pose', nameSanskrit: 'Tadasana',
  difficulty: 'beginner', category: '站立', muscles: ['核心', '腿部'],
  landmarks: cloneLandmarks(BASE),
  jointAngles: { left_knee: 175, right_knee: 175, left_hip: 175, right_hip: 175, left_shoulder: 170, right_shoulder: 170 },
}

const vrksasana: StandardPoseData = {
  id: 'vrksasana', nameCN: '树式', nameEN: 'Tree Pose', nameSanskrit: 'Vrksasana',
  difficulty: 'beginner', category: '平衡', muscles: ['核心', '腿部', '臀部'],
  landmarks: (() => {
    const l = cloneLandmarks(BASE)
    l[26] = { x: 0.15, y: 0.6, z: 0 }
    l[28] = { x: 0.05, y: 0.55, z: 0.05 }
    l[13] = { x: -0.15, y: 1.35, z: 0 }; l[15] = { x: -0.1, y: 1.5, z: 0 }
    l[14] = { x: 0.15, y: 1.35, z: 0 }; l[16] = { x: 0.1, y: 1.5, z: 0 }
    return l
  })(),
  jointAngles: { left_knee: 175, right_knee: 45, left_hip: 175, right_hip: 60, left_shoulder: 160, right_shoulder: 160 },
}

const adho_mukha_svanasana: StandardPoseData = {
  id: 'adho_mukha_svanasana', nameCN: '下犬式', nameEN: 'Downward Dog', nameSanskrit: 'Adho Mukha Svanasana',
  difficulty: 'beginner', category: '倒置', muscles: ['腿部', '肩部', '核心'],
  landmarks: (() => {
    const l = cloneLandmarks(BASE)
    l[23] = { x: -0.12, y: 1.1, z: -0.2 }; l[24] = { x: 0.12, y: 1.1, z: -0.2 }
    l[11] = { x: -0.2, y: 1.0, z: 0.3 }; l[12] = { x: 0.2, y: 1.0, z: 0.3 }
    l[13] = { x: -0.25, y: 0.8, z: 0.4 }; l[14] = { x: 0.25, y: 0.8, z: 0.4 }
    l[15] = { x: -0.2, y: 0.6, z: 0.5 }; l[16] = { x: 0.2, y: 0.6, z: 0.5 }
    l[0] = { x: 0, y: 0.7, z: 0.4 }
    l[25] = { x: -0.12, y: 0.7, z: -0.4 }; l[26] = { x: 0.12, y: 0.7, z: -0.4 }
    l[27] = { x: -0.12, y: 0.3, z: -0.6 }; l[28] = { x: 0.12, y: 0.3, z: -0.6 }
    return l
  })(),
  jointAngles: { left_knee: 175, right_knee: 175, left_hip: 90, right_hip: 90, left_shoulder: 170, right_shoulder: 170 },
}

const utkatasana: StandardPoseData = {
  id: 'utkatasana', nameCN: '幻椅式', nameEN: 'Chair Pose', nameSanskrit: 'Utkatasana',
  difficulty: 'beginner', category: '站立', muscles: ['股四头肌', '臀大肌', '核心'],
  landmarks: (() => {
    const l = cloneLandmarks(BASE)
    l[23] = { x: -0.1, y: 0.7, z: 0.1 }; l[24] = { x: 0.1, y: 0.7, z: 0.1 }
    l[25] = { x: -0.15, y: 0.5, z: 0.15 }; l[26] = { x: 0.15, y: 0.5, z: 0.15 }
    l[11] = { x: -0.18, y: 1.35, z: 0 }; l[12] = { x: 0.18, y: 1.35, z: 0 }
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
    l[23] = { x: -0.1, y: 0.5, z: -0.1 }; l[24] = { x: 0.1, y: 0.5, z: -0.1 }
    l[25] = { x: -0.15, y: 0.35, z: 0.1 }; l[26] = { x: 0.15, y: 0.35, z: 0.1 }
    l[27] = { x: -0.15, y: 0.2, z: -0.1 }; l[28] = { x: 0.15, y: 0.2, z: -0.1 }
    l[11] = { x: -0.15, y: 0.6, z: 0.2 }; l[12] = { x: 0.15, y: 0.6, z: 0.2 }
    l[0] = { x: 0, y: 0.4, z: 0.4 }
    l[13] = { x: -0.2, y: 0.5, z: 0.5 }; l[15] = { x: -0.2, y: 0.4, z: 0.8 }
    l[14] = { x: 0.2, y: 0.5, z: 0.5 }; l[16] = { x: 0.2, y: 0.4, z: 0.8 }
    return l
  })(),
  jointAngles: { left_knee: 90, right_knee: 90, left_hip: 45, right_hip: 45, left_shoulder: 160, right_shoulder: 160 },
}

const bhujangasana: StandardPoseData = {
  id: 'bhujangasana', nameCN: '眼镜蛇式', nameEN: 'Cobra Pose', nameSanskrit: 'Bhujangasana',
  difficulty: 'beginner', category: '俯卧', muscles: ['背部', '手臂', '核心'],
  landmarks: (() => {
    const l = cloneLandmarks(BASE)
    l[23] = { x: -0.1, y: 0.15, z: -0.1 }; l[24] = { x: 0.1, y: 0.15, z: -0.1 }
    l[25] = { x: -0.1, y: 0.1, z: -0.3 }; l[26] = { x: 0.1, y: 0.1, z: -0.3 }
    l[27] = { x: -0.1, y: 0.05, z: -0.5 }; l[28] = { x: 0.1, y: 0.05, z: -0.5 }
    l[11] = { x: -0.2, y: 0.5, z: 0.1 }; l[12] = { x: 0.2, y: 0.5, z: 0.1 }
    l[0] = { x: 0, y: 0.7, z: 0.15 }
    l[13] = { x: -0.25, y: 0.4, z: 0.15 }; l[14] = { x: 0.25, y: 0.4, z: 0.15 }
    l[15] = { x: -0.25, y: 0.3, z: 0.1 }; l[16] = { x: 0.25, y: 0.3, z: 0.1 }
    return l
  })(),
  jointAngles: { left_knee: 175, right_knee: 175, left_hip: 160, right_hip: 160, left_shoulder: 100, right_shoulder: 100, left_elbow: 150, right_elbow: 150 },
}

const setu_bandhasana: StandardPoseData = {
  id: 'setu_bandhasana', nameCN: '桥式', nameEN: 'Bridge Pose', nameSanskrit: 'Setu Bandhasana',
  difficulty: 'beginner', category: '仰卧', muscles: ['臀大肌', '腿部', '背部'],
  landmarks: (() => {
    const l = cloneLandmarks(BASE)
    l[0] = { x: 0, y: 0.2, z: -0.15 }
    l[11] = { x: -0.2, y: 0.2, z: 0 }; l[12] = { x: 0.2, y: 0.2, z: 0 }
    l[23] = { x: -0.1, y: 0.5, z: 0 }; l[24] = { x: 0.1, y: 0.5, z: 0 }
    l[25] = { x: -0.2, y: 0.35, z: 0.2 }; l[26] = { x: 0.2, y: 0.35, z: 0.2 }
    l[27] = { x: -0.2, y: 0.1, z: 0.3 }; l[28] = { x: 0.2, y: 0.1, z: 0.3 }
    l[13] = { x: -0.25, y: 0.15, z: 0 }; l[15] = { x: -0.15, y: 0.15, z: 0.1 }
    l[14] = { x: 0.25, y: 0.15, z: 0 }; l[16] = { x: 0.15, y: 0.15, z: 0.1 }
    return l
  })(),
  jointAngles: { left_knee: 100, right_knee: 100, left_hip: 120, right_hip: 120, left_shoulder: 170, right_shoulder: 170 },
}

const ustrasana: StandardPoseData = {
  id: 'ustrasana', nameCN: '骆驼式', nameEN: 'Camel Pose', nameSanskrit: 'Ustrasana',
  difficulty: 'beginner', category: '跪姿', muscles: ['髋屈肌', '腹部', '背部'],
  landmarks: (() => {
    const l = cloneLandmarks(BASE)
    l[0] = { x: 0, y: 1.3, z: -0.2 }
    l[11] = { x: -0.2, y: 1.1, z: -0.1 }; l[12] = { x: 0.2, y: 1.1, z: -0.1 }
    l[23] = { x: -0.1, y: 0.6, z: 0 }; l[24] = { x: 0.1, y: 0.6, z: 0 }
    l[25] = { x: -0.15, y: 0.4, z: 0.1 }; l[26] = { x: 0.15, y: 0.4, z: 0.1 }
    l[27] = { x: -0.15, y: 0.15, z: 0 }; l[28] = { x: 0.15, y: 0.15, z: 0 }
    l[13] = { x: -0.2, y: 0.5, z: 0.1 }; l[15] = { x: -0.2, y: 0.5, z: 0.15 }
    l[14] = { x: 0.2, y: 0.5, z: 0.1 }; l[16] = { x: 0.2, y: 0.5, z: 0.15 }
    return l
  })(),
  jointAngles: { left_knee: 100, right_knee: 100, left_hip: 150, right_hip: 150, left_shoulder: 130, right_shoulder: 130 },
}

const savasana: StandardPoseData = {
  id: 'savasana', nameCN: '挺尸式', nameEN: 'Corpse Pose', nameSanskrit: 'Savasana',
  difficulty: 'beginner', category: '仰卧', muscles: ['全身放松'],
  landmarks: (() => {
    const l = cloneLandmarks(BASE)
    l[0] = { x: 0, y: 0.15, z: -0.1 }
    l[11] = { x: -0.2, y: 0.15, z: 0 }; l[12] = { x: 0.2, y: 0.15, z: 0 }
    l[23] = { x: -0.1, y: 0.15, z: 0 }; l[24] = { x: 0.1, y: 0.15, z: 0 }
    l[13] = { x: -0.3, y: 0.15, z: 0 }; l[15] = { x: -0.4, y: 0.12, z: 0 }
    l[14] = { x: 0.3, y: 0.15, z: 0 }; l[16] = { x: 0.4, y: 0.12, z: 0 }
    l[25] = { x: -0.1, y: 0.12, z: 0.3 }; l[26] = { x: 0.1, y: 0.12, z: 0.3 }
    l[27] = { x: -0.1, y: 0.1, z: 0.6 }; l[28] = { x: 0.1, y: 0.1, z: 0.6 }
    return l
  })(),
  jointAngles: { left_knee: 175, right_knee: 175, left_hip: 175, right_hip: 175, left_shoulder: 175, right_shoulder: 175 },
}

// ============================================================
// 中级体式 (11个)
// ============================================================

const virabhadrasana_i: StandardPoseData = {
  id: 'virabhadrasana_i', nameCN: '战士一式', nameEN: 'Warrior I', nameSanskrit: 'Virabhadrasana I',
  difficulty: 'intermediate', category: '站立', muscles: ['股四头肌', '臀大肌', '髋屈肌'],
  landmarks: (() => {
    const l = cloneLandmarks(BASE)
    l[23] = { x: -0.15, y: 0.65, z: 0.1 }; l[24] = { x: 0.15, y: 0.65, z: -0.1 }
    l[25] = { x: -0.2, y: 0.5, z: 0.15 }; l[26] = { x: 0.15, y: 0.45, z: -0.2 }
    l[27] = { x: -0.2, y: 0.05, z: 0.1 }; l[28] = { x: 0.15, y: 0.05, z: -0.3 }
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
    l[25] = { x: -0.2, y: 0.5, z: 0.1 }; l[23] = { x: -0.15, y: 0.75, z: 0 }
    l[26] = { x: 0.2, y: 0.45, z: -0.1 }
    l[13] = { x: -0.5, y: 1.3, z: 0 }; l[15] = { x: -0.7, y: 1.3, z: 0 }
    l[14] = { x: 0.5, y: 1.3, z: 0 }; l[16] = { x: 0.7, y: 1.3, z: 0 }
    l[17] = { x: -0.75, y: 1.3, z: 0 }; l[19] = { x: -0.73, y: 1.3, z: 0 }
    l[18] = { x: 0.75, y: 1.3, z: 0 }; l[20] = { x: 0.73, y: 1.3, z: 0 }
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
    l[13] = { x: 0.1, y: 0.8, z: 0 }; l[15] = { x: 0.15, y: 0.3, z: 0 }
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
    l[23] = { x: -0.2, y: 0.6, z: 0.1 }; l[24] = { x: 0.2, y: 0.8, z: -0.1 }
    l[25] = { x: -0.25, y: 0.5, z: 0.15 }; l[26] = { x: 0.2, y: 0.45, z: -0.1 }
    l[11] = { x: -0.15, y: 1.0, z: 0 }; l[12] = { x: 0.2, y: 1.1, z: 0 }
    l[13] = { x: -0.2, y: 0.7, z: 0.1 }; l[15] = { x: -0.15, y: 0.5, z: 0.15 }
    l[14] = { x: 0.3, y: 1.3, z: -0.1 }; l[16] = { x: 0.5, y: 1.5, z: -0.15 }
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
    l[0] = { x: 0, y: 0.8, z: 0.3 }
    l[11] = { x: -0.2, y: 0.8, z: 0.3 }; l[12] = { x: 0.2, y: 0.8, z: 0.3 }
    l[23] = { x: -0.1, y: 0.75, z: -0.1 }; l[24] = { x: 0.1, y: 0.75, z: -0.1 }
    l[25] = { x: -0.1, y: 0.7, z: -0.3 }; l[26] = { x: 0.1, y: 0.7, z: -0.3 }
    l[27] = { x: -0.1, y: 0.65, z: -0.5 }; l[28] = { x: 0.1, y: 0.65, z: -0.5 }
    l[13] = { x: -0.2, y: 0.7, z: 0.35 }; l[15] = { x: -0.2, y: 0.65, z: 0.4 }
    l[14] = { x: 0.2, y: 0.7, z: 0.35 }; l[16] = { x: 0.2, y: 0.65, z: 0.4 }
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
    l[25] = { x: -0.2, y: 0.4, z: 0.15 }; l[26] = { x: 0.05, y: 0.45, z: 0.1 }
    l[27] = { x: -0.2, y: 0.35, z: 0.2 }; l[28] = { x: -0.15, y: 0.4, z: 0.15 }
    l[13] = { x: -0.1, y: 0.7, z: 0.15 }; l[15] = { x: 0.15, y: 0.7, z: 0.15 }
    l[14] = { x: 0.1, y: 0.7, z: -0.1 }; l[16] = { x: -0.15, y: 0.6, z: -0.1 }
    return l
  })(),
  jointAngles: { left_knee: 100, right_knee: 100, left_hip: 90, right_hip: 90, left_shoulder: 130, right_shoulder: 130 },
}

const kapotasana: StandardPoseData = {
  id: 'kapotasana', nameCN: '鸽式', nameEN: 'Pigeon Pose', nameSanskrit: 'Kapotasana',
  difficulty: 'intermediate', category: '坐姿', muscles: ['髋屈肌', '臀部', '核心'],
  landmarks: (() => {
    const l = cloneLandmarks(BASE)
    l[0] = { x: 0, y: 0.8, z: 0.1 }
    l[11] = { x: -0.2, y: 0.7, z: 0 }; l[12] = { x: 0.2, y: 0.7, z: 0 }
    l[23] = { x: -0.1, y: 0.45, z: 0 }; l[24] = { x: 0.1, y: 0.45, z: 0 }
    l[25] = { x: -0.2, y: 0.35, z: 0.15 }; l[26] = { x: 0.15, y: 0.4, z: -0.2 }
    l[27] = { x: -0.2, y: 0.3, z: 0.2 }; l[28] = { x: 0.2, y: 0.35, z: -0.3 }
    l[13] = { x: -0.25, y: 0.6, z: 0.1 }; l[15] = { x: -0.3, y: 0.55, z: 0.15 }
    l[14] = { x: 0.25, y: 0.6, z: 0.1 }; l[16] = { x: 0.3, y: 0.55, z: 0.15 }
    return l
  })(),
  jointAngles: { left_knee: 100, right_knee: 160, left_hip: 90, right_hip: 160, left_shoulder: 150, right_shoulder: 150 },
}

const baddha_konasana: StandardPoseData = {
  id: 'baddha_konasana', nameCN: '蝴蝶式', nameEN: 'Butterfly Pose', nameSanskrit: 'Baddha Konasana',
  difficulty: 'beginner', category: '坐姿', muscles: ['髋部', '大腿内侧'],
  landmarks: (() => {
    const l = cloneLandmarks(BASE)
    l[0] = { x: 0, y: 0.9, z: 0.05 }
    l[11] = { x: -0.2, y: 0.8, z: 0 }; l[12] = { x: 0.2, y: 0.8, z: 0 }
    l[23] = { x: -0.1, y: 0.45, z: 0 }; l[24] = { x: 0.1, y: 0.45, z: 0 }
    l[25] = { x: -0.2, y: 0.35, z: 0.15 }; l[26] = { x: 0.2, y: 0.35, z: 0.15 }
    l[27] = { x: -0.15, y: 0.35, z: 0.2 }; l[28] = { x: 0.15, y: 0.35, z: 0.2 }
    l[13] = { x: -0.2, y: 0.55, z: 0.15 }; l[15] = { x: -0.15, y: 0.45, z: 0.2 }
    l[14] = { x: 0.2, y: 0.55, z: 0.15 }; l[16] = { x: 0.15, y: 0.45, z: 0.2 }
    return l
  })(),
  jointAngles: { left_knee: 110, right_knee: 110, left_hip: 80, right_hip: 80, left_shoulder: 150, right_shoulder: 150 },
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
    l[13] = { x: -0.15, y: 0.2, z: 0.1 }; l[15] = { x: -0.15, y: 0.3, z: 0.15 }
    l[14] = { x: 0.15, y: 0.2, z: 0.1 }; l[16] = { x: 0.15, y: 0.3, z: 0.15 }
    return l
  })(),
  jointAngles: { left_knee: 175, right_knee: 175, left_hip: 175, right_hip: 175, left_shoulder: 150, right_shoulder: 150 },
}

// ============================================================
// 高级体式 (8个)
// ============================================================

const virabhadrasana_iii: StandardPoseData = {
  id: 'virabhadrasana_iii', nameCN: '战士三式', nameEN: 'Warrior III', nameSanskrit: 'Virabhadrasana III',
  difficulty: 'advanced', category: '站立', muscles: ['臀大肌', '核心', '背部'],
  landmarks: (() => {
    const l = cloneLandmarks(BASE)
    l[23] = { x: -0.1, y: 0.7, z: 0 }; l[24] = { x: 0.1, y: 0.7, z: 0 }
    l[25] = { x: -0.1, y: 0.45, z: 0 }; l[26] = { x: 0.3, y: 0.75, z: -0.2 }
    l[27] = { x: -0.1, y: 0.05, z: 0 }; l[28] = { x: 0.5, y: 0.8, z: -0.3 }
    l[11] = { x: -0.2, y: 1.2, z: 0.2 }; l[12] = { x: 0.2, y: 1.2, z: 0.2 }
    l[13] = { x: -0.2, y: 1.1, z: 0.4 }; l[15] = { x: -0.2, y: 1.0, z: 0.6 }
    l[14] = { x: 0.2, y: 1.1, z: 0.4 }; l[16] = { x: 0.2, y: 1.0, z: 0.6 }
    l[0] = { x: 0, y: 1.1, z: 0.2 }
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
    l[25] = { x: -0.1, y: 0.45, z: 0 }; l[26] = { x: 0.15, y: 0.7, z: -0.2 }
    l[27] = { x: -0.1, y: 0.05, z: 0 }; l[28] = { x: 0.2, y: 0.8, z: -0.3 }
    l[11] = { x: -0.2, y: 1.2, z: 0 }; l[12] = { x: 0.2, y: 1.3, z: 0 }
    l[13] = { x: -0.2, y: 1.4, z: 0 }; l[15] = { x: -0.2, y: 1.6, z: 0 }
    l[14] = { x: 0.2, y: 1.2, z: -0.1 }; l[16] = { x: 0.2, y: 0.8, z: -0.25 }
    return l
  })(),
  jointAngles: { left_knee: 175, right_knee: 90, left_hip: 175, right_hip: 130, left_shoulder: 170, right_shoulder: 150 },
}

const chaturanga: StandardPoseData = {
  id: 'chaturanga', nameCN: '鳄鱼式', nameEN: 'Chaturanga', nameSanskrit: 'Chaturanga Dandasana',
  difficulty: 'advanced', category: '俯卧', muscles: ['肱三头肌', '核心', '肩部'],
  landmarks: (() => {
    const l = cloneLandmarks(BASE)
    l[0] = { x: 0, y: 0.5, z: 0.3 }
    l[11] = { x: -0.2, y: 0.5, z: 0.3 }; l[12] = { x: 0.2, y: 0.5, z: 0.3 }
    l[23] = { x: -0.1, y: 0.45, z: -0.1 }; l[24] = { x: 0.1, y: 0.45, z: -0.1 }
    l[25] = { x: -0.1, y: 0.4, z: -0.3 }; l[26] = { x: 0.1, y: 0.4, z: -0.3 }
    l[27] = { x: -0.1, y: 0.35, z: -0.5 }; l[28] = { x: 0.1, y: 0.35, z: -0.5 }
    l[13] = { x: -0.2, y: 0.4, z: 0.3 }; l[15] = { x: -0.2, y: 0.35, z: 0.3 }
    l[14] = { x: 0.2, y: 0.4, z: 0.3 }; l[16] = { x: 0.2, y: 0.35, z: 0.3 }
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
    l[25] = { x: -0.15, y: 0.6, z: 0.3 }; l[26] = { x: 0.15, y: 0.6, z: 0.3 }
    l[27] = { x: -0.2, y: 0.7, z: 0.5 }; l[28] = { x: 0.2, y: 0.7, z: 0.5 }
    l[11] = { x: -0.18, y: 0.7, z: -0.1 }; l[12] = { x: 0.18, y: 0.7, z: -0.1 }
    l[0] = { x: 0, y: 0.9, z: -0.1 }
    l[13] = { x: -0.2, y: 0.7, z: 0.2 }; l[15] = { x: -0.2, y: 0.7, z: 0.4 }
    l[14] = { x: 0.2, y: 0.7, z: 0.2 }; l[16] = { x: 0.2, y: 0.7, z: 0.4 }
    return l
  })(),
  jointAngles: { left_knee: 175, right_knee: 175, left_hip: 50, right_hip: 50, left_shoulder: 60, right_shoulder: 60 },
}

const bakasana: StandardPoseData = {
  id: 'bakasana', nameCN: '乌鸦式', nameEN: 'Crow Pose', nameSanskrit: 'Bakasana',
  difficulty: 'advanced', category: '平衡', muscles: ['手臂', '核心', '肩部'],
  landmarks: (() => {
    const l = cloneLandmarks(BASE)
    l[0] = { x: 0, y: 0.7, z: 0.2 }
    l[11] = { x: -0.2, y: 0.65, z: 0.15 }; l[12] = { x: 0.2, y: 0.65, z: 0.15 }
    l[23] = { x: -0.1, y: 0.6, z: 0.1 }; l[24] = { x: 0.1, y: 0.6, z: 0.1 }
    l[25] = { x: -0.15, y: 0.55, z: 0.2 }; l[26] = { x: 0.15, y: 0.55, z: 0.2 }
    l[27] = { x: -0.1, y: 0.5, z: 0.25 }; l[28] = { x: 0.1, y: 0.5, z: 0.25 }
    l[13] = { x: -0.2, y: 0.55, z: 0.2 }; l[15] = { x: -0.2, y: 0.5, z: 0.25 }
    l[14] = { x: 0.2, y: 0.55, z: 0.2 }; l[16] = { x: 0.2, y: 0.5, z: 0.25 }
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
    l[13] = { x: -0.15, y: 0.2, z: 0.1 }; l[15] = { x: -0.15, y: 0.3, z: 0.15 }
    l[14] = { x: 0.15, y: 0.2, z: 0.1 }; l[16] = { x: 0.15, y: 0.3, z: 0.15 }
    return l
  })(),
  jointAngles: { left_knee: 175, right_knee: 175, left_hip: 175, right_hip: 175, left_shoulder: 150, right_shoulder: 150 },
}

// ============================================================
// 导出
// ============================================================

export const STANDARD_POSE_DATABASE: StandardPoseData[] = [
  // 初级
  tadasana, vrksasana, adho_mukha_svanasana, utkatasana,
  balasana, bhujangasana, setu_bandhasana, ustrasana, savasana, baddha_konasana,
  // 中级
  virabhadrasana_i, virabhadrasana_ii, trikonasana, utthita_parsvakonasana,
  plank, ardha_matsyendrasana, kapotasana, sarvangasana,
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
    joint, angle, axis: 'flexion' as const,
  })),
  tolerance: 20, keyPoints: [], commonMistakes: [],
}))

export function getStandardPose(id: string): StandardPose | undefined {
  return STANDARD_POSES.find(p => p.id === id)
}
