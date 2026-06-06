import { ipcMain, desktopCapturer } from 'electron'

export function registerScreenshotIPC() {
  ipcMain.handle('take-screenshot', async () => {
    const sources = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: 1920, height: 1080 } })
    return sources[0]?.thumbnail.toDataURL()
  })
}
