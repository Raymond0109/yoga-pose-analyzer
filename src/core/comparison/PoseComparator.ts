import type { PoseLandmark, JointAngle, StandardPose } from '@/types/pose'
import type { ComparisonResult, PoseDifference } from '@/types/pose'

export class PoseComparator {
  compare(currentAngles: JointAngle[], standardPose: StandardPose): ComparisonResult {
    const differences: PoseDifference[] = []
    let totalScore = 0

    for (const target of standardPose.targetAngles) {
      const current = currentAngles.find((a) => a.joint === target.joint)
      if (!current) continue

      const delta = current.angle - target.angle  // 有符号：正=需减小，负=需增大
      const absDelta = Math.abs(delta)
      const severity = this.getSeverity(absDelta, standardPose.tolerance)
      const suggestion = this.getSuggestion(target.joint, absDelta, current.angle, target.angle)

      differences.push({
        joint: target.joint,
        current: current.angle,
        target: target.angle,
        delta,  // 保留符号用于箭头方向
        severity,
        suggestion,
      })

      // 评分：absDelta 越小分越高
      totalScore += Math.max(0, 100 - absDelta * 2)
    }

    const overallScore =
      differences.length > 0 ? Math.round(totalScore / differences.length) : 0

    return {
      poseId: standardPose.id,
      overallScore,
      differences,
      timestamp: Date.now(),
    }
  }

  private getSeverity(delta: number, tolerance: number): 'good' | 'warning' | 'bad' {
    if (delta <= tolerance * 0.5) return 'good'
    if (delta <= tolerance) return 'warning'
    return 'bad'
  }

  private getSuggestion(
    joint: string,
    delta: number,
    current: number,
    target: number
  ): string {
    if (delta < 5) return '角度正确'

    const direction = current > target ? '减小' : '增大'
    const jointCN = this.getJointNameCN(joint)
    return `请${direction}${jointCN}角度，当前 ${Math.round(current)}°，目标 ${Math.round(target)}°`
  }

  private getJointNameCN(joint: string): string {
    const map: Record<string, string> = {
      left_elbow: '左肘',
      right_elbow: '右肘',
      left_knee: '左膝',
      right_knee: '右膝',
      left_hip: '左髋',
      right_hip: '右髋',
      left_shoulder: '左肩',
      right_shoulder: '右肩',
    }
    return map[joint] || joint
  }
}
