# 001 — what-ever-mail Core: Implementation Plan

Companion to `001-what-ever-mail-core.md`. Step-by-step tasks to build the MVP.

---

## Phase 0 — Project Bootstrap ✅

- [x] Scaffold with `electron-vite` + React + TypeScript
  - Used manual scaffold (not `npm create`) with `electron-vite` v2.3, React 18, TypeScript 5.5
- [x] Add Tailwind CSS (`tailwindcss`, `postcss`, `autoprefixer`)
- [x] Add `@radix-ui/react-tabs`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-dialog`, `@radix-ui/react-switch`
- [x] Add main process deps: `smtp-server` **v3.x** (v5.x does not exist on npm), `mailparser`, `better-sqlite3`, `uuid`
  - **Note:** `electron-store` v10.x is ESM-only; replaced with a plain JSON file approach in `settings.ts`
- [x] Add dev types: `@types/better-sqlite3`, `@types/mailparser`, `@types/smtp-server`, `@types/uuid`, `@types/dompurify`
- [x] Create `src/renderer/styles/globals.css` — system color scheme variables (surfaces, text, border, shadow)
- [x] Create `src/renderer/styles/themes.css` — 5 themes (ember/midnight/jade/rose/azure) controlling only accent tokens
- [x] Add `resources/.gitkeep` placeholder (icon images to be added before packaging)
- [x] Configure `electron-builder.yml` for macOS dmg, Windows NSIS, Linux AppImage
- [x] `tsconfig.node.json` + `tsconfig.web.json` — inline compiler options (no `@electron-toolkit/tsconfig` needed)

---

## Phase 1 — Main Process: SMTP + DB ✅

- [x] **Database setup** (`src/main/db/`)
  - [x] `index.ts` — open/create `emails.db` via `app.getPath('userData')`, WAL mode, runs migrations
  - [x] `schema.ts` — `CREATE TABLE IF NOT EXISTS emails (...)` with all columns; JSON-serialised arrays
  - [x] `emails.ts` — `insertEmail`, `listEmails`, `getEmail`, `deleteEmail`, `clearEmails`, `markRead`

- [x] **SMTP server** (`src/main/smtp/`)
  - [x] `parser.ts` — wraps `mailparser.simpleParser()`, maps to `EmailRecord`
  - [x] `server.ts` — `SMTPServer` on 127.0.0.1, `onData` → parse → insert → push `emails:new` to renderer

- [x] **Settings** (`src/main/settings.ts`)
  - [x] Plain JSON file in `userData/settings.json`; typed getters/setters for `smtpPort`, `theme`, `windowBounds`, `startAtLogin`
  - **Note:** `electron-store` was skipped due to ESM-only constraint

- [x] **IPC handlers** (`src/main/ipc/handlers.ts`)
  - [x] All channels: emails CRUD, settings get/set, smtp status, smtp restart, tray badge

- [x] **App entry** (`src/main/index.ts`)
  - [x] `hiddenInset` title bar on macOS, standard on others
  - [x] SMTP server started on app ready; window bounds saved/restored
  - [x] Minimise to tray on macOS close; quit cleans up server + DB

---

## Phase 2 — Preload Bridge ✅

- [x] `src/preload/index.ts` — exposes typed `window.api` via `contextBridge`:
  ```ts
  window.api = {
    emails: { list, get, delete, clear, markRead, onNew },
    settings: { get, set },
    smtp: { getStatus, restart },
    tray: { setBadge }
  }
  ```
- [x] `src/renderer/types/api.d.ts` — `declare global { interface Window { api: ... } }` with full type signatures

---

## Phase 3 — Renderer: Layout + Navigation ✅

- [x] `App.tsx` — three-column layout: Sidebar + EmailList + Preview, wrapped in `QueryClientProvider`
- [x] `TitleBar.tsx` — `hiddenInset`-safe padding on macOS, wordmark, SMTP pill (auto-refreshes every 5s), theme picker, settings icon
- [x] `StatusBar.tsx` — SMTP status dot + port, email count
- [x] `Sidebar.tsx` — Inbox/Trash nav with unread badge; `NavButton` handles active/hover states via CSS vars
- [x] `ThemePicker.tsx` — 5 dot buttons; sets `data-theme` attribute on `documentElement`; persists to settings

---

## Phase 4 — Renderer: Email List ✅

- [x] `useEmails.ts` — `useQuery` + `onNew` listener; also exports `useDeleteEmail`, `useClearEmails`, `useMarkRead`
- [x] `useEmailDetail.ts` — per-email query (enabled only when id != null)
- [x] `useSettings.ts` — generic `useSetting<T>(key)` hook
- [x] `EmailList.tsx` — filters by search + navItem, shows empty state with SMTP snippet
- [x] `EmailRow.tsx` — avatar with hash-based color (gradient on selected), unread bold + dot, time formatting
- [x] `SearchBox.tsx` — with clear button

---

## Phase 5 — Renderer: Email Preview ✅

- [x] `Preview.tsx` — null state + tab switching; auto-falls back to text/source if no HTML
- [x] `PreviewHeader.tsx` — subject, from/to/cc/date grid, tab bar with accent underline, delete button
- [x] `HtmlView.tsx` — DOMPurify sanitise → iframe `sandbox="allow-same-origin"` + CSP blocks all external resources
- [x] `TextView.tsx` — IBM Plex Mono, `pre-wrap`
- [x] `SourceView.tsx` — raw MIME in monospace
- [x] `HeadersView.tsx` — sorted key/value table with accent-colored keys

---

## Phase 6 — System Tray ✅

- [x] `src/main/tray.ts` — loads icon from `resources/icon.png`; context menu: Show/Hide + Quit; click to show
- [x] `updateTrayBadge` — sets macOS dock badge + tray tooltip unread count
- [x] Tray IPC channel `tray:badge` wired through handlers and preload
- [x] Minimise to tray on macOS window close

---

## Phase 7 — Settings Panel ✅

- [x] `SettingsPanel.tsx` — modal overlay; SMTP port input + restart button; clear all emails
- [x] Accessible via gear icon in TitleBar
- [x] SMTP restart wired: persists port to settings + calls `smtp:restart` IPC

---

## Phase 8 — Polish & Build

- [x] Window state persistence (`windowBounds` saved on close, restored on open)
- [x] Empty state UI — inbox empty state shows SMTP connection snippet
- [ ] Error state (SMTP port in use — toast/alert)
- [ ] Keyboard shortcuts: `⌘K`/`Ctrl+K` focus search, `↑↓` navigate list, `Del` delete
- [x] Security: `contextIsolation: true`, `nodeIntegration: false`, CSP in index.html + iframe
- [ ] `electron-builder` test builds for macOS + Windows
- [ ] Add real app icon (`resources/icon.png/ico/icns`)
- [ ] Write `README.md` in repo root

---

## Definition of Done (MVP)

- App starts, SMTP server is live on :1025 within 2s of launch
- Send an email via nodemailer to localhost:1025 → appears in inbox within 1s
- HTML email renders correctly in preview iframe (no external requests)
- Selecting an email marks it read; unread count updates in sidebar and tray
- Deleting an email removes it from list; Clear all wipes inbox
- Settings: changing SMTP port restarts server and persists on next launch
- Theme picker switches accent color across entire UI instantly
- OS dark/light toggle changes surfaces without touching selected theme
- Builds successfully on macOS (dmg) and Windows (exe)
