import { app } from 'electron'
import type { BrowserWindow } from 'electron'
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
  try {
    const parsed = new URL(url)
    if (parsed.hostname === 'payment-success') {
      setSetting('hasDonated', true)
      getWindow()?.webContents.send('settings:invalidate')
    }
  } catch {
    // ignore malformed deep links
  }
}
