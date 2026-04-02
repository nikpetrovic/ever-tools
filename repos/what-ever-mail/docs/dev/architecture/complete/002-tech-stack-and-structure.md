# 002 — Tech Stack & Project Structure

## Decision

Build what-ever-mail as an **Electron** desktop application with a React/TypeScript renderer.

### Why Electron over alternatives

| Option | Decision | Reason |
|--------|----------|--------|
| Electron | ✅ Chosen | Node.js built-in — Nodemailer, SMTP server, SQLite run natively in main process. Same TS/React stack as ever-admin. Fastest path to working app. |
| Tauri | ⬜ Later option | Smaller bundle, better perf — but requires Rust for any native logic. Adds language overhead not justified for an internal dev tool. Revisit for v2 if bundle size matters. |
| Java Swing | ❌ Rejected | Poor styling capabilities, dated ecosystem, no Node.js integration. |
| Electron + Vite | ✅ Used | electron-vite replaces CRA for fast HMR during development. |

---

## Package Stack

### Main Process (Node.js)

| Package | Version | Purpose |
|---------|---------|---------|
| `smtp-server` | ^5.x | Embedded SMTP receiver — listens on :1025, captures all mail |
| `mailparser` | ^3.x | Parses raw MIME messages into structured objects (from/to/html/text/attachments) |
| `better-sqlite3` | ^9.x | Synchronous SQLite — stores all captured emails, survives app restarts |
| `electron-store` | ^10.x | Persistent settings (selected port, theme, window size) |
| `uuid` | ^10.x | Email record IDs |

### Renderer (React)

| Package | Purpose |
|---------|---------|
| `react` + `react-dom` | UI |
| `typescript` | Type safety |
| `tailwindcss` | Utility-first styling |
| `@radix-ui/react-*` | Accessible primitives (tabs, dropdown, dialog) |
| `react-query` | IPC data fetching + cache invalidation when new emails arrive |
| `dompurify` | Sanitise HTML email content before rendering in iframe sandbox |

### Build / Tooling

| Package | Purpose |
|---------|---------|
| `electron-vite` | Fast dev server with HMR for renderer |
| `electron-builder` | Cross-platform packaging (dmg, exe, AppImage) |
| `electron-updater` | Auto-update via GitHub Releases (post-MVP) |

---

## Project Structure

```
what-ever-mail/
├── package.json
├── electron.vite.config.ts
├── electron-builder.yml
│
├── src/
│   ├── main/                    ← Electron main process (Node.js)
│   │   ├── index.ts             ← App entry, BrowserWindow setup
│   │   ├── smtp/
│   │   │   ├── server.ts        ← smtp-server instance, lifecycle
│   │   │   └── parser.ts        ← mailparser wrapper → EmailRecord
│   │   ├── db/
│   │   │   ├── index.ts         ← better-sqlite3 connection + migrations
│   │   │   ├── schema.ts        ← table definitions (typed)
│   │   │   └── emails.ts        ← CRUD: insert, list, get, delete, clear
│   │   ├── ipc/
│   │   │   ├── handlers.ts      ← ipcMain.handle() registrations
│   │   │   └── channels.ts      ← channel name constants (shared)
│   │   ├── tray.ts              ← System tray icon + badge
│   │   └── settings.ts          ← electron-store wrapper
│   │
│   ├── preload/
│   │   └── index.ts             ← contextBridge — exposes typed IPC API to renderer
│   │
│   └── renderer/                ← React app
│       ├── index.html
│       ├── main.tsx             ← React root
│       ├── App.tsx              ← Layout: Sidebar + EmailList + Preview
│       │
│       ├── components/
│       │   ├── Sidebar.tsx
│       │   ├── EmailList/
│       │   │   ├── EmailList.tsx
│       │   │   ├── EmailRow.tsx
│       │   │   └── SearchBox.tsx
│       │   ├── Preview/
│       │   │   ├── Preview.tsx
│       │   │   ├── PreviewHeader.tsx
│       │   │   ├── HtmlView.tsx       ← sandboxed iframe render
│       │   │   ├── TextView.tsx
│       │   │   ├── SourceView.tsx
│       │   │   └── HeadersView.tsx
│       │   ├── TitleBar.tsx
│       │   ├── StatusBar.tsx
│       │   └── ThemePicker.tsx
│       │
│       ├── hooks/
│       │   ├── useEmails.ts          ← react-query + IPC polling
│       │   ├── useEmailDetail.ts
│       │   └── useSettings.ts
│       │
│       ├── store/
│       │   └── ui.ts                 ← local UI state (selected email, active tab)
│       │
│       ├── styles/
│       │   ├── globals.css           ← Tailwind base + CSS variable definitions
│       │   └── themes.css            ← [data-theme] blocks (ember/midnight/jade/rose/azure)
│       │
│       └── types/
│           └── email.ts              ← EmailRecord, Attachment, etc.
│
├── resources/
│   ├── icon.icns                ← macOS
│   ├── icon.ico                 ← Windows
│   └── icon.png                 ← Linux
│
└── docs/dev/                    ← dev docs (this folder)
```

