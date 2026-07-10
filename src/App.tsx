import React, { useEffect, useRef, useCallback, useState } from 'react'
import { MediaPipePose } from '@/core/pose/MediaPipePose'
import { InputManager } from '@/core/input/InputManager'
import { AngleCalculator } from '@/core/pose/AngleCalculator'
import { PoseClassifier, type ClassificationResult } from '@/core/pose/PoseClassifier'
import { PoseComparator } from '@/core/comparison/PoseComparator'
import { CorrectionEngine } from '@/core/comparison/CorrectionEngine'
import { getStandardPose, STANDARD_POSES } from '@/core/comparison/StandardPoseDB'
import { MuscleMapper } from '@/core/smpl/MuscleMapper'
import { useAppStore } from '@/store/appStore'
import type { InputSourceType } from '@/types/common'

// 全局单例
let poseEstimator: MediaPipePose | null = null
let inputManager: InputManager | null = null
let poseClassifier: PoseClassifier | null = null
let muscleMapper: MuscleMapper | null = null

function getMuscleMapper(): MuscleMapper {
  if (!muscleMapper) muscleMapper = new MuscleMapper()
  return muscleMapper
}

function getClassifier(): PoseClassifier {
  if (!poseClassifier) poseClassifier = new PoseClassifier()
  return poseClassifier
}

async function getPoseEstimator(): Promise<MediaPipePose> {
  if (!poseEstimator) {
    poseEstimator = new MediaPipePose()
    await poseEstimator.initialize()
  }
  return poseEstimator
}

function getInputManager(): InputManager {
  if (!inputManager) {
    inputManager = new InputManager()
  }
  return inputManager
}

