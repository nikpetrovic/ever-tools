import { ipcMain } from 'electron'
import { IPC } from './channels'
import { listEmails, getEmail, deleteEmail, clearEmails, markRead, trashEmail, restoreEmail, permanentDeleteEmail, clearTrashedEmails } from '../db/emails'
import { getSetting, setSetting } from '../settings'
import { getSmtpStatus, restartSmtpServer, stopSmtpServer } from '../smtp/server'
import { updateTrayBadge } from '../tray'
import type { BrowserWindow } from 'electron'

export function registerIpcHandlers(mainWindow?: BrowserWindow): void {
  ipcMain.handle(IPC.EMAILS_LIST, () => listEmails())

  ipcMain.handle(IPC.EMAILS_GET, (_event, id: string) => getEmail(id))

  ipcMain.handle(IPC.EMAILS_DELETE, (_event, id: string) => {
    deleteEmail(id)
  })

  ipcMain.handle(IPC.EMAILS_CLEAR, () => {
    clearEmails()
  })

  ipcMain.handle(IPC.EMAILS_MARK_READ, (_event, id: string) => {
    markRead(id)
  })

  ipcMain.handle(IPC.EMAILS_TRASH, (_event, id: string) => {
    trashEmail(id)
  })

  ipcMain.handle(IPC.EMAILS_RESTORE, (_event, id: string) => {
    restoreEmail(id)
  })

  ipcMain.handle(IPC.EMAILS_DELETE_PERMANENT, (_event, id: string) => {
    permanentDeleteEmail(id)
  })

  ipcMain.handle(IPC.EMAILS_CLEAR_TRASH, () => {
    clearTrashedEmails()
  })

  ipcMain.handle(IPC.SETTINGS_GET, (_event, key: string) => getSetting(key as never))

  ipcMain.handle(IPC.SETTINGS_SET, (_event, key: string, value: unknown) => {
    setSetting(key as never, value as never)
  })

  ipcMain.handle(IPC.SMTP_STATUS, () => getSmtpStatus())

  ipcMain.handle(IPC.SMTP_RESTART, (_event, port: number) => {
    setSetting('smtpPort', port)
    if (mainWindow) restartSmtpServer(port, mainWindow)
  })

  ipcMain.handle(IPC.SMTP_STOP, () => {
    stopSmtpServer()
  })

  ipcMain.handle(IPC.TRAY_BADGE, (_event, count: number) => {
    updateTrayBadge(count)
  })
}
