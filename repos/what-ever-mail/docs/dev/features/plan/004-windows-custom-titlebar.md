# Windows Custom Title Bar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the native Windows frame, menu bar, and title bar; replace with a fully custom title bar showing SMTP status on the left, the wordmark centred, and Settings + Minimize + Maximize + Close on the right.

**Architecture:** Set `frame: false` on Windows in the main process (macOS keeps `titleBarStyle: 'hiddenInset'`). Add three IPC channels for window controls. The renderer detects Windows via `navigator.platform` and renders a `<WindowControls>` component; the TitleBar layout reorders its sections on Windows only. Maximized state is pushed from main to renderer via a dedicated IPC event so the maximize button can toggle between □ and ⧉.

**Tech Stack:** Electron BrowserWindow, ipcMain/ipcRenderer, React, Tailwind (existing tokens).

**macOS is not touched** — all changes are gated on `process.platform === 'win32'` in main and `isWindows` derived from `navigator.platform` in the renderer.

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/main/index.ts` | **Modify** | `frame: false` + `Menu.setApplicationMenu(null)` on Windows only |
| `src/main/ipc/channels.ts` | **Modify** | Add `WINDOW_MINIMIZE`, `WINDOW_MAXIMIZE_TOGGLE`, `WINDOW_CLOSE`, `WINDOW_MAXIMIZED_CHANGE` |
| `src/main/ipc/handlers.ts` | **Modify** | Register handlers for the three window action channels; push `WINDOW_MAXIMIZED_CHANGE` events |
| `src/preload/index.ts` | **Modify** | Expose `window.api.window.*` (minimize, maximizeToggle, close, onMaximizedChange) |
| `src/renderer/components/WindowControls.tsx` | **Create** | Minimize / Maximize / Close buttons with correct SVG icons |
| `src/renderer/components/TitleBar.tsx` | **Modify** | Move SMTP to left on Windows; append `<WindowControls>` on Windows |

---

## Task 1: Remove native Windows frame and menu bar

**Files:**
- Modify: `src/main/index.ts`

- [ ] **Step 1: Import `Menu` at the top of index.ts**

The existing import line is:
```typescript
import { app, BrowserWindow, shell, nativeImage } from 'electron'
```
Change to:
```typescript
import { app, BrowserWindow, Menu, shell, nativeImage } from 'electron'
```

- [ ] **Step 2: Hide the application menu on Windows**

Add this line immediately after `app.setName('WhatEver Mail')` (currently line 11):
```typescript
if (process.platform === 'win32') {
  Menu.setApplicationMenu(null)
}
```

- [ ] **Step 3: Use `frame: false` on Windows**

In `createWindow()`, replace the `titleBarStyle` line (currently line 26):
```typescript
titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
```
with:
```typescript
...(process.platform === 'darwin'
  ? { titleBarStyle: 'hiddenInset' as const }
  : { frame: false }),
