import React from 'react'
import type { ScoreResult } from '@/core/scoring/PoseScorer'
import { PoseScorer } from '@/core/scoring/PoseScorer'

interface ScorePanelProps {
  scoreResult: ScoreResult | null
  visible: boolean
}

export const ScorePanel: React.FC<ScorePanelProps> = ({ scoreResult, visible }) => {
  if (!visible || !scoreResult) return null

  const { percentage, level, jointScores, totalScore, maxScore } = scoreResult
  const levelName = PoseScorer.getLevelNameCN(level)
  const levelColor = PoseScorer.getLevelColor(level)

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'perfect': return '#52C41A'
      case 'good': return '#8BC34A'
      case 'warning': return '#F5A623'
      case 'bad': return '#FF4D4F'
      default: return '#999'
    }
  }

  // 获取状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'perfect': return '✓✓'
      case 'good': return '✓'
      case 'warning': return '△'
      case 'bad': return '✗'
      default: return '-'
    }
  }

  return (
    <div style={styles.container}>
      {/* 总分 */}
      <div style={styles.totalScore}>
        <div style={{...styles.scoreNumber, color: levelColor}}>
          {Math.round(percentage)}
        </div>
        <div style={styles.scoreLabel}>
          <span style={{color: levelColor}}>{levelName}</span>
        </div>
      </div>

      {/* 进度条 */}
      <div style={styles.progressBar}>
        <div 
          style={{
            ...styles.progressFill,
            width: `${percentage}%`,
            backgroundColor: levelColor,
          }}
        />
      </div>

      {/* 关节评分列表 */}
      <div style={styles.jointList}>
        {jointScores.slice(0, 6).map((joint) => (
          <div key={joint.joint} style={styles.jointItem}>
            <span style={styles.jointName}>{joint.jointCN}</span>
            <span style={{...styles.jointStatus, color: getStatusColor(joint.status)}}>
              {getStatusIcon(joint.status)}
            </span>
            <span style={styles.jointAngle}>
              {joint.currentAngle}°→{joint.targetAngle}°
            </span>
            <span style={{...styles.jointScore, color: getStatusColor(joint.status)}}>
              {joint.percentage}%
            </span>
          </div>
        ))}
      </div>

      {/* 最需改进 */}
      {jointScores.length > 0 && (
        <div style={styles.feedback}>
          <span style={styles.feedbackIcon}>!</span>
          {jointScores.find(j => j.status === 'bad')?.feedback || 
           jointScores.find(j => j.status === 'warning')?.feedback || '继续保持'}
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    padding: '10px 14px',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: 8,
    minWidth: 200,
    zIndex: 100,
  },
  totalScore: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 8,
  },
  scoreNumber: {
    fontSize: 32,
    fontWeight: 700,
    lineHeight: 1,
  },
  scoreLabel: {
    fontSize: 14,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    transition: 'width 0.3s ease',
  },
  jointList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  jointItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 11,
  },
  jointName: {
    width: 50,
    color: '#ccc',
  },
  jointStatus: {
    width: 16,
    textAlign: 'center',
    fontWeight: 600,
  },
  jointAngle: {
    flex: 1,
    color: '#888',
    fontFamily: 'monospace',
  },
  jointScore: {
    width: 35,
    textAlign: 'right',
    fontWeight: 500,
  },
  feedback: {
    marginTop: 8,
    padding: '6px 8px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 4,
    fontSize: 11,
    color: '#F5A623',
  },
  feedbackIcon: {
    marginRight: 4,
  },
}
