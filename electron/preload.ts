import { contextBridge, ipcRenderer } from 'electron'

export interface ElectronAPI {
  openFile: (options?: any) => Promise<{ canceled: boolean; filePaths: string[] }>
  listCameras: () => Promise<Array<{ deviceId: string; label: string }>>
}

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: (options?: any) => ipcRenderer.invoke('dialog:openFile', options),
  listCameras: () => ipcRenderer.invoke('camera:listDevices'),
} as ElectronAPI)