export function App() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const threeContainerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<any>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  const {
    inputType,
    selectedPose,
    setCurrentPose,
    setComparisonResult,
    setCorrections,
  } = useAppStore()

  const [status, setStatus] = useState<string>('正在初始化...')
  const [score, setScore] = useState<number>(0)
  const [confidence, setConfidence] = useState<number>(0)
  const [smootherState, setSmootherState] = useState<'tracking' | 'locked'>('tracking')
  const [detectedPose, setDetectedPose] = useState<ClassificationResult | null>(null)
  const [autoDetect, setAutoDetect] = useState<boolean>(false)
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([])
  const [currentFileName, setCurrentFileName] = useState<string>('')
  const [videoAspect, setVideoAspect] = useState<number>(16 / 9)
  // 平滑强度 0-4: 0=无, 1=轻, 2=中, 3=强, 4=极强
  const [smoothLevel, setSmoothLevel] = useState<number>(2)
  const [showMuscles, setShowMuscles] = useState<boolean>(false)
  // 性能优化：帧处理节流
  const lastProcessTime = useRef<number>(0)
  const PROCESS_INTERVAL = 33 // ~30fps

  // 初始化
  useEffect(() => {
    const init = async () => {
      try {
        setStatus('正在加载 MediaPipe 模型...')
        await getPoseEstimator()

        // 获取摄像头列表
        const devices = await InputManager.getCameraDevices()
        setCameraDevices(devices)

        setStatus('就绪 - 请启动摄像头')
      } catch (err) {
        console.error('初始化失败:', err)
        setStatus('初始化失败: ' + (err as Error).message)
      }
    }
    init()

    return () => {
      poseEstimator?.dispose()
      inputManager?.stop()
    }
  }, [])

  // 初始化 3D 渲染器
  useEffect(() => {
    if (!threeContainerRef.current) return
    import('@/core/smpl/SMPLRenderer').then(({ SMPLRenderer }) => {
      rendererRef.current = new SMPLRenderer(threeContainerRef.current!)
    })

    return () => {
      rendererRef.current?.dispose()
    }
  }, [])

  // 肌肉显示切换
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.setShowMuscles(showMuscles)
    }
  }, [showMuscles])

  // 平滑强度变化时更新滤波器参数
  useEffect(() => {
    if (poseEstimator) {
      poseEstimator.setSmoothLevel(smoothLevel)
    }
  }, [smoothLevel])

  // 启动摄像头
  const startCamera = useCallback(async (deviceId?: string) => {
    try {
      const manager = getInputManager()
      await manager.switchSource({
        type: 'camera',
        cameraId: deviceId,
        resolution: { width: 1280, height: 720 },
      })

      // 显示视频元素
      if (videoRef.current) {
        videoRef.current.style.display = 'block'
      }

      // 获取视频元素用于 UI 显示
      const video = manager.getVideoElement()
      if (video && videoRef.current) {
        videoRef.current.srcObject = video.srcObject
        videoRef.current.src = ''
        await videoRef.current.play()

        // 更新宽高比
        const w = videoRef.current.videoWidth
        const h = videoRef.current.videoHeight
        if (w > 0 && h > 0) {
          setVideoAspect(w / h)
        }
      }

      // 注册帧回调 (带节流)
      manager.onFrame(async (frame) => {
        const now = performance.now()
        if (now - lastProcessTime.current < PROCESS_INTERVAL) return
        lastProcessTime.current = now

        const estimator = await getPoseEstimator()
        const result = estimator.estimate(frame.imageData as any, frame.timestamp)

        if (result) {
          setCurrentPose(result)
          setConfidence(result.confidence ?? 0.5)
          setSmootherState(estimator.getState())

          // 更新 3D 渲染
          rendererRef.current?.updatePose(result.landmarks)

          // 计算角度和对比
          const angles = AngleCalculator.calculateAllAngles(result.landmarks)

          // 自动识别体式
          let activePoseId = selectedPose
          if (autoDetect) {
            const classifier = getClassifier()
            const classification = classifier.classify(angles)
            setDetectedPose(classification)
            if (classification && classification.confidence > 0.6) {
              activePoseId = classification.poseId
            }
          }

          const standard = getStandardPose(activePoseId)
          if (standard) {
            const comparator = new PoseComparator()
            const compResult = comparator.compare(angles, standard)
            setComparisonResult(compResult)
            setScore(compResult.overallScore)

            const engine = new CorrectionEngine()
            const advices = engine.generateAdvice(compResult)
            setCorrections(advices)

            // 高亮问题关节
            const problemJoints = compResult.differences
              .filter((d) => d.severity !== 'good')
              .map((d) => d.joint)
            rendererRef.current?.highlightProblemJoints(problemJoints)
          }

          // 肌肉热力图
          if (showMuscles) {
            const mapper = getMuscleMapper()
            const tensions = mapper.calculateTension(angles)
            rendererRef.current?.updateMuscleHeatmap(tensions)
          }

          // 绘制 2D 关键点叠加
          drawPoseOverlay(frame.imageData as any, result.landmarks)
        }
      })

      setStatus('摄像头已启动')
    } catch (err) {
      console.error('启动摄像头失败:', err)
      setStatus('启动摄像头失败: ' + (err as Error).message)
    }
  }, [selectedPose, setCurrentPose, setComparisonResult, setCorrections])

  // 处理视频元数据加载
  const handleVideoMetadata = useCallback(() => {
    if (videoRef.current) {
      const w = videoRef.current.videoWidth
      const h = videoRef.current.videoHeight
      if (w > 0 && h > 0) {
        setVideoAspect(w / h)
      }
    }
  }, [])

  // 处理图片文件选择
  const handleImageFile = useCallback(async (file: File) => {
    try {
      setCurrentFileName(file.name)
      setStatus(`正在加载图片: ${file.name}`)

      const manager = getInputManager()
      await manager.loadImageFile(file)

      // 创建 img 元素显示并分析
      const imgEl = new Image()
      imgEl.src = URL.createObjectURL(file)
      imgEl.onload = async () => {
        // 更新宽高比
        if (imgEl.naturalWidth > 0 && imgEl.naturalHeight > 0) {
          setVideoAspect(imgEl.naturalWidth / imgEl.naturalHeight)
        }

        // 隐藏视频元素，用 canvas 直接显示图片
        if (videoRef.current) {
          videoRef.current.style.display = 'none'
        }

        // 图片加载完成后进行姿态估计
        const estimator = await getPoseEstimator()
        const result = estimator.estimate(imgEl, performance.now())

        if (result) {
          setCurrentPose(result)
          rendererRef.current?.updatePose(result.landmarks)

          // 在 canvas 上绘制图片和关键点
          drawPoseOverlay(imgEl, result.landmarks)

          const angles = AngleCalculator.calculateAllAngles(result.landmarks)
          const standard = getStandardPose(selectedPose)
          if (standard) {
            const comparator = new PoseComparator()
            const compResult = comparator.compare(angles, standard)
            setComparisonResult(compResult)
            setScore(compResult.overallScore)

            const engine = new CorrectionEngine()
            const advices = engine.generateAdvice(compResult)
            setCorrections(advices)

            const problemJoints = compResult.differences
              .filter((d) => d.severity !== 'good')
              .map((d) => d.joint)
            rendererRef.current?.highlightProblemJoints(problemJoints)
          }
          setStatus(`图片已分析: ${file.name}`)
        } else {
          // 即使没有检测到姿态，也显示图片
          const canvas = canvasRef.current
          if (canvas) {
            canvas.width = imgEl.naturalWidth
            canvas.height = imgEl.naturalHeight
            const ctx = canvas.getContext('2d')
            if (ctx) {
              ctx.drawImage(imgEl, 0, 0)
            }
          }
          setStatus('未检测到人体姿态')
        }
      }

      useAppStore.getState().setInputType('image')
    } catch (err) {
      console.error('加载图片失败:', err)
      setStatus('加载图片失败: ' + (err as Error).message)
    }
  }, [selectedPose, setCurrentPose, setComparisonResult, setCorrections])

  // 处理视频文件选择
  const handleVideoFile = useCallback(async (file: File) => {
    try {
      setCurrentFileName(file.name)
      setStatus(`正在加载视频: ${file.name}`)

      const manager = getInputManager()
      await manager.loadVideoFile(file)

      // 获取视频元素用于 UI 显示
      if (videoRef.current) {
        videoRef.current.srcObject = null
        videoRef.current.src = URL.createObjectURL(file)
        videoRef.current.loop = true
        videoRef.current.muted = true

        // 等待元数据加载以获取宽高比
        await new Promise<void>((resolve) => {
          videoRef.current!.onloadedmetadata = () => {
            const w = videoRef.current!.videoWidth
            const h = videoRef.current!.videoHeight
            if (w > 0 && h > 0) {
              setVideoAspect(w / h)
            }
            resolve()
          }
        })

        await videoRef.current.play()
      }

      // 注册帧回调
      manager.onFrame(async (frame) => {
        const estimator = await getPoseEstimator()
        const result = estimator.estimate(frame.imageData as any, frame.timestamp)

        if (result) {
          setCurrentPose(result)
          setConfidence(result.confidence ?? 0.5)
          rendererRef.current?.updatePose(result.landmarks)

          const angles = AngleCalculator.calculateAllAngles(result.landmarks)
          const standard = getStandardPose(selectedPose)
          if (standard) {
            const comparator = new PoseComparator()
            const compResult = comparator.compare(angles, standard)
            setComparisonResult(compResult)
            setScore(compResult.overallScore)

            const engine = new CorrectionEngine()
            const advices = engine.generateAdvice(compResult)
            setCorrections(advices)

            const problemJoints = compResult.differences
              .filter((d) => d.severity !== 'good')
              .map((d) => d.joint)
            rendererRef.current?.highlightProblemJoints(problemJoints)
          }

          drawPoseOverlay(frame.imageData as any, result.landmarks)
        }
      })

      useAppStore.getState().setInputType('video')
      setStatus(`视频播放中: ${file.name}`)
    } catch (err) {
      console.error('加载视频失败:', err)
      setStatus('加载视频失败: ' + (err as Error).message)
    }
  }, [selectedPose, setCurrentPose, setComparisonResult, setCorrections])

  // 绘制 2D 关键点叠加
  const drawPoseOverlay = useCallback(
    (source: HTMLVideoElement | HTMLImageElement, landmarks: any[]) => {
      const canvas = canvasRef.current
      if (!canvas || !source) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const width = (source as HTMLVideoElement).videoWidth || (source as HTMLImageElement).naturalWidth || 640
      const height = (source as HTMLVideoElement).videoHeight || (source as HTMLImageElement).naturalHeight || 480

      canvas.width = width
      canvas.height = height

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // 如果是图片源，先绘制图片到 canvas
      if (source instanceof HTMLImageElement) {
        ctx.drawImage(source, 0, 0, width, height)
      }

      // 绘制关键点
      for (const lm of landmarks) {
        if (lm.visibility < 0.3) continue
        const x = lm.x * canvas.width
        const y = lm.y * canvas.height
        ctx.beginPath()
        ctx.arc(x, y, 4, 0, 2 * Math.PI)
        ctx.fillStyle = '#52c41a'
        ctx.fill()
      }

      // 绘制骨骼连线
      const connections: [number, number][] = [
        [11, 12], [23, 24], [11, 23], [12, 24],
        [11, 13], [13, 15], [12, 14], [14, 16],
        [23, 25], [25, 27], [24, 26], [26, 28],
      ]

      ctx.strokeStyle = '#4a90d9'
      ctx.lineWidth = 2
      for (const [i, j] of connections) {
        const a = landmarks[i]
        const b = landmarks[j]
        if (a.visibility < 0.3 || b.visibility < 0.3) continue
        ctx.beginPath()
        ctx.moveTo(a.x * canvas.width, a.y * canvas.height)
        ctx.lineTo(b.x * canvas.width, b.y * canvas.height)
        ctx.stroke()
      }
    },
    []
  )

  return (
    <div style={styles.container}>
      {/* 顶部标题栏 */}
      <div style={styles.header}>
        <h1 style={styles.title}>瑜伽体式分析系统</h1>
        <div style={styles.headerRight}>
          {confidence > 0 && (
            <span style={{
              ...styles.confidence,
              color: confidence >= 0.6 ? '#52c41a' : confidence >= 0.35 ? '#faad14' : '#ff4d4f',
            }}>
              置信度: {Math.round(confidence * 100)}%
            </span>
          )}
          <span style={{
            ...styles.stateTag,
            backgroundColor: smootherState === 'locked' ? '#722ed1' : 'transparent',
            color: smootherState === 'locked' ? '#fff' : '#666',
            border: smootherState === 'locked' ? 'none' : '1px solid #444',
          }}>
            {smootherState === 'locked' ? '🔒 已锁定' : '🔓 跟踪中'}
          </span>
          <span style={styles.status}>{status}</span>
        </div>
      </div>

      {/* 主内容区 */}
      <div style={styles.main}>
        {/* 左侧：视频视图 */}
        <div style={styles.leftPanel}>
          <div style={styles.videoContainer}>
            <div style={{
              ...styles.videoWrapper,
              aspectRatio: videoAspect,
            }}>
              <video
                ref={videoRef}
                style={styles.video}
                playsInline
                muted
                autoPlay
                onLoadedMetadata={handleVideoMetadata}
              />
              <canvas
                ref={canvasRef}
                style={styles.canvas}
              />
            </div>
          </div>
          <div style={styles.videoControls}>
            <button
              style={{
                ...styles.button,
                ...(inputType === 'camera' ? styles.buttonActive : {}),
              }}
              onClick={() => startCamera()}
            >
              📷 摄像头
            </button>
            <button
              style={styles.button}
              onClick={() => imageInputRef.current?.click()}
            >
              🖼️ 上传图片
            </button>
            <button
              style={styles.button}
              onClick={() => videoInputRef.current?.click()}
            >
              🎬 上传视频
            </button>
            {cameraDevices.length > 1 && (
              <select
                style={styles.select}
                onChange={(e) => startCamera(e.target.value)}
              >
                {cameraDevices.map((d) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || `摄像头 ${d.deviceId.slice(0, 8)}`}
                  </option>
                ))}
              </select>
            )}
            {currentFileName && (
              <span style={styles.fileName}>{currentFileName}</span>
            )}
          </div>
          {/* 隐藏的文件输入 */}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleImageFile(file)
            }}
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleVideoFile(file)
            }}
          />
        </div>

        {/* 右侧：3D 视图 */}
        <div style={styles.rightPanel}>
          <div
            ref={threeContainerRef}
            style={styles.threeContainer}
          />
        </div>
      </div>

      {/* 底部面板 */}
      <div style={styles.bottomPanel}>
        {/* 左侧：控制面板 */}
        <div style={styles.controlSection}>
          <div style={styles.controlRow}>
            <h3 style={styles.sectionTitle}>体式选择</h3>
            <label style={styles.autoDetectLabel}>
              <input
                type="checkbox"
                checked={autoDetect}
                onChange={(e) => setAutoDetect(e.target.checked)}
                style={styles.checkbox}
              />
              自动识别
            </label>
          </div>
          {autoDetect && detectedPose && detectedPose.confidence > 0.4 && (
            <div style={styles.detectedInfo}>
              识别: {STANDARD_POSES.find(p => p.id === detectedPose.poseId)?.nameCN ?? detectedPose.poseId}
              <span style={styles.detectedConf}>
                {Math.round(detectedPose.confidence * 100)}%
              </span>
            </div>
          )}
          <div style={styles.poseSelector}>
            {[
              { id: 'tadasana', name: '山式' },
              { id: 'virabhadrasana_ii', name: '战士二式' },
              { id: 'trikonasana', name: '三角式' },
              { id: 'adho_mukha_svanasana', name: '下犬式' },
              { id: 'vrksasana', name: '树式' },
              { id: 'utkatasana', name: '幻椅式' },
              { id: 'balasana', name: '婴儿式' },
              { id: 'bhujangasana', name: '眼镜蛇式' },
              { id: 'navasana', name: '船式' },
              { id: 'savasana', name: '挺尸式' },
            ].map((p) => (
              <button
                key={p.id}
                style={{
                  ...styles.poseButton,
                  ...(selectedPose === p.id ? styles.poseButtonActive : {}),
                }}
                onClick={() => useAppStore.getState().setSelectedPose(p.id)}
              >
                {p.name}
              </button>
            ))}
          </div>
          <h3 style={{...styles.sectionTitle, marginTop: 12}}>平滑强度</h3>
          <div style={styles.smoothSelector}>
            {[
              { level: 0, label: '无' },
              { level: 1, label: '轻' },
              { level: 2, label: '中' },
              { level: 3, label: '强' },
              { level: 4, label: '极强' },
            ].map((s) => (
              <button
                key={s.level}
                style={{
                  ...styles.smoothButton,
                  ...(smoothLevel === s.level ? styles.smoothButtonActive : {}),
                }}
                onClick={() => setSmoothLevel(s.level)}
              >
                {s.label}
              </button>
            ))}
          </div>
          <h3 style={{...styles.sectionTitle, marginTop: 12}}>显示选项</h3>
          <div style={styles.toggleRow}>
            <label style={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={showMuscles}
                onChange={(e) => setShowMuscles(e.target.checked)}
                style={styles.checkbox}
              />
              肌肉热力图
            </label>
          </div>
        </div>

        {/* 右侧：评分和矫正建议 */}
        <div style={styles.correctionSection}>
          <h3 style={styles.sectionTitle}>
            评分: <span style={{ color: score >= 80 ? '#52c41a' : score >= 60 ? '#faad14' : '#ff4d4f' }}>
              {score}/100
            </span>
          </h3>
          <div style={styles.corrections}>
            {useAppStore.getState().corrections.length === 0 ? (
              <p style={styles.noCorrection}>暂无矫正建议</p>
            ) : (
              useAppStore.getState().corrections.slice(0, 4).map((c) => (
                <div
                  key={c.id}
                  style={{
                    ...styles.correctionCard,
                    borderLeftColor:
                      c.priority === 'high'
                        ? '#ff4d4f'
                        : c.priority === 'medium'
                        ? '#faad14'
                        : '#52c41a',
                  }}
                >
                  <strong style={styles.correctionTitle}>{c.title}</strong>
                  <p style={styles.correctionDesc}>{c.description}</p>
                  <p style={styles.correctionAction}>{c.action}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// 内联样式
const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: '#141414',
    color: '#fff',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 16px',
    backgroundColor: '#1f1f1f',
    borderBottom: '1px solid #333',
  },
  title: {
    fontSize: 18,
    fontWeight: 600,
    margin: 0,
  },
  status: {
    fontSize: 13,
    color: '#999',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  confidence: {
    fontSize: 13,
    fontWeight: 600,
  },
  stateTag: {
    fontSize: 11,
    padding: '2px 8px',
    borderRadius: 4,
    fontWeight: 500,
  },
  main: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
  leftPanel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    borderRight: '1px solid #333',
  },
  videoContainer: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    overflow: 'hidden',
    padding: 8,
  },
  videoWrapper: {
    position: 'relative',
    maxWidth: '100%',
    maxHeight: '100%',
    overflow: 'hidden',
    borderRadius: 4,
  },
  video: {
    width: '100%',
    height: '100%',
    display: 'block',
    objectFit: 'contain',
  },
  canvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
  },
  videoControls: {
    display: 'flex',
    gap: 8,
    padding: '8px 12px',
    backgroundColor: '#1f1f1f',
  },
  button: {
    padding: '6px 14px',
    backgroundColor: '#4a90d9',
    color: '#fff',
    borderRadius: 6,
    fontSize: 13,
    border: 'none',
    cursor: 'pointer',
  },
  buttonActive: {
    backgroundColor: '#52c41a',
  },
  fileName: {
    fontSize: 12,
    color: '#999',
    marginLeft: 'auto',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: 200,
  },
  select: {
    padding: '6px 10px',
    backgroundColor: '#333',
    color: '#fff',
    borderRadius: 6,
    fontSize: 13,
    border: '1px solid #444',
  },
  rightPanel: {
    flex: 1,
  },
  threeContainer: {
    width: '100%',
    height: '100%',
  },
  bottomPanel: {
    display: 'flex',
    height: 200,
    borderTop: '1px solid #333',
  },
  controlSection: {
    flex: 1,
    padding: '10px 14px',
    borderRight: '1px solid #333',
    overflow: 'auto',
  },
  controlRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  autoDetectLabel: {
    fontSize: 12,
    color: '#ccc',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    cursor: 'pointer',
  },
  checkbox: {
    cursor: 'pointer',
  },
  detectedInfo: {
    fontSize: 12,
    color: '#52c41a',
    padding: '4px 8px',
    backgroundColor: '#1a2e1a',
    borderRadius: 4,
    marginBottom: 6,
    display: 'flex',
    justifyContent: 'space-between',
  },
  detectedConf: {
    color: '#999',
  },
  toggleRow: {
    display: 'flex',
    gap: 12,
  },
  toggleLabel: {
    fontSize: 12,
    color: '#ccc',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    cursor: 'pointer',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 8,
    marginTop: 0,
  },
  poseSelector: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 5,
  },
  poseButton: {
    padding: '4px 10px',
    backgroundColor: 'rgba(255,255,255,0.06)',
    color: '#aaa',
    borderRadius: 4,
    fontSize: 12,
    border: '1px solid rgba(255,255,255,0.08)',
    cursor: 'pointer',
  },
  poseButtonActive: {
    backgroundColor: '#4a90d9',
    color: '#fff',
    borderColor: '#4a90d9',
    boxShadow: '0 0 8px rgba(74,144,217,0.3)',
  },
  smoothSelector: {
    display: 'flex',
    gap: 4,
  },
  smoothButton: {
    padding: '3px 8px',
    backgroundColor: 'rgba(255,255,255,0.06)',
    color: '#aaa',
    borderRadius: 4,
    fontSize: 11,
    border: '1px solid rgba(255,255,255,0.08)',
    cursor: 'pointer',
  },
  smoothButtonActive: {
    backgroundColor: '#722ed1',
    color: '#fff',
    borderColor: '#722ed1',
    boxShadow: '0 0 8px rgba(114,46,209,0.3)',
  },
  correctionSection: {
    flex: 1,
    padding: '10px 14px',
    overflow: 'auto',
  },
  corrections: {
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
  },
  noCorrection: {
    color: '#555',
    fontSize: 12,
  },
  correctionCard: {
    padding: '6px 10px',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 4,
    borderLeft: '3px solid #faad14',
  },
  correctionTitle: {
    fontSize: 12,
    display: 'block',
    fontWeight: 500,
  },
  correctionDesc: {
    fontSize: 11,
    color: '#777',
    margin: '2px 0',
  },
  correctionAction: {
    fontSize: 11,
    color: '#4a90d9',
    margin: '2px 0 0',
  },
}
