import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '../main/ipc/channels'
import type { EmailRecord } from '../renderer/types/email'

contextBridge.exposeInMainWorld('api', {
  emails: {
    list: (): Promise<EmailRecord[]> => ipcRenderer.invoke(IPC.EMAILS_LIST),
    get: (id: string): Promise<EmailRecord | null> => ipcRenderer.invoke(IPC.EMAILS_GET, id),
    delete: (id: string): Promise<void> => ipcRenderer.invoke(IPC.EMAILS_DELETE, id),
    clear: (): Promise<void> => ipcRenderer.invoke(IPC.EMAILS_CLEAR),
    markRead: (id: string): Promise<void> => ipcRenderer.invoke(IPC.EMAILS_MARK_READ, id),
    trash: (id: string): Promise<void> => ipcRenderer.invoke(IPC.EMAILS_TRASH, id),
    restore: (id: string): Promise<void> => ipcRenderer.invoke(IPC.EMAILS_RESTORE, id),
    deletePermanent: (id: string): Promise<void> => ipcRenderer.invoke(IPC.EMAILS_DELETE_PERMANENT, id),
    clearTrash: (): Promise<void> => ipcRenderer.invoke(IPC.EMAILS_CLEAR_TRASH),
    onNew: (cb: (email: EmailRecord) => void): (() => void) => {
      const listener = (_event: Electron.IpcRendererEvent, email: EmailRecord): void => cb(email)
      ipcRenderer.on(IPC.NEW_EMAIL, listener)
      return () => ipcRenderer.off(IPC.NEW_EMAIL, listener)
    },
  },

  settings: {
    get: <T = unknown>(key: string): Promise<T> => ipcRenderer.invoke(IPC.SETTINGS_GET, key),
    set: (key: string, value: unknown): Promise<void> =>
      ipcRenderer.invoke(IPC.SETTINGS_SET, key, value),
  },

  smtp: {
    getStatus: (): Promise<{ running: boolean; port: number; host: string; error: string | null }> =>
      ipcRenderer.invoke(IPC.SMTP_STATUS),
    restart: (port: number, host: string): Promise<void> => ipcRenderer.invoke(IPC.SMTP_RESTART, port, host),
    stop: (): Promise<void> => ipcRenderer.invoke(IPC.SMTP_STOP),
  },

  tray: {
    setBadge: (count: number): Promise<void> => ipcRenderer.invoke(IPC.TRAY_BADGE, count),
  },

  window: {
    minimize: (): Promise<void> => ipcRenderer.invoke(IPC.WINDOW_MINIMIZE),
    maximizeToggle: (): Promise<void> => ipcRenderer.invoke(IPC.WINDOW_MAXIMIZE_TOGGLE),
    close: (): Promise<void> => ipcRenderer.invoke(IPC.WINDOW_CLOSE),
    onMaximizedChange: (cb: (isMaximized: boolean) => void): (() => void) => {
      const listener = (_event: Electron.IpcRendererEvent, value: boolean): void => cb(value)
      ipcRenderer.on(IPC.WINDOW_MAXIMIZED_CHANGE, listener)
      return () => ipcRenderer.off(IPC.WINDOW_MAXIMIZED_CHANGE, listener)
    },
  },
})
