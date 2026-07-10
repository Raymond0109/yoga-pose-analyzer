import type { ComparisonResult, CorrectionAdvice, PoseDifference } from '@/types/pose'

export class CorrectionEngine {
  generateAdvice(result: ComparisonResult): CorrectionAdvice[] {
    const advices: CorrectionAdvice[] = []

    // 按差异严重程度排序
    const sorted = [...result.differences].sort((a, b) => b.delta - a.delta)

    for (const diff of sorted) {
      if (diff.severity === 'good') continue

      const priority = diff.severity === 'bad' ? 'high' : 'medium'

      advices.push({
        id: `fix_${diff.joint}_${Date.now()}`,
        joint: diff.joint,
        priority,
        title: this.getTitle(diff),
        description: this.getDescription(diff),
        action: this.getAction(diff),
        icon: this.getIcon(diff),
      })
    }

    // 低分通用建议
    if (result.overallScore < 60) {
      advices.push({
        id: 'general_low_score',
        joint: 'general',
        priority: 'low',
        title: '整体建议',
        description: '建议先练习基础体式，增强身体控制力',
        action: '每天练习山式 5 分钟，注意身体对齐',
        icon: 'info',
      })
    }

    return advices
  }

  private getTitle(diff: PoseDifference): string {
    const jointCN = this.getJointNameCN(diff.joint)
    const direction = diff.current > diff.target ? '过度' : '不足'
    return `${jointCN}${direction}弯曲`
  }

  private getDescription(diff: PoseDifference): string {
    const jointCN = this.getJointNameCN(diff.joint)
    return `${jointCN}当前角度 ${Math.round(diff.current)}°，目标角度 ${Math.round(diff.target)}°，偏差 ${Math.round(diff.delta)}°`
  }

  private getAction(diff: PoseDifference): string {
    const jointCN = this.getJointNameCN(diff.joint)
    if (diff.current > diff.target) {
      return `请伸展${jointCN}，减小弯曲角度约 ${Math.round(diff.delta - 5)}°`
    }
    return `请弯曲${jointCN}，增加弯曲角度约 ${Math.round(diff.delta - 5)}°`
  }

  private getIcon(diff: PoseDifference): string {
    if (diff.current > diff.target) return 'arrow-up'
    return 'arrow-down'
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
