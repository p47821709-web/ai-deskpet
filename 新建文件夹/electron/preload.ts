﻿﻿import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  spawnPet: (petId: string) => ipcRenderer.send('spawn-pet', petId),
  recallPet: () => ipcRenderer.send('recall-pet'),
  updatePosition: (x: number, y: number) => ipcRenderer.send('update-position', x, y),
  openChat: (petId: string) => ipcRenderer.send('open-chat', petId),
  minimizeToTray: () => ipcRenderer.send('minimize-to-tray'),
  quitApp: () => ipcRenderer.send('quit-app'),
  getVersion: () => ipcRenderer.invoke('get-version'),
  setAutoLaunch: (enabled: boolean) => ipcRenderer.invoke('set-auto-launch', enabled),
  getAutoLaunch: () => ipcRenderer.invoke('get-auto-launch'),
  on: (channel: string, callback: (...args: any[]) => void) => {
    ipcRenderer.on(channel, (_event, ...args) => callback(...args))
  },
})
