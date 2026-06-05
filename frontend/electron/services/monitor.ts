import { ipcMain } from 'electron'

export class SystemMonitor {
  private interval: ReturnType<typeof setInterval> | null = null

  start() {
    this.interval = setInterval(() => {
      const usage = process.cpuUsage()
      const memory = process.memoryUsage()
    }, 5000)
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
  }
}
