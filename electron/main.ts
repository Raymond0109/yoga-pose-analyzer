import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'

let mainWindow: BrowserWindow | null = null
const isDev = !app.isPackaged

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    title: '瑜伽体式分析系统',
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// IPC: 文件选择对话框
ipcMain.handle('dialog:openFile', async (_, options) => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile'],
    filters: [
      { name: '媒体文件', extensions: ['mp4', 'webm', 'mov', 'jpg', 'jpeg', 'png'] },
    ],
  })
  return result
})

// IPC: 获取摄像头列表 (通过渲染进程 webContents)
ipcMain.handle('camera:listDevices', async () => {
  // 摄像头设备列表需要在渲染进程中获取
  // 这里返回空数组，实际由 preload 中的 web API 获取
  return []
})