```

The full `BrowserWindow` constructor block becomes:
```typescript
mainWindow = new BrowserWindow({
  width: bounds?.width ?? 1200,
  height: bounds?.height ?? 800,
  x: bounds?.x,
  y: bounds?.y,
  minWidth: 800,
  minHeight: 600,
  ...(process.platform === 'darwin'
    ? { titleBarStyle: 'hiddenInset' as const }
    : { frame: false }),
  webPreferences: {
    preload: join(__dirname, '../preload/index.js'),
    sandbox: false,
    contextIsolation: true,
    nodeIntegration: false,
  },
})
```

- [ ] **Step 4: Commit**

```bash
git add repos/what-ever-mail/src/main/index.ts
git commit -m "feat(windows): remove native frame and menu bar"
```

---

## Task 2: Add window control IPC channels

**Files:**
- Modify: `src/main/ipc/channels.ts`

- [ ] **Step 1: Add four new channel constants**

In `channels.ts`, add to the `IPC` object:
```typescript
WINDOW_MINIMIZE:        'window:minimize',
WINDOW_MAXIMIZE_TOGGLE: 'window:maximizeToggle',
WINDOW_CLOSE:           'window:close',
WINDOW_MAXIMIZED_CHANGE:'window:maximizedChange',
```

The full file after the change:
```typescript
export const IPC = {
  EMAILS_LIST:      'emails:list',
  EMAILS_GET:       'emails:get',
  EMAILS_DELETE:    'emails:delete',
  EMAILS_CLEAR:     'emails:clear',
  EMAILS_MARK_READ:        'emails:markRead',
  EMAILS_TRASH:            'emails:trash',
  EMAILS_RESTORE:          'emails:restore',
  EMAILS_DELETE_PERMANENT: 'emails:deletePermanent',
  EMAILS_CLEAR_TRASH:      'emails:clearTrash',
  SETTINGS_GET:     'settings:get',
  SETTINGS_SET:     'settings:set',
  SMTP_STATUS:      'smtp:status',
  NEW_EMAIL:        'emails:new',
  SMTP_RESTART:     'smtp:restart',
  SMTP_STOP:        'smtp:stop',
  TRAY_BADGE:       'tray:badge',
  WINDOW_MINIMIZE:        'window:minimize',
  WINDOW_MAXIMIZE_TOGGLE: 'window:maximizeToggle',
  WINDOW_CLOSE:           'window:close',
  WINDOW_MAXIMIZED_CHANGE:'window:maximizedChange',
} as const

export type IpcChannel = (typeof IPC)[keyof typeof IPC]
```

- [ ] **Step 2: Commit**

```bash
git add repos/what-ever-mail/src/main/ipc/channels.ts
git commit -m "feat(windows): add window control IPC channel constants"
```

---

## Task 3: Register window control IPC handlers

**Files:**
- Modify: `src/main/ipc/handlers.ts`
- Modify: `src/main/index.ts` (wire up maximize/unmaximize events)

- [ ] **Step 1: Add window control handlers in handlers.ts**

At the bottom of `registerIpcHandlers`, add (the `mainWindow` parameter is already available):
```typescript
ipcMain.handle(IPC.WINDOW_MINIMIZE, () => {
  mainWindow?.minimize()
})

ipcMain.handle(IPC.WINDOW_MAXIMIZE_TOGGLE, () => {
  if (!mainWindow) return
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize()
  } else {
    mainWindow.maximize()
  }
})

ipcMain.handle(IPC.WINDOW_CLOSE, () => {
  mainWindow?.close()
})
```

- [ ] **Step 2: Push maximized state changes to renderer in index.ts**

In `index.ts`, inside the `app.whenReady()` block after `createWindow()`, add:
```typescript
if (process.platform === 'win32' && mainWindow) {
  mainWindow.on('maximize', () => {
    mainWindow?.webContents.send(IPC.WINDOW_MAXIMIZED_CHANGE, true)
  })
  mainWindow.on('unmaximize', () => {
    mainWindow?.webContents.send(IPC.WINDOW_MAXIMIZED_CHANGE, false)
  })
}
```

Also add the `IPC` import to `index.ts`:
```typescript
import { IPC } from './ipc/channels'
```

- [ ] **Step 3: Commit**

```bash
git add repos/what-ever-mail/src/main/ipc/handlers.ts \
        repos/what-ever-mail/src/main/index.ts
