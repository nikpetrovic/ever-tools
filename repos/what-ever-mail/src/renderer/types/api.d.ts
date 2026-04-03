import type { EmailRecord } from './email'

declare global {
  interface Window {
    api: {
      emails: {
        list: () => Promise<EmailRecord[]>
        get: (id: string) => Promise<EmailRecord | null>
        delete: (id: string) => Promise<void>
        clear: () => Promise<void>
        markRead: (id: string) => Promise<void>
        trash: (id: string) => Promise<void>
        restore: (id: string) => Promise<void>
        deletePermanent: (id: string) => Promise<void>
        clearTrash: () => Promise<void>
        onNew: (cb: (email: EmailRecord) => void) => () => void
      }
      settings: {
        get: <T = unknown>(key: string) => Promise<T>
        set: (key: string, value: unknown) => Promise<void>
      }
      smtp: {
        getStatus: () => Promise<{ running: boolean; port: number }>
        restart: (port: number) => Promise<void>
        stop: () => Promise<void>
      }
      tray: {
        setBadge: (count: number) => Promise<void>
      }
      window: {
        minimize: () => Promise<void>
        maximizeToggle: () => Promise<void>
        close: () => Promise<void>
        onMaximizedChange: (cb: (isMaximized: boolean) => void) => () => void
      }
    }
  }
}

export {}
