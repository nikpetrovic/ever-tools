# Windows Startup Bugs — Fix Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix two Windows-only bugs: (1) release-notes emails never appear in a packaged build, (2) the window opens smaller than its minimum size when saved bounds are invalid.

**Architecture:**
Bug 1 — `loadReleaseNotesIfNewBundle()` silently swallows errors in the insert loop; any throw from `insertEmail()` stops execution before `setSetting('lastLoadedBundleId', …)` is reached. We add a simple file logger and wrap each insert in a per-record try/catch so partial failures don't abort the whole load, and we always persist the bundleId so the app doesn't retry forever on permanent failures. A new `src/main/logger.ts` keeps logging concerns out of the release-notes module.
Bug 2 — saved `windowBounds` are restored by passing them directly to the BrowserWindow constructor; on Windows, DPI resolution hasn't stabilised at that point, which can produce a window smaller than `minWidth`/`minHeight`. Restoring bounds via `setBounds()` inside `ready-to-show` — after the window is fully initialised — fixes the race, and a validation helper discards stale/off-screen bounds before applying them.

**Tech Stack:** Electron, TypeScript, better-sqlite3, Node.js `fs` (appendFileSync)

---

## Files

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/main/logger.ts` | Append-to-file + console error logging |
| Modify | `src/main/release-notes.ts` | Add per-record try/catch + logging |
| Modify | `src/main/index.ts` | Defer bounds restoration to `ready-to-show` + validate bounds |

---

## Task 1: Add a file logger

**Files:**
- Create: `repos/what-ever-mail/src/main/logger.ts`

The logger writes every message to `<userData>/app.log` (append) so errors are visible on Windows packaged builds where DevTools may not be open. It also echoes to `console.error` / `console.log`.

- [ ] **Step 1: Create `src/main/logger.ts`**

```typescript
import { app } from 'electron'
import { join } from 'path'
import { appendFileSync } from 'fs'

function getLogPath(): string {
  return join(app.getPath('userData'), 'app.log')
}

export function logError(context: string, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error)
  const stack = error instanceof Error ? (error.stack ?? '') : ''
  const line = `[${new Date().toISOString()}] ERROR [${context}] ${message}${stack ? '\n' + stack : ''}\n`
  console.error(line)
  try {
    appendFileSync(getLogPath(), line, 'utf-8')
  } catch {
    // intentionally empty — can't log a logger failure
  }
}

