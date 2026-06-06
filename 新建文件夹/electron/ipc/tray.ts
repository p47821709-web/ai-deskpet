import { ipcMain, app } from 'electron'

export function registerTrayIPC() {
  ipcMain.on('minimize-to-tray', () => {
    const win = require('electron').BrowserWindow.getAllWindows()[0]
    if (win) win.hide()
  })
  ipcMain.on('quit-app', () => {
    (app as any).isQuitting = true
    app.quit()
  })
}
