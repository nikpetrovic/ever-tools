import { SMTPServer } from 'smtp-server'
import type { BrowserWindow } from 'electron'
import { parseRawEmail } from './parser'
import { insertEmail } from '../db/emails'
import { IPC } from '../ipc/channels'

let smtpServer: SMTPServer | null = null
let currentPort = 1025
let isRunning = false

export function startSmtpServer(port: number, mainWindow: BrowserWindow): void {
  if (smtpServer) {
    stopSmtpServer()
  }

  currentPort = port

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

  smtpServer.listen(port, '127.0.0.1', () => {
    isRunning = true
    console.log(`SMTP server listening on port ${port}`)
  })

  smtpServer.on('error', (err) => {
    isRunning = false
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

export function restartSmtpServer(port: number, mainWindow: BrowserWindow): void {
  startSmtpServer(port, mainWindow)
}

export function getSmtpStatus(): { running: boolean; port: number } {
  return { running: isRunning, port: currentPort }
}
