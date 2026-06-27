export {}

declare global {
  interface Window {
    /** Electron 主进程通过 preload.ts 暴露的 IPC API */
    electronAPI?: {
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
  }
}
