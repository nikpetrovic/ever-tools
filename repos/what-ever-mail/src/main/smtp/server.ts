import { SMTPServer } from 'smtp-server'
import type { BrowserWindow } from 'electron'
import { parseRawEmail } from './parser'
import { insertEmail } from '../db/emails'
import { IPC } from '../ipc/channels'

let smtpServer: SMTPServer | null = null
let currentPort = 1025
let currentHost = '127.0.0.1'
let isRunning = false
let lastError: string | null = null

export function startSmtpServer(port: number, host: string, mainWindow: BrowserWindow): void {
  if (smtpServer) {
    stopSmtpServer()
  }

  currentPort = port
  currentHost = host
  lastError = null

  smtpServer = new SMTPServer({
    authOptional: true,
    allowInsecureAuth: true,
    disabledCommands: ['STARTTLS'],
    onData(stream, _session, callback) {
      const chunks: Buffer[] = []
      stream.on('data', (chunk: Buffer) => chunks.push(chunk))
      stream.on('end', () => {
        const raw = Buffer.concat(chunks)
        parseRawEmail(raw)
          .then((email) => {
            insertEmail(email)
            if (!mainWindow.isDestroyed()) {
              mainWindow.webContents.send(IPC.NEW_EMAIL, email)
            }
            callback()
          })
          .catch((err: unknown) => {
            console.error('Failed to parse email:', err)
            callback()
          })
      })
    },
    onError(err) {
      console.error('SMTP server error:', err)
    },
  })

  smtpServer.listen(port, host, () => {
    isRunning = true
    lastError = null
    console.log(`SMTP server listening on ${host}:${port}`)
  })

  smtpServer.on('error', (err) => {
    isRunning = false
    lastError = err.message
    console.error('SMTP server failed to start:', err)
  })
}

export function stopSmtpServer(): void {
  if (smtpServer) {
    smtpServer.close(() => {
      isRunning = false
    })
    smtpServer = null
  }
}

export function restartSmtpServer(port: number, host: string, mainWindow: BrowserWindow): void {
  startSmtpServer(port, host, mainWindow)
}

export function getSmtpStatus(): { running: boolean; port: number; host: string; error: string | null } {
  return { running: isRunning, port: currentPort, host: currentHost, error: lastError }
}
