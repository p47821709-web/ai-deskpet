import { BrowserWindow } from 'electron'
import path from 'path'

export function createChatWindow(petId: string): BrowserWindow {
  const win = new BrowserWindow({
    width: 400,
    height: 600,
    alwaysOnTop: true,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })
  return win
}
