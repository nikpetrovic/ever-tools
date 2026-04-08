# PayPal Support Button Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Support my work" button that links to PayPal, shown in the sidebar (until user donates) and permanently in the Settings panel, with donation state tracked locally via a custom URL protocol.

**Architecture:** The PayPal donation URL is read from `src/renderer/config.ts`. A dev-time toggle controls visibility. Donation state is persisted in `settings.json` as `hasDonated: boolean`. When the user completes a PayPal payment, PayPal redirects to `whatevermail://payment-success`; Electron's custom protocol handler intercepts this deep link and flips `hasDonated: true`. The sidebar button disappears once donated; the Settings panel button stays forever.

**Tech Stack:** Electron (custom protocol), React (conditional rendering), existing `settings.ts` + `useSettings` hook, Tailwind CSS.

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/renderer/config.ts` | **Create** | `PAYPAL_DONATION_URL` constant + `SHOW_SUPPORT_BUTTON` dev toggle |
| `src/main/settings.ts` | **Modify** | Add `hasDonated: boolean` to `Settings` interface + default |
| `src/main/ipc/channels.ts` | **Modify** | Add `PAYMENT_SUCCESS` IPC channel |
| `src/main/ipc/handlers.ts` | **Modify** | Handle `PAYMENT_SUCCESS` → set `hasDonated: true` |
| `src/main/protocol.ts` | **Create** | Register `whatevermail://` protocol; parse `payment-success` path and fire IPC |
| `src/main/index.ts` | **Modify** | Call `registerProtocol()` on `app.whenReady()` |
| `src/preload/index.ts` | **Modify** | Expose `window.api.payment.markDonated()` and `window.api.shell.openExternal()` to renderer |
| `src/renderer/components/SupportButton.tsx` | **Create** | Reusable button component; opens URL in external browser via `shell.openExternal` |
| `src/renderer/components/Sidebar.tsx` | **Modify** | Render `<SupportButton>` above `<ThemePicker>` when not donated |
| `src/renderer/components/SettingsPanel.tsx` | **Modify** | Add permanent "Support my work" link at bottom of settings |

---

## Task 1: Add config constants

**Files:**
- Create: `src/renderer/config.ts`

- [ ] **Step 1: Create the config file**

```typescript
// src/renderer/config.ts

/** Set to false to hide the Support button everywhere (dev/testing override). */
export const SHOW_SUPPORT_BUTTON = true

/**
 * Your PayPal Donation URL.
 * Create at https://www.paypal.com/donate/buttons
 * Set the "Return URL" to whatevermail://payment-success
 * so Electron can intercept the completion.
 */
export const PAYPAL_DONATION_URL = 'https://www.paypal.com/ncp/payment/H9YRN48YJAR8E'
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/config.ts
git commit -m "feat: add PayPal config constants"
```

---

## Task 2: Extend settings with `hasDonated`

**Files:**
- Modify: `src/main/settings.ts`

- [ ] **Step 1: Read the current file**

Open `src/main/settings.ts` and confirm the `Settings` interface and `defaultSettings` object.

- [ ] **Step 2: Add `hasDonated` to the interface and defaults**

In `settings.ts`, add `hasDonated: boolean` to the `Settings` interface:

```typescript
interface Settings {
  smtpPort: number
  theme: 'ember' | 'midnight' | 'jade' | 'rose' | 'azure'
  windowBounds: { x: number; y: number; width: number; height: number } | null
  startAtLogin: boolean
  lastLoadedBundleId: string | null
  hasDonated: boolean   // ← add this
}
```

And add the default in `defaultSettings`:

```typescript
const defaultSettings: Settings = {
  smtpPort: 1025,
  theme: 'ember',
  windowBounds: null,
  startAtLogin: false,
  lastLoadedBundleId: null,
  hasDonated: false,   // ← add this
}
```

- [ ] **Step 3: Commit**

```bash
git add src/main/settings.ts
git commit -m "feat: add hasDonated to settings schema"
```

---

## Task 3: IPC channel for marking donation

**Files:**
- Modify: `src/main/ipc/channels.ts`
- Modify: `src/main/ipc/handlers.ts`
- Modify: `src/preload/index.ts`

- [ ] **Step 1: Add the channel constant**

In `channels.ts`, add:

```typescript
export const PAYMENT_SUCCESS = 'payment:success'
```

- [ ] **Step 2: Add the IPC handler**

In `handlers.ts`, register the handler (alongside existing settings handlers):

```typescript
ipcMain.handle(PAYMENT_SUCCESS, async () => {
  setSetting('hasDonated', true)
})
```

- [ ] **Step 3: Expose via preload**

In `preload/index.ts`, extend the exposed `window.api` object. Find the `contextBridge.exposeInMainWorld` call and add:

```typescript
payment: {
  markDonated: () => ipcRenderer.invoke(PAYMENT_SUCCESS),
},
```

