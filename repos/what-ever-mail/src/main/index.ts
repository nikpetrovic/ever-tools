import { app, BrowserWindow, shell, nativeImage } from 'electron'
import { join } from 'path'
import { registerIpcHandlers } from './ipc/handlers'
import { startSmtpServer, stopSmtpServer } from './smtp/server'
import { getSetting, setSetting } from './settings'
import { closeDb } from './db/index'
import { purgeOldTrashedEmails } from './db/emails'
import { createTray, destroyTray } from './tray'

app.setName('WhatEver Mail')

let mainWindow: BrowserWindow | null = null
let isQuitting = false

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
    // Minimise to tray on macOS instead of quitting — unless the user explicitly quit
    if (process.platform === 'darwin' && !isQuitting) {
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
  // Set dock icon explicitly — fixes "Electron" default shown in dev mode
  if (process.platform === 'darwin') {
    const iconPath = join(__dirname, '../../resources/icon.icns')
    const icon = nativeImage.createFromPath(iconPath)
    if (!icon.isEmpty()) app.dock.setIcon(icon)
  }

  createWindow()
  if (mainWindow) {
    registerIpcHandlers(mainWindow)
    purgeOldTrashedEmails(15)
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
  isQuitting = true
  stopSmtpServer()
  closeDb()
  destroyTray()
})
