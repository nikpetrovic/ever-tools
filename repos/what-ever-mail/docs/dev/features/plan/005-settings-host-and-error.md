# Feature: Settings Modal — Host Address + Error Display

## Context

The SMTP server is hardcoded to bind on `127.0.0.1`. Users running apps on other devices (mobile, VM, LAN) cannot reach it. A configurable host field lets them bind to `0.0.0.0` or a specific interface.

When start fails (port in use, permission denied), the UI only shows "STOPPED" with no explanation. A dedicated error area surfacing the actual error message fixes this.

The modal is also widened (400px → 480px) to comfortably fit the second input row.

## Files to Modify

| File | Change |
|------|--------|
| `src/main/settings.ts` | Add `smtpHost: string` field, default `'127.0.0.1'` |
| `src/main/smtp/server.ts` | Accept `host` param, store `currentHost` + `lastError`, expose in `getSmtpStatus()` |
| `src/main/ipc/handlers.ts` | Read `smtpHost` from settings, pass to `restartSmtpServer`; add 300ms delay before return to let async error event fire |
| `src/preload/index.ts` | Update `smtp.restart(port, host)` signature; add `error: string \| null` to `getStatus` return type |
| `src/renderer/components/SettingsPanel.tsx` | Wider modal, host input row, error display below action buttons |

## Implementation Notes

**Error propagation:** `server.on('error')` fires asynchronously after `listen()` returns. Store in module-level `lastError`. The IPC handler waits 300ms before returning so the renderer reads status after the error has been captured.

**`getSmtpStatus()` return shape:**
```ts
{ running: boolean; port: number; host: string; error: string | null }
```

**Error display in modal:**
- Shown below action buttons only when `smtpError` is set
- Cleared when restart succeeds (`status.running === true`)
- Example: `⚠ Could not start: address already in use :::1025`

## Verification

1. Open Settings — host field shows `127.0.0.1`, modal is wider
2. Change host to `0.0.0.0`, Restart — status shows LISTENING
3. Block the port, Restart — error message appears below buttons
4. Unblock port, Restart — error clears, status shows LISTENING