- [ ] **Step 4: Extend the type declaration**

Find the `interface Window` / `ElectronAPI` type declaration (likely in `src/preload/index.d.ts` or inline) and add:

```typescript
payment: {
  markDonated: () => Promise<void>
}
```

- [ ] **Step 5: Commit**

```bash
git add src/main/ipc/channels.ts \
        src/main/ipc/handlers.ts \
        src/preload/index.ts
git commit -m "feat: add payment:success IPC channel"
```

---

## Task 4: Register custom URL protocol handler

**Files:**
- Create: `src/main/protocol.ts`
- Modify: `src/main/index.ts`
- Modify: `src/preload/index.ts`
- Modify: `src/renderer/hooks/useSettings.ts`
- Modify: `src/renderer/App.tsx`

- [ ] **Step 1: Create protocol.ts**

```typescript
// src/main/protocol.ts
import { app, BrowserWindow } from 'electron'
import { setSetting } from './settings'

const PROTOCOL = 'whatevermail'

export function registerProtocol(getWindow: () => BrowserWindow | null): void {
  if (!app.isDefaultProtocolClient(PROTOCOL)) {
    app.setAsDefaultProtocolClient(PROTOCOL)
  }

  // macOS / Linux: deep link arrives via 'open-url'
  app.on('open-url', (event, url) => {
    event.preventDefault()
    handleDeepLink(url, getWindow)
  })

  // Windows: deep link arrives as a second-instance argv
  app.on('second-instance', (_event, argv) => {
    const url = argv.find((arg) => arg.startsWith(`${PROTOCOL}://`))
    if (url) handleDeepLink(url, getWindow)
  })
}

function handleDeepLink(url: string, getWindow: () => BrowserWindow | null): void {
  const parsed = new URL(url)
  if (parsed.hostname === 'payment-success') {
    setSetting('hasDonated', true)
    const win = getWindow()
    win?.webContents.send('settings:invalidate')
  }
}
```

> **Note on Windows:** `setAsDefaultProtocolClient` requires the app to be packaged. During dev on Windows, test by calling `window.api.payment.markDonated()` in DevTools console.

> **PayPal note:** Set the "Return URL" in your PayPal donation button settings to `whatevermail://payment-success` so Electron intercepts the redirect after payment.

- [ ] **Step 2: Wire protocol into main/index.ts**

In `src/main/index.ts`, import and call `registerProtocol` before `app.whenReady()`:

```typescript
import { registerProtocol } from './protocol'

registerProtocol(() => mainWindow ?? null)
```

- [ ] **Step 3: Handle `settings:invalidate` in renderer**

In `src/renderer/hooks/useSettings.ts`, export a new `useSettingsSync` hook:

```typescript
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

export function useSettingsSync(): void {
  const queryClient = useQueryClient()
  useEffect(() => {
    const unsub = window.api.onSettingsInvalidate(() => {
      queryClient.invalidateQueries({ queryKey: ['setting'] })
    })
    return unsub
  }, [queryClient])
}
```

- [ ] **Step 4: Expose `onSettingsInvalidate` in preload**

In `preload/index.ts`, add:

```typescript
onSettingsInvalidate: (cb: () => void) => {
  const handler = () => cb()
  ipcRenderer.on('settings:invalidate', handler)
  return () => { ipcRenderer.removeListener('settings:invalidate', handler) }
},
```

Add to the type declaration:

```typescript
onSettingsInvalidate: (cb: () => void) => () => void
```

- [ ] **Step 5: Call `useSettingsSync()` in App.tsx**

In `src/renderer/App.tsx`, import and call once:

```tsx
import { useSettingsSync } from './hooks/useSettings'

export default function App(): React.JSX.Element {
  useSettingsSync()
  // ... rest of component
}
```

- [ ] **Step 6: Commit**

```bash
git add src/main/protocol.ts \
        src/main/index.ts \
        src/preload/index.ts \
        src/renderer/hooks/useSettings.ts \
        src/renderer/App.tsx
git commit -m "feat: register whatevermail:// protocol for payment callback"
```

---

## Task 5: SupportButton component

**Files:**
- Create: `src/renderer/components/SupportButton.tsx`
- Modify: `src/preload/index.ts`

- [ ] **Step 1: Expose shell.openExternal via preload**

In `preload/index.ts`, import `shell` and add:

```typescript
import { contextBridge, ipcRenderer, shell } from 'electron'

// Inside exposeInMainWorld:
shell: {
  openExternal: (url: string) => shell.openExternal(url),
},
```

Add to type declaration:
```typescript
shell: {
  openExternal: (url: string) => Promise<void>
}
```

- [ ] **Step 2: Create SupportButton.tsx**

