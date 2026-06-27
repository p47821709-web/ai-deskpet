import { ipcMain, BrowserWindow } from 'electron'

export function registerPetWindowIPC(mainWindow: BrowserWindow) {
  ipcMain.on('update-position', (_event, x: number, y: number) => {
    mainWindow.setPosition(x, y)
  })
}