---

## IPC Architecture

The renderer never touches Node.js APIs directly. All data flows through a typed IPC bridge.

### Channels

```ts
// src/main/ipc/channels.ts  (imported by both main and preload)
export const IPC = {
  EMAILS_LIST:   'emails:list',
  EMAILS_GET:    'emails:get',
  EMAILS_DELETE: 'emails:delete',
  EMAILS_CLEAR:  'emails:clear',
  EMAILS_MARK_READ: 'emails:markRead',
  SETTINGS_GET:  'settings:get',
  SETTINGS_SET:  'settings:set',
  SMTP_STATUS:   'smtp:status',
  NEW_EMAIL:     'emails:new',   // main → renderer push event
} as const;
```

### Flow

```
Renderer (React)
  → window.api.emails.list()        [invoke]
  → preload contextBridge
  → ipcMain.handle('emails:list')
  → db/emails.ts → SQLite
  → returns EmailRecord[]

SMTP server receives mail
  → parser.ts → EmailRecord
  → db/emails.ts.insert()
  → mainWindow.webContents.send('emails:new', record)  [push]
  → renderer invalidates react-query cache → re-renders list
```

---

## Theme System

CSS variables only — no JS at runtime for theming.

```
src/renderer/styles/
  globals.css   — defines --bg-*, --text-*, --border-* per prefers-color-scheme
  themes.css    — defines --accent, --accent-soft, --tint-1 per [data-theme]
```

`document.documentElement.setAttribute('data-theme', theme)` is the only JS needed to switch themes. Settings persisted via `electron-store`.

Text/surface colors are **never** part of a theme — they are always set by `prefers-color-scheme`. This means the OS dark/light toggle works regardless of selected theme.

---

## Data Model

```ts
// src/renderer/types/email.ts
export interface EmailRecord {
  id:          string;         // uuid
  messageId:   string | null;
  from:        string;         // "Name <addr>" raw string
  to:          string[];       // parsed addresses
  cc:          string[];
  subject:     string;
  date:        string;         // ISO 8601
  html:        string | null;
  text:        string | null;
  raw:         string;         // full MIME source
  headers:     Record<string, string>;
  attachments: Attachment[];
  read:        boolean;
  createdAt:   string;
}

export interface Attachment {
  filename: string;
  size:     number;
  mimeType: string;
}
```

---

## SMTP Integration for App Developers

Apps connect by pointing their mailer at localhost:

```env
# .env (any app using nodemailer or any SMTP mailer)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
# No username/password needed
```

```ts
// nodemailer example
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  tls: { rejectUnauthorized: false }
});
```

No code changes to sending apps beyond env vars — works with any nodemailer, NestJS mailer module, PHPMailer, Django, Rails, etc.

---

## Build Targets

| Platform | Output | Notes |
|----------|--------|-------|
| macOS | `.dmg` (Universal) | arm64 + x64 in one binary |
| Windows | `.exe` (NSIS installer) | |
| Linux | `.AppImage` | Portable, no install needed |

Built via `electron-builder` using GitHub Actions (post-MVP).
