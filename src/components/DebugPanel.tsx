import React from 'react'

interface DebugPanelProps {
  visible: boolean
  data: {
    hipCenter: { x: number; y: number; z: number }
    shoulderCenter: { x: number; y: number; z: number }
    meshPosition: { x: number; y: number; z: number }
    meshScale: number
    torsoLength: number
    frameCount: number
  }
}

export const DebugPanel: React.FC<DebugPanelProps> = ({ visible, data }) => {
  if (!visible) return null

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>调试信息</h3>
      <div style={styles.section}>
        <div style={styles.label}>髋部中心:</div>
        <div style={styles.value}>
          x: {data.hipCenter.x.toFixed(3)}, 
          y: {data.hipCenter.y.toFixed(3)}, 
          z: {data.hipCenter.z.toFixed(3)}
        </div>
      </div>
      <div style={styles.section}>
        <div style={styles.label}>肩膀中心:</div>
        <div style={styles.value}>
          x: {data.shoulderCenter.x.toFixed(3)}, 
          y: {data.shoulderCenter.y.toFixed(3)}, 
          z: {data.shoulderCenter.z.toFixed(3)}
        </div>
      </div>
      <div style={styles.section}>
        <div style={styles.label}>网格位置:</div>
        <div style={styles.value}>
          x: {data.meshPosition.x.toFixed(3)}, 
          y: {data.meshPosition.y.toFixed(3)}, 
          z: {data.meshPosition.z.toFixed(3)}
        </div>
      </div>
      <div style={styles.section}>
        <div style={styles.label}>缩放比例:</div>
        <div style={{...styles.value, color: data.meshScale > 5 ? '#ff4d4f' : '#52c41a'}}>
          {data.meshScale.toFixed(3)}
        </div>
      </div>
      <div style={styles.section}>
        <div style={styles.label}>躯干长度:</div>
        <div style={styles.value}>{data.torsoLength.toFixed(3)}</div>
      </div>
      <div style={styles.section}>
        <div style={styles.label}>帧数:</div>
        <div style={styles.value}>{data.frameCount}</div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    top: 8,
    left: 8,
    padding: '8px 12px',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: 6,
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#0f0',
    minWidth: 200,
    zIndex: 100,
  },
  title: {
    fontSize: 12,
    fontWeight: 600,
    color: '#fff',
    marginBottom: 6,
    marginTop: 0,
  },
  section: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  label: {
    color: '#888',
  },
  value: {
    color: '#0f0',
  },
}
