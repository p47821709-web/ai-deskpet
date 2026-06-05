﻿export interface ElectronAPI {
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
