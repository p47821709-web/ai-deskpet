import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } from 'electron'
import path from 'path'

// ── Import Electron 子模块 ──────────────────────────────────
import { logger } from './services/logger'
import { registerUpdaterIPC } from './ipc/updater'
import { registerAutoLaunchIPC } from './ipc/auto-launch'
import { registerScreenshotIPC } from './ipc/screenshot'
import { appUpdater } from './services/updater'

// ── Global Error Handlers ──────────────────────────────────
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err.message, err.stack)
  logger.error('[FATAL] Uncaught Exception:', err.message, err.stack)
  if (app.isPackaged) app.exit(1)
})

process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Unhandled Rejection:', reason)
  logger.error('[FATAL] Unhandled Rejection:', reason)
})

let mainWindow: BrowserWindow | null = null
let petWindow: BrowserWindow | null = null
let chatWindow: BrowserWindow | null = null
let tray: Tray | null = null

// Custom flag for quit handling
let _isQuitting = false

const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('--dev')

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('close', (event) => {
    if (!_isQuitting) {
      event.preventDefault()
      mainWindow?.hide()
    }
  })
}

function createPetWindow() {
  petWindow = new BrowserWindow({
    width: 200,
    height: 200,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  petWindow.setIgnoreMouseEvents(true)
  petWindow.loadURL(isDev ? 'http://localhost:5173/#/pet-overlay' : 'file://' + path.join(__dirname, '../dist/index.html#/pet-overlay'))
}

function createTray() {
  const icon = nativeImage.createEmpty()
  tray = new Tray(icon)
  const contextMenu = Menu.buildFromTemplate([
    { label: '打开主界面', click: () => mainWindow?.show() },
    { type: 'separator' },
    { label: '退出', click: () => { _isQuitting = true; app.quit() } },
  ])
  tray.setToolTip('AI 桌宠')
  tray.setContextMenu(contextMenu)
  tray.on('click', () => mainWindow?.show())
}

// IPC Handlers
function setupIPC() {
  ipcMain.on('spawn-pet', (_event, petId: string) => {
    if (!petWindow) createPetWindow()
  })

  ipcMain.on('recall-pet', () => {
    petWindow?.close()
    petWindow = null
  })

  ipcMain.on('toggle-pet-interaction', (_event, enable: boolean) => {
    petWindow?.setIgnoreMouseEvents(!enable)
  })

  ipcMain.on('open-chat', (_event, petId: string) => {
    chatWindow = new BrowserWindow({
      width: 400,
      height: 600,
      alwaysOnTop: true,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
      },
    })
    chatWindow.loadURL(isDev ? 'http://localhost:5173/#/chat/' + petId : 'file://' + path.join(__dirname, '../dist/index.html#/chat/' + petId))
    chatWindow.on('closed', () => { chatWindow = null })
  })

  ipcMain.on('update-position', (_event, x: number, y: number) => {
    if (petWindow && !petWindow.isDestroyed()) {
      petWindow.setPosition(x, y)
    }
  })

  ipcMain.on('minimize-to-tray', () => {
    mainWindow?.hide()
  })

  ipcMain.on('quit-app', () => {
    _isQuitting = true
    app.quit()
  })

  ipcMain.handle('get-version', () => app.getVersion())

  // 子模块 IPC 注册
  registerAutoLaunchIPC()
  registerScreenshotIPC()
  registerUpdaterIPC()
}

app.whenReady().then(() => {
  // 初始化日志系统
  logger.init()

  // 去掉默认菜单栏（File Edit View Window Help）
  Menu.setApplicationMenu(null)

  createMainWindow()
  createTray()
  setupIPC()

  // 初始化自动更新
  appUpdater.initialize(mainWindow!)
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (mainWindow === null) createMainWindow()
  else mainWindow.show()
})
