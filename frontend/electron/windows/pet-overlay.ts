import { BrowserWindow } from 'electron'
import path from 'path'

export function createPetOverlay(): BrowserWindow {
  const win = new BrowserWindow({
    width: 200,
    height: 200,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    hasShadow: false,
    focusable: false,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })
  win.setIgnoreMouseEvents(true)
  return win
}
