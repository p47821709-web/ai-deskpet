/**
 * IPC Bridge — Electron 渲染进程与主进程通信桥接
 *
 * 通过 preload.ts 暴露的 window.electronAPI 进行通信。
 * 不直接 import electron（那在渲染进程无法工作）。
 * 完全兼容 contextIsolation: true + nodeIntegration: false。
 */

// ── 类型定义 ────────────────────────────────────────────────

interface ElectronAPI {
  spawnPet: (petId: string) => void
  recallPet: () => void
  updatePosition: (x: number, y: number) => void
  openChat: (petId: string) => void
  minimizeToTray: () => void
  quitApp: () => void
  getVersion: () => Promise<string>
  setAutoLaunch: (enabled: boolean) => Promise<void>
  getAutoLaunch: () => Promise<boolean>
  on: (channel: string, callback: (...args: any[]) => void) => void
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}

// ── 安全获取 electronAPI ─────────────────────────────────────

function getAPI(): ElectronAPI | null {
  if (typeof window !== 'undefined' && window.electronAPI) {
    return window.electronAPI
  }
  return null
}

// ── IPC Bridge 单例 ─────────────────────────────────────────

export const ipcBridge: Partial<ElectronAPI> = {
  spawnPet: (petId: string) => {
    const api = getAPI()
    if (api?.spawnPet) api.spawnPet(petId)
    else console.warn('[IPC] spawnPet: electronAPI not available')
  },

  recallPet: () => {
    const api = getAPI()
    if (api?.recallPet) api.recallPet()
    else console.warn('[IPC] recallPet: electronAPI not available')
  },

  updatePosition: (x: number, y: number) => {
    const api = getAPI()
    if (api?.updatePosition) api.updatePosition(x, y)
    else console.warn('[IPC] updatePosition: electronAPI not available')
  },

  openChat: (petId: string) => {
    const api = getAPI()
    if (api?.openChat) api.openChat(petId)
    else console.warn('[IPC] openChat: electronAPI not available')
  },

  minimizeToTray: () => {
    const api = getAPI()
    if (api?.minimizeToTray) api.minimizeToTray()
    else console.warn('[IPC] minimizeToTray: electronAPI not available')
  },

  quitApp: () => {
    const api = getAPI()
    if (api?.quitApp) api.quitApp()
    else console.warn('[IPC] quitApp: electronAPI not available')
  },

  getVersion: async () => {
    const api = getAPI()
    if (api?.getVersion) return api.getVersion()
    console.warn('[IPC] getVersion: electronAPI not available')
    return '0.0.0'
  },

  setAutoLaunch: async (enabled: boolean) => {
    const api = getAPI()
    if (api?.setAutoLaunch) return api.setAutoLaunch(enabled)
    console.warn('[IPC] setAutoLaunch: electronAPI not available')
  },

  getAutoLaunch: async () => {
    const api = getAPI()
    if (api?.getAutoLaunch) return api.getAutoLaunch()
    console.warn('[IPC] getAutoLaunch: electronAPI not available')
    return false
  },

  on: (channel: string, callback: (...args: any[]) => void) => {
    const api = getAPI()
    if (api?.on) api.on(channel, callback)
    else console.warn('[IPC] on: electronAPI not available, channel:', channel)
  },
}
