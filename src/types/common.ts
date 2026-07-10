/** 输入源类型 */
export type InputSourceType = 'camera' | 'video' | 'image'

/** 输入帧 */
export interface InputFrame {
  imageData: HTMLVideoElement | HTMLImageElement | ImageData
  width: number
  height: number
  timestamp: number
}

/** 输入源配置 */
export interface InputSourceConfig {
  type: InputSourceType
  cameraId?: string
  filePath?: string
  resolution?: { width: number; height: number }
}

/** Electron API 类型声明 */
declare global {
  interface Window {
    electronAPI: {
      openFile: (options?: any) => Promise<{ canceled: boolean; filePaths: string[] }>
      listCameras: () => Promise<Array<{ deviceId: string; label: string }>>
    }
  }
}
