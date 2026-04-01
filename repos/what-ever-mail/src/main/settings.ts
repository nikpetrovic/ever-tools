import { app } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'

interface Settings {
  smtpPort: number
  theme: 'ember' | 'midnight' | 'jade' | 'rose' | 'azure'
  windowBounds: { x: number; y: number; width: number; height: number } | null
  startAtLogin: boolean
}

const defaults: Settings = {
  smtpPort: 1025,
  theme: 'ember',
  windowBounds: null,
  startAtLogin: false,
}

function getSettingsPath(): string {
  return join(app.getPath('userData'), 'settings.json')
}

function loadSettings(): Settings {
  const path = getSettingsPath()
  if (!existsSync(path)) return { ...defaults }
  try {
    return { ...defaults, ...JSON.parse(readFileSync(path, 'utf-8')) } as Settings
  } catch {
    return { ...defaults }
  }
}

function saveSettings(settings: Settings): void {
  const path = getSettingsPath()
  const dir = join(path, '..')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(path, JSON.stringify(settings, null, 2), 'utf-8')
}

export function getSetting<K extends keyof Settings>(key: K): Settings[K] {
  return loadSettings()[key]
}

export function setSetting<K extends keyof Settings>(key: K, value: Settings[K]): void {
  const settings = loadSettings()
  const updated = { ...settings, [key]: value }
  saveSettings(updated)
}
