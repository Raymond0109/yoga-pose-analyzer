import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import * as fs from 'fs'

let mainWindow: BrowserWindow | null = null
const isDev = !app.isPackaged

// 日志文件路径 - 写到项目目录
const LOG_FILE = join(process.cwd(), 'yoga-debug.log')

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

  // 打开开发者工具
  if (isDev) {
    mainWindow.webContents.openDevTools()
  }

  // 写入启动日志
  fs.writeFileSync(LOG_FILE, `[${new Date().toISOString()}] App started\n`)
  fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] Log file: ${LOG_FILE}\n`)
  fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] isDev: ${isDev}\n`)
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

// IPC: 获取摄像头列表
ipcMain.handle('camera:listDevices', async () => {
  return []
})

// IPC: 写入日志
ipcMain.on('log:write', (_, message: string) => {
  try {
    fs.appendFileSync(LOG_FILE, message)
  } catch (error) {
    console.error('Failed to write log:', error)
  }
})

// IPC: 清除日志
ipcMain.on('log:clear', () => {
  try {
    fs.writeFileSync(LOG_FILE, '')
  } catch (error) {
    console.error('Failed to clear log:', error)
  }
})

// 导出日志路径供调试
console.log('Log file:', LOG_FILE)
fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] IPC handlers registered\n`)
