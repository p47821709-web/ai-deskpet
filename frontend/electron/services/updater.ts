/**
 * AutoUpdater — 自动更新服务
 *
 * 基于 electron-updater 实现，支持：
 * - 启动时静默检查更新
 * - 用户手动检查更新
 * - 后台下载 + 安装提示
 * - 强制更新模式
 */

import { autoUpdater, type UpdateInfo } from 'electron-updater'
import { BrowserWindow, dialog, app } from 'electron'
import { logger } from '../services/logger'

const UPDATE_FEEDBACK_URL = 'https://releases.aideskpet.com'
const CHECK_INTERVAL_MS = 4 * 60 * 60 * 1000

class AppUpdater {
  private _mainWindow: BrowserWindow | null = null
  private _updateInfo: UpdateInfo | null = null
  private _isChecking: boolean = false
  private _isDownloading: boolean = false
  private _checkTimer: ReturnType<typeof setInterval> | null = null
  private _initialized: boolean = false

  initialize(mainWindow: BrowserWindow): void {
    if (this._initialized) return
    this._initialized = true
    this._mainWindow = mainWindow

    autoUpdater.autoDownload = false
    autoUpdater.autoInstallOnAppQuit = true
    autoUpdater.allowPrerelease = false

    if (!app.isPackaged) {
      logger.info('[AutoUpdater] Dev mode — auto-update disabled')
      return
    }

    this._registerEvents()

    setTimeout(() => {
      this.checkForUpdates(true)
    }, 10_000)

    this._checkTimer = setInterval(() => {
      this.checkForUpdates(true)
    }, CHECK_INTERVAL_MS)

    logger.info('[AutoUpdater] Initialized')
  }

  async checkForUpdates(silent: boolean = false): Promise<void> {
    if (this._isChecking || this._isDownloading) return
    this._isChecking = true

    try {
      const raw = await autoUpdater.checkForUpdates()
      if (!raw) { logger.warn("[AutoUpdater] Empty response"); return }
      const result = raw
      this._updateInfo = result.updateInfo

      if (result.updateInfo.version === app.getVersion()) {
        logger.info('[AutoUpdater] Already up-to-date: %s', app.getVersion())
        if (!silent) {
          dialog.showMessageBox({
            type: 'info',
            title: '检查更新',
            message: '当前已是最新版本',
            detail: 'AI DeskPet v' + app.getVersion(),
          })
        }
        return
      }

      const { response } = await dialog.showMessageBox({
        type: 'info',
        title: '发现新版本',
        message: '发现新版本 v' + result.updateInfo.version,
        detail: [
          '当前版本: v' + app.getVersion(),
          '最新版本: v' + result.updateInfo.version,
          '',
          '是否立即下载更新？',
        ].join('\n'),
        buttons: ['立即更新', '稍后再说'],
        defaultId: 0,
        cancelId: 1,
      })

      if (response === 0) {
        this._downloadUpdate()
      }
    } catch (err) {
      logger.warn('[AutoUpdater] Check failed: %s', err)
      if (!silent) {
        dialog.showErrorBox('检查更新失败', String(err))
      }
    } finally {
      this._isChecking = false
    }
  }

  get status() {
    return {
      checking: this._isChecking,
      downloading: this._isDownloading,
      updateAvailable: !!this._updateInfo && this._updateInfo.version !== app.getVersion(),
      version: this._updateInfo?.version ?? '',
    }
  }

  private _downloadUpdate(): void {
    if (this._isDownloading) return
    this._isDownloading = true
    autoUpdater.downloadUpdate()
    if (this._mainWindow && !this._mainWindow.isDestroyed()) {
      this._mainWindow.webContents.send('update:download-started')
    }
  }

  private _registerEvents(): void {
    autoUpdater.on('checking-for-update', () => {
      logger.info('[AutoUpdater] Checking for update...')
    })

    autoUpdater.on('update-available', (info: UpdateInfo) => {
      logger.info('[AutoUpdater] Update available: v%s', info.version)
    })

    autoUpdater.on('update-not-available', () => {
      logger.info('[AutoUpdater] No update available')
    })

    autoUpdater.on('download-progress', (progress) => {
      logger.info('[AutoUpdater] Download progress: %s%%', progress.percent.toFixed(1))
      if (this._mainWindow && !this._mainWindow.isDestroyed()) {
        this._mainWindow.webContents.send('update:download-progress', progress)
      }
    })

    autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
      this._isDownloading = false
      logger.info('[AutoUpdater] Update downloaded: v%s', info.version)
      if (this._mainWindow && !this._mainWindow.isDestroyed()) {
        this._mainWindow.webContents.send('update:downloaded', info)
      }
      dialog.showMessageBox({
        type: 'info',
        title: '更新已下载',
        message: '新版本 v' + info.version + ' 已下载完成',
        detail: '是否立即重启以安装更新？',
        buttons: ['立即重启', '稍后重启'],
        defaultId: 0,
        cancelId: 1,
      }).then(({ response }) => {
        if (response === 0) {
          autoUpdater.quitAndInstall()
        }
      })
    })

    autoUpdater.on('error', (err: Error) => {
      this._isDownloading = false
      logger.error('[AutoUpdater] Error: %s', err.message)
    })
  }

  destroy(): void {
    if (this._checkTimer) {
      clearInterval(this._checkTimer)
      this._checkTimer = null
    }
    this._initialized = false
    logger.info('[AutoUpdater] Destroyed')
  }
}

export const appUpdater = new AppUpdater()
