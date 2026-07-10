/**
 * 本地日志工具
 * 写入到项目根目录的 debug.log 文件
 */

const LOG_FILE = 'debug.log'

export function writeLog(message: string, data?: any): void {
  const timestamp = new Date().toISOString()
  const logEntry = `[${timestamp}] ${message}${data ? ' ' + JSON.stringify(data) : ''}\n`
  
  // 使用 Electron 的 IPC 写入文件
  if (window.electronAPI?.writeLog) {
    window.electronAPI.writeLog(logEntry)
  } else {
    // 回退：下载日志文件
    console.log(logEntry)
  }
}

export function clearLog(): void {
  if (window.electronAPI?.clearLog) {
    window.electronAPI.clearLog()
  }
}
