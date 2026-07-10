import type { InputFrame, InputSourceConfig } from '@/types/common'

export class InputManager {
  private videoElement: HTMLVideoElement | null = null
  private imageElement: HTMLImageElement | null = null
  private stream: MediaStream | null = null
  private frameCallbacks: Set<(frame: InputFrame) => void> = new Set()
  private animationId: number | null = null
  private isRunning = false

  /** 获取摄像头列表 */
  static async getCameraDevices(): Promise<MediaDeviceInfo[]> {
    const devices = await navigator.mediaDevices.enumerateDevices()
    return devices.filter((d) => d.kind === 'videoinput')
  }

  /** 切换输入源 */
  async switchSource(config: InputSourceConfig): Promise<void> {
    await this.stop()

    switch (config.type) {
      case 'camera':
        await this.startCamera(config.cameraId, config.resolution)
        break
      case 'video':
        await this.loadVideo(config.filePath!)
        break
      case 'image':
        await this.loadImage(config.filePath!)
        break
    }
  }

  /** 启动摄像头 */
  private async startCamera(
    deviceId?: string,
    resolution?: { width: number; height: number }
  ): Promise<void> {
    const constraints: MediaStreamConstraints = {
      video: {
        deviceId: deviceId ? { exact: deviceId } : undefined,
        width: resolution?.width ?? 1280,
        height: resolution?.height ?? 720,
      },
    }

    this.stream = await navigator.mediaDevices.getUserMedia(constraints)

    this.videoElement = document.createElement('video')
    this.videoElement.srcObject = this.stream
    this.videoElement.autoplay = true
    this.videoElement.playsInline = true
    await this.videoElement.play()

    this.startFrameLoop()
  }

  /** 加载视频文件 */
  async loadVideoFile(file: File): Promise<void> {
    await this.stop()

    this.videoElement = document.createElement('video')
    this.videoElement.src = URL.createObjectURL(file)
    this.videoElement.loop = true
    this.videoElement.muted = true
    this.videoElement.playsInline = true
    await this.videoElement.play()

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

    // 对于图片，只发送一帧
    const frame: InputFrame = {
      imageData: this.imageElement,
      width: this.imageElement.naturalWidth,
      height: this.imageElement.naturalHeight,
      timestamp: performance.now(),
    }
    this.emitFrame(frame)
  }

  /** 加载视频文件 (路径) */
  private async loadVideo(filePath: string): Promise<void> {
    this.videoElement = document.createElement('video')
    this.videoElement.src = filePath
    this.videoElement.loop = true
    this.videoElement.muted = true
    this.videoElement.playsInline = true
    await this.videoElement.play()

    this.startFrameLoop()
  }

  /** 加载图片 (路径) */
  private async loadImage(filePath: string): Promise<void> {
    this.imageElement = new Image()
    await new Promise<void>((resolve, reject) => {
      this.imageElement!.onload = () => resolve()
      this.imageElement!.onerror = () => reject(new Error('图片加载失败'))
      this.imageElement!.src = filePath
    })

    // 对于图片，只发送一帧
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

    if (this.videoElement) {
      this.videoElement.pause()
      this.videoElement.srcObject = null
      this.videoElement = null
    }

    this.imageElement = null
  }

  /** 获取视频元素 (用于 UI 展示) */
  getVideoElement(): HTMLVideoElement | null {
    return this.videoElement
  }
}
