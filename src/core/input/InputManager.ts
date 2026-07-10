import type { InputFrame, InputSourceConfig } from '@/types/common'

export class InputManager {
  private videoElement: HTMLVideoElement | null = null
  private imageElement: HTMLImageElement | null = null
  private stream: MediaStream | null = null
  private frameCallbacks: Set<(frame: InputFrame) => void> = new Set()
  private animationId: number | null = null
  private isRunning = false
  private externalVideo: HTMLVideoElement | null = null

  /** 设置外部视频元素 (UI 显示用) */
  setExternalVideo(el: HTMLVideoElement): void {
    this.externalVideo = el
  }

  /** 获取摄像头列表 */
  static async getCameraDevices(): Promise<MediaDeviceInfo[]> {
    const devices = await navigator.mediaDevices.enumerateDevices()
    return devices.filter((d) => d.kind === 'videoinput')
  }

  /** 启动摄像头 */
  async startCamera(deviceId?: string, resolution?: { width: number; height: number }): Promise<void> {
    await this.stop()

    const constraints: MediaStreamConstraints = {
      video: {
        deviceId: deviceId ? { exact: deviceId } : undefined,
        width: resolution?.width ?? 1280,
        height: resolution?.height ?? 720,
      },
    }

    this.stream = await navigator.mediaDevices.getUserMedia(constraints)

    // 使用外部视频元素（如果已设置）
    const video = this.externalVideo ?? document.createElement('video')
    video.srcObject = this.stream
    video.autoplay = true
    video.playsInline = true
    video.muted = true
    await video.play()

    this.videoElement = video
    this.startFrameLoop()
  }

  /** 加载视频文件 */
  async loadVideoFile(file: File): Promise<void> {
    await this.stop()

    const video = this.externalVideo ?? document.createElement('video')
    video.srcObject = null
    video.src = URL.createObjectURL(file)
    video.loop = true
    video.muted = true
    video.playsInline = true

    // 等待元数据加载
    await new Promise<void>((resolve) => {
      video.onloadedmetadata = () => resolve()
    })
    await video.play()

    this.videoElement = video
    this.startFrameLoop()
  }

  /** 加载图片文件 */
  async loadImageFile(file: File): Promise<void> {
    await this.stop()

    this.imageElement = new Image()
    await new Promise<void>((resolve, reject) => {
      this.imageElement!.onload = () => resolve()
      this.imageElement!.onerror = () => reject(new Error('图片加载失败'))
      this.imageElement!.src = URL.createObjectURL(file)
    })

    // 对于图片，隐藏视频元素，只发送一帧
    if (this.externalVideo) {
      this.externalVideo.style.display = 'none'
    }

    const frame: InputFrame = {
      imageData: this.imageElement,
      width: this.imageElement.naturalWidth,
      height: this.imageElement.naturalHeight,
      timestamp: performance.now(),
    }
    this.emitFrame(frame)
  }

  /** 开始帧循环 */
  private startFrameLoop(): void {
    this.isRunning = true

    // 确保视频元素可见
    if (this.externalVideo) {
      this.externalVideo.style.display = 'block'
    }

    const loop = () => {
      if (!this.isRunning || !this.videoElement) return

      if (this.videoElement.readyState >= 2) {
        const frame: InputFrame = {
          imageData: this.videoElement,
          width: this.videoElement.videoWidth,
          height: this.videoElement.videoHeight,
          timestamp: performance.now(),
        }
        this.emitFrame(frame)
      }

      this.animationId = requestAnimationFrame(loop)
    }
    loop()
  }

  /** 注册帧回调 */
  onFrame(callback: (frame: InputFrame) => void): () => void {
    this.frameCallbacks.add(callback)
    return () => this.frameCallbacks.delete(callback)
  }

  /** 发送帧 */
  private emitFrame(frame: InputFrame): void {
    for (const cb of this.frameCallbacks) {
      cb(frame)
    }
  }

  /** 暂停 */
  pause(): void {
    this.videoElement?.pause()
  }

  /** 恢复 */
  resume(): void {
    this.videoElement?.play()
  }

  /** 停止 */
  async stop(): Promise<void> {
    this.isRunning = false

    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }

    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop())
      this.stream = null
    }

    // 不清除外部视频元素，只清除内部的
    if (this.videoElement && this.videoElement !== this.externalVideo) {
      this.videoElement.pause()
      this.videoElement.srcObject = null
    }
    this.videoElement = null
    this.imageElement = null
  }

  /** 获取视频元素 */
  getVideoElement(): HTMLVideoElement | null {
    return this.videoElement
  }
}
