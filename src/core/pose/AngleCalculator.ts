import type { PoseLandmark, JointAngle } from '@/types/pose'
import { angleBetweenThreePoints, type Vec3 } from '@/utils/math'

function lmToVec(lm: PoseLandmark): Vec3 {
  return { x: lm.x, y: lm.y, z: lm.z }
}

export class AngleCalculator {
  /** 计算所有关键关节角度 */
  static calculateAllAngles(landmarks: PoseLandmark[]): JointAngle[] {
    return [
      // 左肘弯曲角
      {
        joint: 'left_elbow',
        angle: angleBetweenThreePoints(
          lmToVec(landmarks[11]),
          lmToVec(landmarks[13]),
          lmToVec(landmarks[15])
        ),
        axis: 'flexion',
      },
      // 右肘弯曲角
      {
        joint: 'right_elbow',
        angle: angleBetweenThreePoints(
          lmToVec(landmarks[12]),
          lmToVec(landmarks[14]),
          lmToVec(landmarks[16])
        ),
        axis: 'flexion',
      },
      // 左膝弯曲角
      {
        joint: 'left_knee',
        angle: angleBetweenThreePoints(
          lmToVec(landmarks[23]),
          lmToVec(landmarks[25]),
          lmToVec(landmarks[27])
        ),
        axis: 'flexion',
      },
      // 右膝弯曲角
      {
        joint: 'right_knee',
        angle: angleBetweenThreePoints(
          lmToVec(landmarks[24]),
          lmToVec(landmarks[26]),
          lmToVec(landmarks[28])
        ),
        axis: 'flexion',
      },
      // 左髋弯曲角
      {
        joint: 'left_hip',
        angle: angleBetweenThreePoints(
          lmToVec(landmarks[11]),
          lmToVec(landmarks[23]),
          lmToVec(landmarks[25])
        ),
        axis: 'flexion',
      },
      // 右髋弯曲角
      {
        joint: 'right_hip',
        angle: angleBetweenThreePoints(
          lmToVec(landmarks[12]),
          lmToVec(landmarks[24]),
          lmToVec(landmarks[26])
        ),
        axis: 'flexion',
      },
      // 左肩外展角
      {
        joint: 'left_shoulder',
        angle: angleBetweenThreePoints(
          lmToVec(landmarks[23]),
          lmToVec(landmarks[11]),
          lmToVec(landmarks[13])
        ),
        axis: 'abduction',
      },
      // 右肩外展角
      {
        joint: 'right_shoulder',
        angle: angleBetweenThreePoints(
          lmToVec(landmarks[24]),
          lmToVec(landmarks[12]),
          lmToVec(landmarks[14])
        ),
        axis: 'abduction',
      },
    ]
  }
}