export function logInfo(context: string, message: string): void {
  const line = `[${new Date().toISOString()}] INFO  [${context}] ${message}\n`
  console.log(line)
  try {
    appendFileSync(getLogPath(), line, 'utf-8')
  } catch {
    // intentionally empty
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd repos/what-ever-mail
npx tsc -p tsconfig.node.json --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add repos/what-ever-mail/src/main/logger.ts
git commit -m "feat: add file-based logger for packaged Windows diagnostics"
```

---

## Task 2: Fix release-notes silent failure (Bug 1)

**Files:**
- Modify: `repos/what-ever-mail/src/main/release-notes.ts`

Replace the bare insert loop with per-record try/catch. Always persist `lastLoadedBundleId` at the end (even if some records failed) so the app does not retry on every launch when there is a permanent DB error.

- [ ] **Step 1: Update imports in `release-notes.ts`**

Replace the existing import block at the top of the file:

```typescript
import { app } from 'electron'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { v4 as uuid } from 'uuid'
import type { EmailRecord } from '../renderer/types/email'
import { insertEmail, hasAnyEmails } from './db/emails'
import { getSetting, setSetting } from './settings'
import { logError, logInfo } from './logger'
```

- [ ] **Step 2: Replace the insert loop in `loadReleaseNotesIfNewBundle`**

Find the current loop (roughly lines 83–117):

```typescript
  for (let i = 0; i < emails.length; i++) {
    const entry = emails[i]
    // Email 001 (index 0) gets the most recent timestamp → appears at top of inbox
    const timestamp = new Date(now - (emails.length - 1 - i) * 1000)
    const dateIso = timestamp.toISOString()
    const messageId = `<${uuid()}@whatever-mail.local>`
    const isHtml = entry.type === 'html'
    const contentType = isHtml ? 'text/html; charset=utf-8' : 'text/plain; charset=utf-8'
    const body = replacePlaceholders(entry.content, localDate)

    const record: EmailRecord = {
      id: uuid(),
      messageId,
      from,
      to: [to],
      cc: [],
      subject,
      date: dateIso,
      html: isHtml ? body : null,
      text: isHtml ? null : body,
      raw: buildRaw({ from, to, subject, messageId, date: dateIso, contentType, body }),
      headers: {
        date: dateIso,
        'message-id': messageId,
        'mime-version': '1.0',
        'content-type': contentType,
      },
      attachments: [],
      read: false,
      createdAt: dateIso,
      deletedAt: null,
    }

    insertEmail(record)
  }

  setSetting('lastLoadedBundleId', bundle.bundleId)
```

Replace it with:

```typescript
  logInfo('release-notes', `Loading bundle ${bundle.bundleId} (${emails.length} email(s))`)

  for (let i = 0; i < emails.length; i++) {
    const entry = emails[i]
    // Email 001 (index 0) gets the most recent timestamp → appears at top of inbox
    const timestamp = new Date(now - (emails.length - 1 - i) * 1000)
    const dateIso = timestamp.toISOString()
    const messageId = `<${uuid()}@whatever-mail.local>`
    const isHtml = entry.type === 'html'
    const contentType = isHtml ? 'text/html; charset=utf-8' : 'text/plain; charset=utf-8'
    const body = replacePlaceholders(entry.content, localDate)

    const record: EmailRecord = {
      id: uuid(),
      messageId,
      from,
      to: [to],
      cc: [],
      subject,
      date: dateIso,
      html: isHtml ? body : null,
      text: isHtml ? null : body,
      raw: buildRaw({ from, to, subject, messageId, date: dateIso, contentType, body }),
      headers: {
        date: dateIso,
        'message-id': messageId,
        'mime-version': '1.0',
        'content-type': contentType,
      },
      attachments: [],
      read: false,
      createdAt: dateIso,
      deletedAt: null,
    }

    try {
      insertEmail(record)
      logInfo('release-notes', `Inserted email ${i + 1}/${emails.length}: ${entry.filename}`)
    } catch (err) {
      logError('release-notes', err)
    }
  }

  // Always persist the bundleId — if inserts failed due to a permanent error
  // (e.g. schema mismatch), retrying on every launch won't help.
  setSetting('lastLoadedBundleId', bundle.bundleId)
  logInfo('release-notes', `Bundle ${bundle.bundleId} marked as loaded`)
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd repos/what-ever-mail
npx tsc -p tsconfig.node.json --noEmit
```

Expected: no errors.

- [ ] **Step 4: Smoke test in dev**

```bash
npm run dev
```

Open the app. Release-notes emails should appear. Close the app and reopen — they should NOT be re-inserted (bundleId is persisted).

- [ ] **Step 5: Commit**

```bash
git add repos/what-ever-mail/src/main/release-notes.ts
git commit -m "fix: prevent silent failure in release-notes insert loop on Windows"
```

---

## Task 3: Fix window too small on Windows (Bug 2)

**Files:**
- Modify: `repos/what-ever-mail/src/main/index.ts`

Don't pass saved bounds into the BrowserWindow constructor — DPI resolution on Windows hasn't stabilised at that point. Instead, validate and restore bounds inside `ready-to-show`, after the window is fully initialised.

- [ ] **Step 1: Add `screen` to the electron import in `index.ts`**

The current import at line 1:
```typescript
import { app, BrowserWindow, Menu, shell, nativeImage } from 'electron'
```

Replace with:
```typescript
import { app, BrowserWindow, Menu, shell, nativeImage, screen } from 'electron'
```

- [ ] **Step 2: Add a `resolveWindowBounds` helper above `createWindow`**

Insert the following function directly above the `createWindow` function declaration:

```typescript
function resolveWindowBounds(
  saved: { x: number; y: number; width: number; height: number } | null
): { x: number; y: number; width: number; height: number } | null {
  if (!saved) return null
  if (saved.width < 800 || saved.height < 600) return null

  // Ensure the window title bar is reachable on at least one display.
  // We check that the top-left 100×30 region overlaps a display work area.
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
```

- [ ] **Step 3: Update `createWindow` to use defaults only in the constructor**

Replace the BrowserWindow construction block (it currently reads `bounds` from settings and passes x/y/width/height in):

```typescript
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
```

Also remove the `const bounds = getSetting('windowBounds')` line that was at the top of `createWindow` (it's no longer needed there), and keep the `mainWindow.on('close', …)` save-bounds handler unchanged.

The full updated `createWindow` function should look like:

```typescript
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
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd repos/what-ever-mail
npx tsc -p tsconfig.node.json --noEmit
```

Expected: no errors.

- [ ] **Step 5: Test on macOS (simulate)**

```bash
npm run dev
```

Resize the window, close it, reopen it — bounds should be restored to the saved size. Window should never open smaller than 800×600.

- [ ] **Step 6: Commit**

```bash
git add repos/what-ever-mail/src/main/index.ts
git commit -m "fix: restore window bounds in ready-to-show to avoid DPI race on Windows"
```

---

## Notes for Windows testing

After building and installing the packaged app on Windows:

- **Bug 1 log file**: Open `%APPDATA%\WhatEver Mail\app.log` to see exactly which step succeeded or failed. If an email insert threw an error, the full stack trace is there.
- **Bug 2**: Delete `%APPDATA%\WhatEver Mail\settings.json` to clear saved bounds, then relaunch — the window should open at 1200×800 centred. Resize it, close, reopen — saved bounds should be respected.
