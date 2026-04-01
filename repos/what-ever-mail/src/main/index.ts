import { app, BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { registerIpcHandlers } from './ipc/handlers'
import { startSmtpServer, stopSmtpServer } from './smtp/server'
import { getSetting, setSetting } from './settings'
import { closeDb } from './db/index'
import { createTray, destroyTray } from './tray'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  const bounds = getSetting('windowBounds')

  mainWindow = new BrowserWindow({
    width: bounds?.width ?? 1200,
    height: bounds?.height ?? 800,
    x: bounds?.x,
    y: bounds?.y,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  mainWindow.on('close', (e) => {
    if (mainWindow) {
      const b = mainWindow.getBounds()
      setSetting('windowBounds', { x: b.x, y: b.y, width: b.width, height: b.height })
    }
    // Minimise to tray on macOS instead of quitting
    if (process.platform === 'darwin') {
      e.preventDefault()
      mainWindow?.hide()
    }
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()
  if (mainWindow) {
    registerIpcHandlers(mainWindow)
    startSmtpServer(getSetting('smtpPort'), mainWindow)
    createTray(mainWindow)
  }

  app.on('activate', () => {
    if (mainWindow) {
      mainWindow.show()
      mainWindow.focus()
    } else {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    stopSmtpServer()
    closeDb()
    destroyTray()
    app.quit()
  }
})

app.on('before-quit', () => {
  stopSmtpServer()
  closeDb()
  destroyTray()
})
