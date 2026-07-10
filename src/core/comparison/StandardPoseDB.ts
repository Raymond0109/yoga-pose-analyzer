import type { PoseLandmark } from '@/types/pose'

/**
 * 标准体式位置数据库
 *
 * 归一化方案：
 * - 原点：髋部中心 (landmarks[23] 和 [24] 的中点)
 * - 单位：肩宽 (landmarks[11] 和 [12] 的距离) = 1.0
 * - 坐标系：x(右), y(上), z(前)
 *
 * 每个体式包含33个关键点的归一化坐标
 * 值为相对于髋部中心的偏移，除以肩宽
 */

export interface StandardPoseData {
  id: string
  nameCN: string
  nameEN: string
  /** 归一化的33个关键点坐标 */
  landmarks: Array<{ x: number; y: number; z: number }>
  /** 关键关节角度参考值 */
  jointAngles: Record<string, number>
  /** 难度 */
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

/**
 * 生成标准体式的关键点坐标
 * 基于解剖学知识和典型体式姿态
 */

// 辅助函数：创建关键点
function lm(x: number, y: number, z: number = 0): { x: number; y: number; z: number } {
  return { x, y, z }
}

// 基础站立姿态的关键点 (作为模板)
const STANDING_BASE: Array<{ x: number; y: number; z: number }> = [
  lm(0, 1.5, 0),        // 0: nose
  lm(-0.05, 1.55, 0.1), // 1: left_eye_inner
  lm(-0.08, 1.55, 0.1), // 2: left_eye
  lm(-0.11, 1.55, 0.1), // 3: left_eye_outer
  lm(0.05, 1.55, 0.1),  // 4: right_eye_inner
  lm(0.08, 1.55, 0.1),  // 5: right_eye
  lm(0.11, 1.55, 0.1),  // 6: right_eye_outer
  lm(-0.12, 1.52, 0.08),// 7: left_ear
  lm(0.12, 1.52, 0.08), // 8: right_ear
  lm(0, 1.48, 0.05),    // 9: mouth_left
  lm(0, 1.48, 0.05),    // 10: mouth_right
  lm(-0.2, 1.3, 0),     // 11: left_shoulder
  lm(0.2, 1.3, 0),      // 12: right_shoulder
  lm(-0.35, 1.1, 0),    // 13: left_elbow
  lm(0.35, 1.1, 0),     // 14: right_elbow
  lm(-0.45, 0.9, 0),    // 15: left_wrist
  lm(0.45, 0.9, 0),     // 16: right_wrist
  lm(-0.48, 0.88, 0.02),// 17: left_pinky
  lm(0.48, 0.88, 0.02), // 18: right_pinky
  lm(-0.46, 0.88, 0.02),// 19: left_index
  lm(0.46, 0.88, 0.02), // 20: right_index
  lm(-0.47, 0.85, 0.02),// 21: left_thumb
  lm(0.47, 0.85, 0.02), // 22: right_thumb
  lm(-0.1, 0.8, 0),     // 23: left_hip
  lm(0.1, 0.8, 0),      // 24: right_hip
  lm(-0.1, 0.45, 0),    // 25: left_knee
  lm(0.1, 0.45, 0),     // 26: right_knee
  lm(-0.1, 0.05, 0),    // 27: left_ankle
  lm(0.1, 0.05, 0),     // 28: right_ankle
  lm(-0.15, 0, 0.1),    // 29: left_heel
  lm(0.15, 0, 0.1),     // 30: right_heel
  lm(-0.05, 0, 0.15),   // 31: left_foot_index
  lm(0.05, 0, 0.15),    // 32: right_foot_index
]

/** 深拷贝关键点数组 */
function cloneLandmarks(landmarks: Array<{ x: number; y: number; z: number }>) {
  return landmarks.map(l => ({ ...l }))
}

/** 修改指定关键点 */
function modifyLandmarks(
  landmarks: Array<{ x: number; y: number; z: number }>,
  indices: number[],
  modifier: (idx: number) => { x: number; y: number; z: number }
) {
  const result = cloneLandmarks(landmarks)
  for (const idx of indices) {
    result[idx] = modifier(idx)
  }
  return result
}

// ============================================================
// 10个标准体式的定义
// ============================================================

/** 山式：站立，双腿伸直，双臂自然下垂 */
const tadasana: StandardPoseData = {
  id: 'tadasana',
  nameCN: '山式',
  nameEN: 'Mountain Pose',
  difficulty: 'beginner',
  landmarks: cloneLandmarks(STANDING_BASE),
  jointAngles: {
    left_knee: 175, right_knee: 175,
    left_hip: 175, right_hip: 175,
    left_shoulder: 170, right_shoulder: 170,
    left_elbow: 170, right_elbow: 170,
  },
}

/** 战士二式：前膝弯曲90°，双臂平举 */
const virabhadrasana_ii: StandardPoseData = {
  id: 'virabhadrasana_ii',
  nameCN: '战士二式',
  nameEN: 'Warrior II',
  difficulty: 'beginner',
  landmarks: (() => {
    const lm = cloneLandmarks(STANDING_BASE)
    // 前腿弯曲
    lm[25] = { x: -0.2, y: 0.5, z: 0.1 }   // 左膝前移
    lm[23] = { x: -0.15, y: 0.75, z: 0 }   // 左髋略低
    // 后腿伸直
    lm[26] = { x: 0.2, y: 0.45, z: -0.1 }
    // 双臂平举
    lm[13] = { x: -0.5, y: 1.3, z: 0 }     // 左肘
    lm[15] = { x: -0.7, y: 1.3, z: 0 }     // 左腕
    lm[14] = { x: 0.5, y: 1.3, z: 0 }      // 右肘
    lm[16] = { x: 0.7, y: 1.3, z: 0 }      // 右腕
    // 手指
    lm[17] = { x: -0.75, y: 1.3, z: 0 }
    lm[19] = { x: -0.73, y: 1.3, z: 0 }
    lm[21] = { x: -0.72, y: 1.28, z: 0 }
    lm[18] = { x: 0.75, y: 1.3, z: 0 }
    lm[20] = { x: 0.73, y: 1.3, z: 0 }
    lm[22] = { x: 0.72, y: 1.28, z: 0 }
    // 头转向左侧
    lm[0] = { x: -0.05, y: 1.5, z: 0 }
    return lm
  })(),
  jointAngles: {
    left_knee: 90, right_knee: 175,
    left_hip: 90, right_hip: 140,
    left_shoulder: 90, right_shoulder: 90,
  },
}

/** 三角式：侧弯，一手触地 */
const trikonasana: StandardPoseData = {
  id: 'trikonasana',
  nameCN: '三角式',
  nameEN: 'Triangle Pose',
  difficulty: 'beginner',
  landmarks: (() => {
    const lm = cloneLandmarks(STANDING_BASE)
    // 双腿分开
    lm[23] = { x: -0.2, y: 0.8, z: 0 }
    lm[24] = { x: 0.2, y: 0.8, z: 0 }
    lm[25] = { x: -0.2, y: 0.45, z: 0 }
    lm[26] = { x: 0.2, y: 0.45, z: 0 }
    lm[27] = { x: -0.2, y: 0.05, z: 0 }
    lm[28] = { x: 0.2, y: 0.05, z: 0 }
    // 身体侧弯 (向右)
    lm[0] = { x: 0.1, y: 1.3, z: 0 }      // 头偏向右侧
    lm[11] = { x: -0.1, y: 1.2, z: 0 }    // 左肩降低
    lm[12] = { x: 0.25, y: 1.1, z: 0 }
    // 左手向下触地
    lm[13] = { x: 0.1, y: 0.8, z: 0 }
    lm[15] = { x: 0.15, y: 0.3, z: 0 }
    // 右手向上
    lm[14] = { x: 0.3, y: 1.4, z: 0 }
    lm[16] = { x: 0.3, y: 1.6, z: 0 }
    return lm
  })(),
  jointAngles: {
    left_knee: 175, right_knee: 175,
    left_hip: 120, right_hip: 120,
    left_shoulder: 170, right_shoulder: 30,
  },
}

/** 下犬式：倒V形，手臂和腿伸直 */
const adho_mukha_svanasana: StandardPoseData = {
  id: 'adho_mukha_svanasana',
  nameCN: '下犬式',
  nameEN: 'Downward Dog',
  difficulty: 'beginner',
  landmarks: (() => {
    const lm = cloneLandmarks(STANDING_BASE)
    // 髋部抬高
    lm[23] = { x: -0.12, y: 1.1, z: -0.2 }
    lm[24] = { x: 0.12, y: 1.1, z: -0.2 }
    // 手臂向前伸直
    lm[11] = { x: -0.2, y: 1.0, z: 0.3 }
    lm[12] = { x: 0.2, y: 1.0, z: 0.3 }
    lm[13] = { x: -0.25, y: 0.8, z: 0.4 }
    lm[14] = { x: 0.25, y: 0.8, z: 0.4 }
    lm[15] = { x: -0.2, y: 0.6, z: 0.5 }
    lm[16] = { x: 0.2, y: 0.6, z: 0.5 }
    // 头在手臂之间
    lm[0] = { x: 0, y: 0.7, z: 0.4 }
    // 腿向后伸直
    lm[25] = { x: -0.12, y: 0.7, z: -0.4 }
    lm[26] = { x: 0.12, y: 0.7, z: -0.4 }
    lm[27] = { x: -0.12, y: 0.3, z: -0.6 }
    lm[28] = { x: 0.12, y: 0.3, z: -0.6 }
    return lm
  })(),
  jointAngles: {
    left_knee: 175, right_knee: 175,
    left_hip: 90, right_hip: 90,
    left_shoulder: 170, right_shoulder: 170,
    left_elbow: 175, right_elbow: 175,
  },
}

/** 树式：单腿站立，一脚抵大腿 */
const vrksasana: StandardPoseData = {
  id: 'vrksasana',
  nameCN: '树式',
  nameEN: 'Tree Pose',
  difficulty: 'beginner',
  landmarks: (() => {
    const lm = cloneLandmarks(STANDING_BASE)
    // 右腿弯曲，脚抵左大腿内侧
    lm[26] = { x: 0.15, y: 0.6, z: 0 }     // 右膝外展
    lm[28] = { x: 0.05, y: 0.55, z: 0.05 } // 右踝靠近左大腿
    // 双手合十上举
    lm[13] = { x: -0.15, y: 1.35, z: 0 }
    lm[15] = { x: -0.1, y: 1.5, z: 0 }
    lm[14] = { x: 0.15, y: 1.35, z: 0 }
    lm[16] = { x: 0.1, y: 1.5, z: 0 }
    return lm
  })(),
  jointAngles: {
    left_knee: 175, right_knee: 45,
    left_hip: 175, right_hip: 60,
    left_shoulder: 160, right_shoulder: 160,
  },
}

/** 幻椅式：膝弯曲90°，双臂上举 */
const utkatasana: StandardPoseData = {
  id: 'utkatasana',
  nameCN: '幻椅式',
  nameEN: 'Chair Pose',
  difficulty: 'beginner',
  landmarks: (() => {
    const lm = cloneLandmarks(STANDING_BASE)
    // 双膝弯曲
    lm[23] = { x: -0.1, y: 0.7, z: 0.1 }
    lm[24] = { x: 0.1, y: 0.7, z: 0.1 }
    lm[25] = { x: -0.15, y: 0.5, z: 0.15 }
    lm[26] = { x: 0.15, y: 0.5, z: 0.15 }
    // 双臂上举
    lm[11] = { x: -0.18, y: 1.35, z: 0 }
    lm[12] = { x: 0.18, y: 1.35, z: 0 }
    lm[13] = { x: -0.15, y: 1.55, z: 0 }
    lm[14] = { x: 0.15, y: 1.55, z: 0 }
    lm[15] = { x: -0.1, y: 1.7, z: 0 }
    lm[16] = { x: 0.1, y: 1.7, z: 0 }
    return lm
  })(),
  jointAngles: {
    left_knee: 95, right_knee: 95,
    left_hip: 95, right_hip: 95,
    left_shoulder: 170, right_shoulder: 170,
  },
}

/** 婴儿式：跪坐，身体前屈 */
const balasana: StandardPoseData = {
  id: 'balasana',
  nameCN: '婴儿式',
  nameEN: "Child's Pose",
  difficulty: 'beginner',
  landmarks: (() => {
    const lm = cloneLandmarks(STANDING_BASE)
    // 跪坐
    lm[23] = { x: -0.1, y: 0.5, z: -0.1 }
    lm[24] = { x: 0.1, y: 0.5, z: -0.1 }
    lm[25] = { x: -0.15, y: 0.35, z: 0.1 }
    lm[26] = { x: 0.15, y: 0.35, z: 0.1 }
    lm[27] = { x: -0.15, y: 0.2, z: -0.1 }
    lm[28] = { x: 0.15, y: 0.2, z: -0.1 }
    // 身体前屈
    lm[11] = { x: -0.15, y: 0.6, z: 0.2 }
    lm[12] = { x: 0.15, y: 0.6, z: 0.2 }
    lm[0] = { x: 0, y: 0.4, z: 0.4 }      // 头触地
    // 手臂前伸
    lm[13] = { x: -0.2, y: 0.5, z: 0.5 }
    lm[15] = { x: -0.2, y: 0.4, z: 0.8 }
    lm[14] = { x: 0.2, y: 0.5, z: 0.5 }
    lm[16] = { x: 0.2, y: 0.4, z: 0.8 }
    return lm
  })(),
  jointAngles: {
    left_knee: 90, right_knee: 90,
    left_hip: 45, right_hip: 45,
    left_shoulder: 160, right_shoulder: 160,
  },
}

/** 眼镜蛇式：俯卧后弯，腿贴地 */
const bhujangasana: StandardPoseData = {
  id: 'bhujangasana',
  nameCN: '眼镜蛇式',
  nameEN: 'Cobra Pose',
  difficulty: 'beginner',
  landmarks: (() => {
    const lm = cloneLandmarks(STANDING_BASE)
    // 俯卧，腿贴地
    lm[23] = { x: -0.1, y: 0.15, z: -0.1 }
    lm[24] = { x: 0.1, y: 0.15, z: -0.1 }
    lm[25] = { x: -0.1, y: 0.1, z: -0.3 }
    lm[26] = { x: 0.1, y: 0.1, z: -0.3 }
    lm[27] = { x: -0.1, y: 0.05, z: -0.5 }
    lm[28] = { x: 0.1, y: 0.05, z: -0.5 }
    // 上身后弯
    lm[11] = { x: -0.2, y: 0.5, z: 0.1 }
    lm[12] = { x: 0.2, y: 0.5, z: 0.1 }
    lm[0] = { x: 0, y: 0.7, z: 0.15 }     // 头抬起
    // 手臂支撑
    lm[13] = { x: -0.25, y: 0.4, z: 0.15 }
    lm[14] = { x: 0.25, y: 0.4, z: 0.15 }
    lm[15] = { x: -0.25, y: 0.3, z: 0.1 }
    lm[16] = { x: 0.25, y: 0.3, z: 0.1 }
    return lm
  })(),
  jointAngles: {
    left_knee: 175, right_knee: 175,
    left_hip: 160, right_hip: 160,
    left_shoulder: 100, right_shoulder: 100,
    left_elbow: 150, right_elbow: 150,
  },
}

/** 船式：V形坐姿，腿抬起 */
const navasana: StandardPoseData = {
  id: 'navasana',
  nameCN: '船式',
  nameEN: 'Boat Pose',
  difficulty: 'intermediate',
  landmarks: (() => {
    const lm = cloneLandmarks(STANDING_BASE)
    // 坐姿，腿抬起
    lm[23] = { x: -0.1, y: 0.5, z: 0 }
    lm[24] = { x: 0.1, y: 0.5, z: 0 }
    lm[25] = { x: -0.15, y: 0.6, z: 0.3 }
    lm[26] = { x: 0.15, y: 0.6, z: 0.3 }
    lm[27] = { x: -0.2, y: 0.7, z: 0.5 }
    lm[28] = { x: 0.2, y: 0.7, z: 0.5 }
    // 身体后倾
    lm[11] = { x: -0.18, y: 0.7, z: -0.1 }
    lm[12] = { x: 0.18, y: 0.7, z: -0.1 }
    lm[0] = { x: 0, y: 0.9, z: -0.1 }
    // 手臂前伸
    lm[13] = { x: -0.2, y: 0.7, z: 0.2 }
    lm[15] = { x: -0.2, y: 0.7, z: 0.4 }
    lm[14] = { x: 0.2, y: 0.7, z: 0.2 }
    lm[16] = { x: 0.2, y: 0.7, z: 0.4 }
    return lm
  })(),
  jointAngles: {
    left_knee: 175, right_knee: 175,
    left_hip: 50, right_hip: 50,
    left_shoulder: 60, right_shoulder: 60,
  },
}

/** 挺尸式：仰卧完全放松 */
const savasana: StandardPoseData = {
  id: 'savasana',
  nameCN: '挺尸式',
  nameEN: 'Corpse Pose',
  difficulty: 'beginner',
  landmarks: (() => {
    const lm = cloneLandmarks(STANDING_BASE)
    // 仰卧
    lm[0] = { x: 0, y: 0.15, z: -0.1 }
    lm[11] = { x: -0.2, y: 0.15, z: 0 }
    lm[12] = { x: 0.2, y: 0.15, z: 0 }
    lm[23] = { x: -0.1, y: 0.15, z: 0 }
    lm[24] = { x: 0.1, y: 0.15, z: 0 }
    // 手臂自然放两侧
    lm[13] = { x: -0.3, y: 0.15, z: 0 }
    lm[15] = { x: -0.4, y: 0.12, z: 0 }
    lm[14] = { x: 0.3, y: 0.15, z: 0 }
    lm[16] = { x: 0.4, y: 0.12, z: 0 }
    // 腿伸直
    lm[25] = { x: -0.1, y: 0.12, z: 0.3 }
    lm[26] = { x: 0.1, y: 0.12, z: 0.3 }
    lm[27] = { x: -0.1, y: 0.1, z: 0.6 }
    lm[28] = { x: 0.1, y: 0.1, z: 0.6 }
    return lm
  })(),
  jointAngles: {
    left_knee: 175, right_knee: 175,
    left_hip: 175, right_hip: 175,
    left_shoulder: 175, right_shoulder: 175,
  },
}

// ============================================================
// 新增体式（来自 Hello Yogis 瑜珈動作大全）
// ============================================================

/** 战士一式：前腿弓步，双臂上举 */
const virabhadrasana_i: StandardPoseData = {
  id: 'virabhadrasana_i',
  nameCN: '战士一式',
  nameEN: 'Warrior I',
  difficulty: 'intermediate',
  landmarks: (() => {
    const lm = cloneLandmarks(STANDING_BASE)
    lm[23] = { x: -0.15, y: 0.65, z: 0.1 }
    lm[24] = { x: 0.15, y: 0.65, z: -0.1 }
    lm[25] = { x: -0.2, y: 0.5, z: 0.15 }
    lm[26] = { x: 0.15, y: 0.45, z: -0.2 }
    lm[27] = { x: -0.2, y: 0.05, z: 0.1 }
    lm[28] = { x: 0.15, y: 0.05, z: -0.3 }
    lm[13] = { x: -0.1, y: 1.5, z: 0 }
    lm[15] = { x: -0.08, y: 1.7, z: 0 }
    lm[14] = { x: 0.1, y: 1.5, z: 0 }
    lm[16] = { x: 0.08, y: 1.7, z: 0 }
    return lm
  })(),
  jointAngles: {
    left_knee: 90, right_knee: 175,
    left_hip: 95, right_hip: 160,
    left_shoulder: 175, right_shoulder: 175,
  },
}

/** 战士三式：单腿站立，身体和腿呈T形 */
const virabhadrasana_iii: StandardPoseData = {
  id: 'virabhadrasana_iii',
  nameCN: '战士三式',
  nameEN: 'Warrior III',
  difficulty: 'advanced',
  landmarks: (() => {
    const lm = cloneLandmarks(STANDING_BASE)
    lm[23] = { x: -0.1, y: 0.7, z: 0 }
    lm[24] = { x: 0.1, y: 0.7, z: 0 }
    lm[25] = { x: -0.1, y: 0.45, z: 0 }
    lm[26] = { x: 0.3, y: 0.75, z: -0.2 }
    lm[27] = { x: -0.1, y: 0.05, z: 0 }
    lm[28] = { x: 0.5, y: 0.8, z: -0.3 }
    lm[11] = { x: -0.2, y: 1.2, z: 0.2 }
    lm[12] = { x: 0.2, y: 1.2, z: 0.2 }
    lm[13] = { x: -0.2, y: 1.1, z: 0.4 }
    lm[15] = { x: -0.2, y: 1.0, z: 0.6 }
    lm[14] = { x: 0.2, y: 1.1, z: 0.4 }
    lm[16] = { x: 0.2, y: 1.0, z: 0.6 }
    lm[0] = { x: 0, y: 1.1, z: 0.2 }
    return lm
  })(),
  jointAngles: {
    left_knee: 175, right_knee: 175,
    left_hip: 170, right_hip: 170,
    left_shoulder: 170, right_shoulder: 170,
  },
}

/** 桥式：仰卧，臀部抬起 */
const setu_bandhasana: StandardPoseData = {
  id: 'setu_bandhasana',
  nameCN: '桥式',
  nameEN: 'Bridge Pose',
  difficulty: 'beginner',
  landmarks: (() => {
    const lm = cloneLandmarks(STANDING_BASE)
    lm[0] = { x: 0, y: 0.2, z: -0.15 }
    lm[11] = { x: -0.2, y: 0.2, z: 0 }
    lm[12] = { x: 0.2, y: 0.2, z: 0 }
    lm[23] = { x: -0.1, y: 0.5, z: 0 }
    lm[24] = { x: 0.1, y: 0.5, z: 0 }
    lm[25] = { x: -0.2, y: 0.35, z: 0.2 }
    lm[26] = { x: 0.2, y: 0.35, z: 0.2 }
    lm[27] = { x: -0.2, y: 0.1, z: 0.3 }
    lm[28] = { x: 0.2, y: 0.1, z: 0.3 }
    lm[13] = { x: -0.25, y: 0.15, z: 0 }
    lm[15] = { x: -0.15, y: 0.15, z: 0.1 }
    lm[14] = { x: 0.25, y: 0.15, z: 0 }
    lm[16] = { x: 0.15, y: 0.15, z: 0.1 }
    return lm
  })(),
  jointAngles: {
    left_knee: 100, right_knee: 100,
    left_hip: 120, right_hip: 120,
    left_shoulder: 170, right_shoulder: 170,
  },
}

/** 骆驼式：跪立，身体后弯 */
const ustrasana: StandardPoseData = {
  id: 'ustrasana',
  nameCN: '骆驼式',
  nameEN: 'Camel Pose',
  difficulty: 'beginner',
  landmarks: (() => {
    const lm = cloneLandmarks(STANDING_BASE)
    lm[0] = { x: 0, y: 1.3, z: -0.2 }
    lm[11] = { x: -0.2, y: 1.1, z: -0.1 }
    lm[12] = { x: 0.2, y: 1.1, z: -0.1 }
    lm[23] = { x: -0.1, y: 0.6, z: 0 }
    lm[24] = { x: 0.1, y: 0.6, z: 0 }
    lm[25] = { x: -0.15, y: 0.4, z: 0.1 }
    lm[26] = { x: 0.15, y: 0.4, z: 0.1 }
    lm[27] = { x: -0.15, y: 0.15, z: 0 }
    lm[28] = { x: 0.15, y: 0.15, z: 0 }
    lm[13] = { x: -0.2, y: 0.5, z: 0.1 }
    lm[15] = { x: -0.2, y: 0.5, z: 0.15 }
    lm[14] = { x: 0.2, y: 0.5, z: 0.1 }
    lm[16] = { x: 0.2, y: 0.5, z: 0.15 }
    return lm
  })(),
  jointAngles: {
    left_knee: 100, right_knee: 100,
    left_hip: 150, right_hip: 150,
    left_shoulder: 130, right_shoulder: 130,
  },
}

/** 侧角伸展式：侧弓步，手臂伸展 */
const utthita_parsvakonasana: StandardPoseData = {
  id: 'utthita_parsvakonasana',
  nameCN: '侧角伸展式',
  nameEN: 'Extended Side Angle',
  difficulty: 'intermediate',
  landmarks: (() => {
    const lm = cloneLandmarks(STANDING_BASE)
    lm[23] = { x: -0.2, y: 0.6, z: 0.1 }
    lm[24] = { x: 0.2, y: 0.8, z: -0.1 }
    lm[25] = { x: -0.25, y: 0.5, z: 0.15 }
    lm[26] = { x: 0.2, y: 0.45, z: -0.1 }
    lm[11] = { x: -0.15, y: 1.0, z: 0 }
    lm[12] = { x: 0.2, y: 1.1, z: 0 }
    lm[13] = { x: -0.2, y: 0.7, z: 0.1 }
    lm[15] = { x: -0.15, y: 0.5, z: 0.15 }
    lm[14] = { x: 0.3, y: 1.3, z: -0.1 }
    lm[16] = { x: 0.5, y: 1.5, z: -0.15 }
    lm[0] = { x: 0, y: 1.1, z: 0 }
    return lm
  })(),
  jointAngles: {
    left_knee: 90, right_knee: 175,
    left_hip: 95, right_hip: 140,
    left_shoulder: 120, right_shoulder: 40,
  },
}

/** 平板式：俯卧撑位置 */
const plank: StandardPoseData = {
  id: 'plank',
  nameCN: '平板式',
  nameEN: 'Plank Pose',
  difficulty: 'intermediate',
  landmarks: (() => {
    const lm = cloneLandmarks(STANDING_BASE)
    lm[0] = { x: 0, y: 0.8, z: 0.3 }
    lm[11] = { x: -0.2, y: 0.8, z: 0.3 }
    lm[12] = { x: 0.2, y: 0.8, z: 0.3 }
    lm[23] = { x: -0.1, y: 0.75, z: -0.1 }
    lm[24] = { x: 0.1, y: 0.75, z: -0.1 }
    lm[25] = { x: -0.1, y: 0.7, z: -0.3 }
    lm[26] = { x: 0.1, y: 0.7, z: -0.3 }
    lm[27] = { x: -0.1, y: 0.65, z: -0.5 }
    lm[28] = { x: 0.1, y: 0.65, z: -0.5 }
    lm[13] = { x: -0.2, y: 0.7, z: 0.35 }
    lm[15] = { x: -0.2, y: 0.65, z: 0.4 }
    lm[14] = { x: 0.2, y: 0.7, z: 0.35 }
    lm[16] = { x: 0.2, y: 0.65, z: 0.4 }
    return lm
  })(),
  jointAngles: {
    left_knee: 175, right_knee: 175,
    left_hip: 170, right_hip: 170,
    left_shoulder: 170, right_shoulder: 170,
    left_elbow: 175, right_elbow: 175,
  },
}

/** 舞王式：单腿站立，后腿弯曲向后 */
const natarajasana: StandardPoseData = {
  id: 'natarajasana',
  nameCN: '舞王式',
  nameEN: 'Dancer Pose',
  difficulty: 'advanced',
  landmarks: (() => {
    const lm = cloneLandmarks(STANDING_BASE)
    lm[23] = { x: -0.1, y: 0.7, z: 0 }
    lm[24] = { x: 0.1, y: 0.7, z: 0 }
    lm[25] = { x: -0.1, y: 0.45, z: 0 }
    lm[26] = { x: 0.15, y: 0.7, z: -0.2 }
    lm[27] = { x: -0.1, y: 0.05, z: 0 }
    lm[28] = { x: 0.2, y: 0.8, z: -0.3 }
    lm[11] = { x: -0.2, y: 1.2, z: 0 }
    lm[12] = { x: 0.2, y: 1.3, z: 0 }
    lm[13] = { x: -0.2, y: 1.4, z: 0 }
    lm[15] = { x: -0.2, y: 1.6, z: 0 }
    lm[14] = { x: 0.2, y: 1.2, z: -0.1 }
    lm[16] = { x: 0.2, y: 0.8, z: -0.25 }
    return lm
  })(),
  jointAngles: {
    left_knee: 175, right_knee: 90,
    left_hip: 175, right_hip: 130,
    left_shoulder: 170, right_shoulder: 150,
  },
}

/** 鳄鱼式：低位俯卧撑 */
const chaturanga: StandardPoseData = {
  id: 'chaturanga',
  nameCN: '鳄鱼式',
  nameEN: 'Chaturanga',
  difficulty: 'advanced',
  landmarks: (() => {
    const lm = cloneLandmarks(STANDING_BASE)
    lm[0] = { x: 0, y: 0.5, z: 0.3 }
    lm[11] = { x: -0.2, y: 0.5, z: 0.3 }
    lm[12] = { x: 0.2, y: 0.5, z: 0.3 }
    lm[23] = { x: -0.1, y: 0.45, z: -0.1 }
    lm[24] = { x: 0.1, y: 0.45, z: -0.1 }
    lm[25] = { x: -0.1, y: 0.4, z: -0.3 }
    lm[26] = { x: 0.1, y: 0.4, z: -0.3 }
    lm[27] = { x: -0.1, y: 0.35, z: -0.5 }
    lm[28] = { x: 0.1, y: 0.35, z: -0.5 }
    lm[13] = { x: -0.2, y: 0.4, z: 0.3 }
    lm[15] = { x: -0.2, y: 0.35, z: 0.3 }
    lm[14] = { x: 0.2, y: 0.4, z: 0.3 }
    lm[16] = { x: 0.2, y: 0.35, z: 0.3 }
    return lm
  })(),
  jointAngles: {
    left_knee: 175, right_knee: 175,
    left_hip: 175, right_hip: 175,
    left_shoulder: 100, right_shoulder: 100,
    left_elbow: 100, right_elbow: 100,
  },
}

// ============================================================

/** 所有标准体式 */
export const STANDARD_POSE_DATABASE: StandardPoseData[] = [
  tadasana,
  virabhadrasana_i,
  virabhadrasana_ii,
  virabhadrasana_iii,
  trikonasana,
  utthita_parsvakonasana,
  adho_mukha_svanasana,
  vrksasana,
  utkatasana,
  setu_bandhasana,
  ustrasana,
  plank,
  natarajasana,
  chaturanga,
  balasana,
  bhujangasana,
  navasana,
  savasana,
]

/** 根据ID获取标准体式 */
export function getStandardPoseData(id: string): StandardPoseData | undefined {
  return STANDARD_POSE_DATABASE.find(p => p.id === id)
}

/**
 * 坐标归一化：将原始landmarks转换为标准坐标系
 * - 原点：髋部中心
 * - 单位：肩宽
 * - y轴向上
 */
export function normalizeLandmarks(
  landmarks: Array<{ x: number; y: number; z: number }>
): Array<{ x: number; y: number; z: number }> {
  if (landmarks.length < 33) return landmarks

  // 计算髋部中心
  const hipCenter = {
    x: (landmarks[23].x + landmarks[24].x) / 2,
    y: (landmarks[23].y + landmarks[24].y) / 2,
    z: (landmarks[23].z + landmarks[24].z) / 2,
  }

  // 计算肩宽
  const shoulderWidth = Math.sqrt(
    (landmarks[11].x - landmarks[12].x) ** 2 +
    (landmarks[11].y - landmarks[12].y) ** 2 +
    (landmarks[11].z - landmarks[12].z) ** 2
  )

  if (shoulderWidth < 0.001) return landmarks

  // 归一化
  return landmarks.map(lm => ({
    x: (lm.x - hipCenter.x) / shoulderWidth,
    y: (lm.y - hipCenter.y) / shoulderWidth,  // 注意：MediaPipe y向下，这里保持原样
    z: (lm.z - hipCenter.z) / shoulderWidth,
  }))
}

/**
 * 计算两个体式之间的位置距离
 * 值越小越相似
 */
export function calculatePoseDistance(
  pose1: Array<{ x: number; y: number; z: number }>,
  pose2: Array<{ x: number; y: number; z: number }>
): number {
  // 使用主要关节计算距离（加权）
  const keyJoints = [
    { idx: 11, weight: 1.5 },  // 左肩
    { idx: 12, weight: 1.5 },  // 右肩
    { idx: 13, weight: 1.2 },  // 左肘
    { idx: 14, weight: 1.2 },  // 右肘
    { idx: 15, weight: 1.0 },  // 左腕
    { idx: 16, weight: 1.0 },  // 右腕
    { idx: 23, weight: 1.5 },  // 左髋
    { idx: 24, weight: 1.5 },  // 右髋
    { idx: 25, weight: 1.3 },  // 左膝
    { idx: 26, weight: 1.3 },  // 右膝
    { idx: 27, weight: 1.0 },  // 左踝
    { idx: 28, weight: 1.0 },  // 右踝
  ]

  let totalDist = 0
  let totalWeight = 0

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

// ============================================================
// 向后兼容的导出 (供旧代码使用)
// ============================================================

import type { StandardPose, JointAngle } from '@/types/pose'

/** 标准体式列表 (旧格式) */
export const STANDARD_POSES: StandardPose[] = STANDARD_POSE_DATABASE.map(p => ({
  id: p.id,
  nameCN: p.nameCN,
  nameEN: p.nameEN,
  nameSanskrit: p.id,
  difficulty: p.difficulty,
  category: '',
  description: '',
  benefits: [],
  targetAngles: Object.entries(p.jointAngles).map(([joint, angle]) => ({
    joint,
    angle,
    axis: 'flexion' as const,
  })),
  tolerance: 20,
  keyPoints: [],
  commonMistakes: [],
}))

/** 根据ID获取标准体式 (旧格式) */
export function getStandardPose(id: string): StandardPose | undefined {
  return STANDARD_POSES.find(p => p.id === id)
}