```tsx
// src/renderer/components/SupportButton.tsx
import React from 'react'
import { PAYPAL_DONATION_URL } from '../config'

interface SupportButtonProps {
  variant?: 'sidebar' | 'settings'
}

export function SupportButton({ variant = 'sidebar' }: SupportButtonProps): React.JSX.Element {
  const handleClick = (): void => {
    window.api.shell.openExternal(PAYPAL_DONATION_URL)
  }

  if (variant === 'settings') {
    return (
      <button
        onClick={handleClick}
        className="w-full text-left text-sm text-accent hover:underline py-1"
      >
        ♥ Support my work →
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      className="w-full text-xs font-medium text-fg-2 hover:text-accent transition-colors py-2 px-3 rounded-md hover:bg-surface-2 text-left"
    >
      ♥ Support my work
    </button>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/renderer/components/SupportButton.tsx \
        src/preload/index.ts
git commit -m "feat: add SupportButton component"
```

---

## Task 6: Add button to Sidebar (above ThemePicker)

**Files:**
- Modify: `src/renderer/components/Sidebar.tsx`

- [ ] **Step 1: Read Sidebar.tsx** — confirm where `<ThemePicker />` is rendered.

- [ ] **Step 2: Add conditional SupportButton above ThemePicker**

Add imports at top of `Sidebar.tsx`:
```tsx
import { SHOW_SUPPORT_BUTTON } from '../config'
import { SupportButton } from './SupportButton'
import { useSetting } from '../hooks/useSettings'
```

Inside the component, read the setting and render conditionally above `<ThemePicker />`:
```tsx
const { value: hasDonated } = useSetting('hasDonated')

// In JSX, above <ThemePicker />:
{SHOW_SUPPORT_BUTTON && !hasDonated && (
  <div className="px-2 mb-2">
    <SupportButton variant="sidebar" />
  </div>
)}
```

- [ ] **Step 3: Verify**

Run: `npm run dev`
Expected: Sidebar shows "♥ Support my work" above the theme colour dots. No console errors.

- [ ] **Step 4: Commit**

```bash
git add src/renderer/components/Sidebar.tsx
git commit -m "feat: show Support button in sidebar when not donated"
```

---

## Task 7: Add permanent link to Settings panel

**Files:**
- Modify: `src/renderer/components/SettingsPanel.tsx`

- [ ] **Step 1: Read SettingsPanel.tsx** — find the closing tag of the settings form content.

- [ ] **Step 2: Add SupportButton at the bottom of settings**

Add imports:
```tsx
import { SHOW_SUPPORT_BUTTON } from '../config'
import { SupportButton } from './SupportButton'
```

At the bottom of the panel content (before the closing tag):
```tsx
{SHOW_SUPPORT_BUTTON && (
  <div className="mt-4 pt-4 border-t border-border">
    <SupportButton variant="settings" />
  </div>
)}
```

- [ ] **Step 3: Verify**

Run: `npm run dev`
Open Settings (gear icon). Expected: "♥ Support my work →" appears at the bottom. Clicking opens PayPal URL in default browser.

- [ ] **Step 4: Commit**

```bash
git add src/renderer/components/SettingsPanel.tsx
git commit -m "feat: add permanent Support link in Settings panel"
```

---

## Task 8: End-to-end verification

- [ ] **Step 1: Simulate donation**

In the running app, open DevTools console and run:
```javascript
await window.api.payment.markDonated()
```
Expected: Sidebar button disappears immediately. Settings button stays.

- [ ] **Step 2: Verify persistence**

Quit and relaunch. Expected: Sidebar button still gone.

- [ ] **Step 3: Reset for re-testing**

Edit `~/Library/Application Support/WhatEverMail/settings.json`, set `"hasDonated": false`, relaunch.

- [ ] **Step 4: Test dev toggle**

In `src/renderer/config.ts`, set `SHOW_SUPPORT_BUTTON = false`. Run dev. Expected: button absent everywhere. Revert to `true`.

- [ ] **Step 5: TypeScript check**

Run: `npm run typecheck`
Expected: No errors.

---

## PayPal Dashboard Setup (manual — outside codebase)

1. Go to **paypal.com/donate/buttons** → Create a donation button
2. Set preset amounts: 5, 10, 20
3. In **Return URL / Success URL**, set: `whatevermail://payment-success`
4. Copy the generated button URL into `src/renderer/config.ts` as `PAYPAL_DONATION_URL`

---

## Verification Checklist

- [ ] `SHOW_SUPPORT_BUTTON = false` hides button everywhere
- [ ] `hasDonated = false` → button visible in sidebar + settings
- [ ] `hasDonated = true` → button only in settings panel
- [ ] Button click opens PayPal URL in external browser
- [ ] `markDonated()` via DevTools console removes sidebar button immediately
- [ ] `hasDonated` persists across app restarts
- [ ] `npm run typecheck` passes with no errors
