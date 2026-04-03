import { app, BrowserWindow, Menu, shell, nativeImage, screen } from 'electron'
import { join } from 'path'
import { registerIpcHandlers } from './ipc/handlers'
import { startSmtpServer, stopSmtpServer, getSmtpStatus } from './smtp/server'
import { getSetting, setSetting } from './settings'
import { closeDb } from './db/index'
import { purgeOldTrashedEmails } from './db/emails'
import { loadReleaseNotesIfNewBundle } from './release-notes'
import { createTray, destroyTray } from './tray'
import { IPC } from './ipc/channels'

app.setName('WhatEver Mail')

if (process.platform === 'win32') {
  Menu.setApplicationMenu(null)
}

let mainWindow: BrowserWindow | null = null
let isQuitting = false

function resolveWindowBounds(
  saved: { x: number; y: number; width: number; height: number } | null
): { x: number; y: number; width: number; height: number } | null {
  if (!saved) return null
  if (saved.width < 800 || saved.height < 600) return null

  // Ensure the window title bar is reachable on at least one display.
  const displays = screen.getAllDisplays()
  const reachable = displays.some((d) => {
    const wa = d.workArea
    return (
      saved.x + 100 > wa.x &&
      saved.x < wa.x + wa.width &&
      saved.y + 30 > wa.y &&
      saved.y < wa.y + wa.height
    )
  })

  return reachable ? saved : null
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    ...(process.platform === 'darwin'
      ? { titleBarStyle: 'hiddenInset' as const }
      : { frame: false, backgroundColor: '#00000000' }),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  mainWindow.once('ready-to-show', () => {
    const saved = getSetting('windowBounds')
    const bounds = resolveWindowBounds(saved)
    if (bounds && mainWindow) {
      mainWindow.setBounds(bounds)
    }
    mainWindow?.show()
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
    loadReleaseNotesIfNewBundle()
    purgeOldTrashedEmails(15)
    createTray(mainWindow)

    if (process.platform === 'win32') {
      mainWindow.on('maximize', () => {
        mainWindow?.webContents.send(IPC.WINDOW_MAXIMIZED_CHANGE, true)
      })
      mainWindow.on('unmaximize', () => {
        mainWindow?.webContents.send(IPC.WINDOW_MAXIMIZED_CHANGE, false)
      })
    }

    // Start SMTP after the renderer is ready — on Windows, starting it earlier
    // causes the server to silently fail because the networking stack isn't
    // fully initialised when app.whenReady() fires. Retry once after 2 s in
    // case the first listen() attempt loses the race against the OS port
    // reservation (observed on Windows only).
    mainWindow.once('ready-to-show', () => {
      if (mainWindow) {
        startSmtpServer(getSetting('smtpPort'), mainWindow)
        setTimeout(() => {
          if (!getSmtpStatus().running && mainWindow) {
            startSmtpServer(getSetting('smtpPort'), mainWindow)
          }
        }, 2000)
      }
    })
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
