/**
 * 本地日志工具
 * 使用控制台 + Electron IPC 写入文件
 */

// 全局日志存储
const logEntries: string[] = []

// 标记是否已经输出过警告
let electronAPIWarningShown = false

export function writeLog(message: string, data?: any): void {
  const timestamp = new Date().toISOString()
  const entry = `[${timestamp}] ${message}${data ? ' ' + JSON.stringify(data) : ''}`
  
  // 存储到全局变量
  logEntries.push(entry)
  
  // 输出到控制台
  console.log('[LOG]', entry)
  
  // 通过 Electron IPC 写入文件
  if (typeof window !== 'undefined') {
    const api = (window as any).electronAPI
    if (api && api.writeLog) {
      api.writeLog(entry + '\n')
    } else if (!electronAPIWarningShown) {
      console.warn('[LOG] electronAPI.writeLog not available, logging to console only')
      electronAPIWarningShown = true
    }
    
    // 更新全局日志 (可在控制台访问)
    (window as any).__yogaLog = logEntries.join('\n')
  }
}

export function getLog(): string {
  return logEntries.join('\n')
}

export function downloadLog(): void {
  const content = logEntries.join('\n')
  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'yoga-debug.log'
  a.click()
  URL.revokeObjectURL(url)
}
