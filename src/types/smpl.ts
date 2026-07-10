/** SMPL 模型参数 */
export interface SMPLParams {
  pose: Float32Array   // 72 维姿态参数 (24 关节 × 3)
  shape: Float32Array  // 10 维形状参数
}

/** SMPL 模型数据 (JSON 格式) */
export interface SMPLModelData {
  vertices_template: number[][]
  faces: number[][]
  joint_regressor: number[][]
  weights: number[][]
  posedirs: number[][][]
  shapedirs: number[][][]
  kintree_table: number[][]
  J: number[][]
  num_vertices: number
  num_joints: number
}

/** 肌肉群 */
export interface MuscleGroup {
  name: string
  nameCN: string
  vertices: number[]
  relatedJoints: string[]
}

/** 肌肉紧张度数据 */
export interface MuscleTensionData {
  muscle: string
  tension: number  // 0-1，0=松弛，1=紧张
}
