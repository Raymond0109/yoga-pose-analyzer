import { contextBridge, ipcRenderer } from 'electron'

export interface ElectronAPI {
  openFile: (options?: any) => Promise<{ canceled: boolean; filePaths: string[] }>
  listCameras: () => Promise<Array<{ deviceId: string; label: string }>>
  writeLog: (message: string) => void
  clearLog: () => void
}

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: (options?: any) => ipcRenderer.invoke('dialog:openFile', options),
  listCameras: () => ipcRenderer.invoke('camera:listDevices'),
  writeLog: (message: string) => ipcRenderer.send('log:write', message),
  clearLog: () => ipcRenderer.send('log:clear'),
} as ElectronAPI)
