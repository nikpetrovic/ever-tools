import { app } from 'electron'
import { join } from 'path'
import { appendFileSync, statSync, writeFileSync } from 'fs'

const LOG_MAX_BYTES = 500 * 1024 // 500 KB
let rotationChecked = false

function getLogPath(): string {
  return join(app.getPath('userData'), 'app.log')
}

function rotateLogIfNeeded(): void {
  if (rotationChecked) return
  rotationChecked = true
  try {
    const size = statSync(getLogPath()).size
    if (size > LOG_MAX_BYTES) {
      writeFileSync(getLogPath(), '', 'utf-8')
    }
  } catch {
    // File doesn't exist yet — nothing to rotate
  }
}

export function logError(context: string, error: unknown): void {
  rotateLogIfNeeded()
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
  rotateLogIfNeeded()
  const line = `[${new Date().toISOString()}] INFO  [${context}] ${message}\n`
  console.log(line)
  try {
    appendFileSync(getLogPath(), line, 'utf-8')
  } catch {
    // intentionally empty
  }
}
