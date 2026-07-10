/**
 * 本地日志工具
 * 使用控制台 + 全局变量存储日志
 */

// 全局日志存储
const logEntries: string[] = []

export function writeLog(message: string, data?: any): void {
  const timestamp = new Date().toISOString()
  const entry = `[${timestamp}] ${message}${data ? ' ' + JSON.stringify(data) : ''}`
  
  // 存储到全局变量
  logEntries.push(entry)
  
  // 同时输出到控制台
  console.log('[LOG]', entry)
  
  // 更新全局日志 (可在控制台访问)
  if (typeof window !== 'undefined') {
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
