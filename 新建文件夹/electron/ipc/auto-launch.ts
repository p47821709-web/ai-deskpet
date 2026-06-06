import { ipcMain, app } from 'electron'

export function registerAutoLaunchIPC() {
  ipcMain.handle('set-auto-launch', async (_event, enable: boolean) => {
    app.setLoginItemSettings({ openAtLogin: enable })
  })
  ipcMain.handle('get-auto-launch', () => {
    return app.getLoginItemSettings().openAtLogin
  })
}
