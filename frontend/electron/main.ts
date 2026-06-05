import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } from 'electron'
import path from 'path'

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
  petWindow.loadURL(isDev ? 'http://localhost:5173' : 'file://' + path.join(__dirname, '../dist/index.html'))
}

function createTray() {
  const icon = nativeImage.createEmpty()
  tray = new Tray(icon)
  const contextMenu = Menu.buildFromTemplate([
    { label: '打开主界面', click: () => mainWindow?.show() },
    { type: 'separator' },
    { label: '退出', click: () => { _isQuitting = true; app.quit() } },
  ])
  tray.setToolTip('AI DeskPet')
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
    chatWindow.loadURL(isDev ? 'http://localhost:5173/chat/' + petId : 'file://' + path.join(__dirname, '../dist/index.html'))
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

  ipcMain.handle('set-auto-launch', async (_event, enable: boolean) => {
    app.setLoginItemSettings({ openAtLogin: enable })
  })

  ipcMain.handle('get-auto-launch', () => {
    return app.getLoginItemSettings().openAtLogin
  })
}

app.whenReady().then(() => {
  createMainWindow()
  createTray()
  setupIPC()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (mainWindow === null) createMainWindow()
  else mainWindow.show()
})
