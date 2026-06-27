import { ipcMain } from 'electron'

export function registerUpdaterIPC() {
  ipcMain.handle('check-update', async () => {
    return { hasUpdate: false, version: '' }
  })
}