git commit -m "feat(windows): register window minimize/maximize/close IPC handlers"
```

---

## Task 4: Expose window controls in preload

**Files:**
- Modify: `src/preload/index.ts`

- [ ] **Step 1: Add `window` namespace to the exposed API**

In `preload/index.ts`, add after the `tray` block:
```typescript
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
```

- [ ] **Step 2: Update the type declaration**

Find the TypeScript declaration for `window.api` (in `src/preload/index.d.ts` or wherever `ElectronAPI` is declared) and add:
```typescript
window: {
  minimize: () => Promise<void>
  maximizeToggle: () => Promise<void>
  close: () => Promise<void>
  onMaximizedChange: (cb: (isMaximized: boolean) => void) => () => void
}
```

- [ ] **Step 3: Commit**

```bash
git add repos/what-ever-mail/src/preload/index.ts
git commit -m "feat(windows): expose window controls via preload bridge"
```

---

## Task 5: Create WindowControls component

**Files:**
- Create: `src/renderer/components/WindowControls.tsx`

- [ ] **Step 1: Create WindowControls.tsx**

```tsx
// src/renderer/components/WindowControls.tsx
import React, { useEffect, useState } from 'react'

export function WindowControls(): React.JSX.Element {
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    const unsub = window.api.window.onMaximizedChange(setIsMaximized)
    return unsub
  }, [])

  return (
    <div className="flex items-stretch h-full app-no-drag">
      {/* Minimize */}
      <button
        onClick={() => window.api.window.minimize()}
        className="w-11 h-full flex items-center justify-center text-fg-2 hover:bg-surface-2 hover:text-fg-1 transition-colors duration-100"
        title="Minimize"
      >
        <svg width="10" height="1" viewBox="0 0 10 1" fill="currentColor">
          <rect width="10" height="1" />
        </svg>
      </button>

      {/* Maximize / Restore */}
      <button
        onClick={() => window.api.window.maximizeToggle()}
        className="w-11 h-full flex items-center justify-center text-fg-2 hover:bg-surface-2 hover:text-fg-1 transition-colors duration-100"
        title={isMaximized ? 'Restore' : 'Maximize'}
      >
        {isMaximized ? (
          /* Restore icon — two overlapping squares */
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.1">
            <rect x="3" y="0.5" width="7" height="7" />
            <polyline points="0.5,3.5 0.5,10.5 7.5,10.5 7.5,7.5" />
          </svg>
        ) : (
          /* Maximize icon — single square */
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.1">
            <rect x="0.5" y="0.5" width="9" height="9" />
          </svg>
        )}
      </button>

      {/* Close */}
      <button
        onClick={() => window.api.window.close()}
        className="w-11 h-full flex items-center justify-center text-fg-2 hover:bg-red-500 hover:text-white transition-colors duration-100"
        title="Close"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
          <line x1="0" y1="0" x2="10" y2="10" />
          <line x1="10" y1="0" x2="0" y2="10" />
        </svg>
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add repos/what-ever-mail/src/renderer/components/WindowControls.tsx
git commit -m "feat(windows): add WindowControls component (min/max/close)"
```

---

## Task 6: Update TitleBar layout for Windows

**Files:**
- Modify: `src/renderer/components/TitleBar.tsx`

Current layout:
```
[flex-1 spacer] [SMTP status] [Settings gear]
                      (wordmark is absolute-centred)
```

New Windows layout:
```
[SMTP status] [flex-1] [Settings gear] [WindowControls]
                   (wordmark stays absolute-centred)
```

macOS layout is **unchanged**.

- [ ] **Step 1: Import WindowControls and adjust the component**

Replace the full `TitleBar.tsx` with:

```tsx
import React, { useEffect, useState } from 'react'
import clsx from 'clsx'
import { WindowControls } from './WindowControls'

interface SmtpStatus {
  running: boolean
  port: number
}

interface TitleBarProps {
  onSettingsClick: () => void
}

export default function TitleBar({ onSettingsClick }: TitleBarProps): React.JSX.Element {
  const [smtp, setSmtp] = useState<SmtpStatus>({ running: false, port: 1025 })
  const isMac = navigator.platform.includes('Mac')
  const isWindows = navigator.platform.includes('Win')

  useEffect(() => {
    window.api.smtp.getStatus().then(setSmtp)
    const interval = setInterval(() => {
      window.api.smtp.getStatus().then(setSmtp)
    }, 5000)
    const handleStatusChange = (e: Event): void => {
      setSmtp((e as CustomEvent<SmtpStatus>).detail)
    }
    window.addEventListener('smtp-status-changed', handleStatusChange)
    return () => {
      clearInterval(interval)
      window.removeEventListener('smtp-status-changed', handleStatusChange)
    }
  }, [])

  const smtpBadge = (
    <div
      className={clsx(
        'flex items-center gap-[5px] rounded-[20px] px-[10px] py-[3px] text-[11px] font-medium text-[#888] tracking-[0.04em] app-no-drag border',
        smtp.running ? 'border-emerald-500' : 'border-red-500'
      )}
    >
      <span className={`w-[6px] h-[6px] rounded-full inline-block shrink-0 ${smtp.running ? 'bg-emerald-500' : 'bg-red-500'}`} />
      SMTP :{smtp.port}
    </div>
  )

  const settingsButton = (
    <button
      onClick={onSettingsClick}
      title="Settings"
      className="bg-transparent border-0 cursor-pointer text-fg-2 p-1 rounded-md flex items-center app-no-drag transition-colors duration-150 hover:text-fg-1"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    </button>
  )

  return (
    <header
      className={clsx(
        'h-11 bg-surface-panel border-b border-accent flex items-center shrink-0 select-none relative app-drag',
        isMac ? 'pl-20 pr-4 gap-3' : isWindows ? 'pl-3 pr-0 gap-3' : 'px-4 gap-3'
      )}
    >
      {/* Wordmark — always horizontally centred */}
      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-bold text-[15px] tracking-[-0.4px] whitespace-nowrap pointer-events-none">
        <span className="text-fg-1">What </span>
        <span className="text-accent">Ever</span>
        <span className="text-fg-1"> Mail</span>
      </span>

      {/* macOS: spacer left (traffic lights) | SMTP | Settings */}
      {!isWindows && (
        <>
          <div className="flex-1" />
          {smtpBadge}
          {settingsButton}
        </>
      )}

      {/* Windows: SMTP left | spacer | Settings | WindowControls */}
      {isWindows && (
        <>
          {smtpBadge}
          <div className="flex-1" />
          {settingsButton}
          <WindowControls />
        </>
      )}
    </header>
  )
}
```

- [ ] **Step 2: Verify on macOS (no regression)**

Run: `npm run dev` in `repos/what-ever-mail/`
Expected on macOS: Title bar looks identical to before — traffic lights top-left, SMTP + settings top-right. No console errors.

- [ ] **Step 3: Verify on Windows**

Run: `npm run dev` on Windows.
Expected:
- Native Windows title bar and menu bar are gone
- Custom title bar shows: `[SMTP :1025] [wordmark centred] [⚙] [−] [□] [×]`
- Window is draggable by clicking and dragging the title bar background
- Minimize, maximize, close buttons work
- Maximize button icon switches to restore icon when window is maximised
- Window is still resizable by dragging its edges

- [ ] **Step 4: Commit**

```bash
git add repos/what-ever-mail/src/renderer/components/TitleBar.tsx
git commit -m "feat(windows): rearrange TitleBar and add custom window controls"
```

---

## Verification Checklist

- [ ] macOS: title bar unchanged, traffic lights visible, SMTP + settings on the right
- [ ] Windows: no native title bar, no "File Edit View Window Help" menu bar
- [ ] Windows: SMTP badge on the left, wordmark centred, settings + controls on the right
- [ ] Windows: minimize button minimises the window
- [ ] Windows: maximize button maximises; icon changes to restore; restore button restores
- [ ] Windows: close button closes the window
- [ ] Windows: title bar area is draggable (can drag the window by the empty space)
- [ ] Windows: window is still resizable by dragging edges
- [ ] `npm run typecheck` passes with no errors
