import React from 'react'
import type { MuscleTensionData } from '@/types/smpl'
import { MuscleMapper } from '@/core/smpl/MuscleMapper'

interface MusclePanelProps {
  tensions: MuscleTensionData[]
  visible: boolean
}

export const MusclePanel: React.FC<MusclePanelProps> = ({ tensions, visible }) => {
  if (!visible || tensions.length === 0) return null

  const mapper = new MuscleMapper()

  // 按分类分组
  const grouped = new Map<string, MuscleTensionData[]>()
  tensions.forEach((t) => {
    const category = mapper.getMuscleCategory(t.muscle)
    if (!grouped.has(category)) grouped.set(category, [])
    grouped.get(category)!.push(t)
  })

  const categoryNames: Record<string, string> = {
    leg: '腿部',
    hip: '髋部',
    arm: '手臂',
    shoulder: '肩部',
    core: '核心',
    back: '背部',
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>肌肉紧张度</h3>
      {Array.from(grouped.entries()).map(([category, muscles]) => (
        <div key={category} style={styles.category}>
          <div style={styles.categoryName}>{categoryNames[category] || category}</div>
          {muscles.map((m) => {
            const { level, color } = MuscleMapper.tensionLevel(m.tension)
            return (
              <div key={m.muscle} style={styles.muscleRow}>
                <span style={styles.muscleName}>{mapper.getMuscleNameCN(m.muscle)}</span>
                <div style={styles.barContainer}>
                  <div
                    style={{
                      ...styles.bar,
                      width: `${m.tension * 100}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
                <span style={{ ...styles.level, color }}>{level}</span>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '8px 12px',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 8,
    maxHeight: 300,
    overflow: 'auto',
  },
  title: {
    fontSize: 14,
    fontWeight: 600,
    color: '#fff',
    marginBottom: 8,
    marginTop: 0,
  },
  category: {
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 11,
    color: '#888',
    marginBottom: 4,
    fontWeight: 500,
  },
  muscleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  muscleName: {
    fontSize: 12,
    color: '#ccc',
    width: 80,
    flexShrink: 0,
  },
  barContainer: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 4,
    transition: 'width 0.2s ease',
  },
  level: {
    fontSize: 11,
    width: 30,
    textAlign: 'right',
    fontWeight: 500,
  },
}
