# 001 — what-ever-mail: Core Application

## Overview

A desktop developer tool for capturing and inspecting emails sent from local applications during development. Looks and feels like a real email client but runs entirely offline — no real emails are ever sent.

## Problem

Developers building apps with email notifications need a way to:
- Confirm emails are being sent (correct triggers)
- Verify email content (HTML rendering, variables substituted correctly)
- Check email metadata (headers, from/to, subject)

Current solutions (Ethereal, Mailtrap) are web-based SaaS with friction: accounts, rate limits, shared inboxes. A local desktop app removes all of that.

## Solution

Electron desktop app with:
- **Embedded SMTP server** — apps point their nodemailer/SMTP config at `localhost:1025`; all mail is captured, never forwarded
- **Email client UI** — three-panel layout (folders, inbox list, preview) that developers recognize instantly
- **Multi-view preview** — HTML render, plain text, raw source, headers
- **Persistent storage** — SQLite; emails survive app restarts

## Tech Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Desktop shell | Electron | Cross-platform (Win/macOS/Linux), Node.js built-in, familiar TS/React stack |
| SMTP server | `smtp-server` (npm) | Lightweight SMTP receiver, no relay |
| Email parsing | `mailparser` (npm) | Parses raw MIME into structured data |
| Storage | SQLite via `better-sqlite3` | Fast, zero-config, file-based |
| Frontend | React + TypeScript | Same as ever-admin |
| Styling | Tailwind CSS | Consistent with project conventions |
| Build | electron-builder | Cross-platform packaging |

## Features

### MVP (v1)

- [ ] **SMTP capture** — embedded server on configurable port (default: 1025)
- [ ] **Inbox list** — all captured emails: sender, subject, date, body preview snippet
- [ ] **Email preview** — tabs: HTML render / Plain text / Raw source / Headers
- [ ] **HTML sandbox render** — render HTML emails in an isolated iframe (no external requests)
- [ ] **Attachment list** — show attached file names and sizes (download not required for MVP)
- [ ] **Delete email** — single delete
- [ ] **Clear all** — wipe inbox
- [ ] **Search** — filter inbox by from/to/subject
- [ ] **System tray** — minimize to tray, show unread badge
- [ ] **SMTP status indicator** — green/red pill showing server is listening
- [ ] **Port config** — change SMTP port in settings, persists across restarts

### Post-MVP

- [ ] **Multiple inboxes** — separate captures by `To:` address or tag
- [ ] **Spam score preview** — run SpamAssassin-style heuristics on captured email
- [ ] **Link checker** — list all links in email, show which are broken
- [ ] **Dark/light mode toggle**
- [ ] **Export email** — save as .eml file
- [ ] **Resend** — forward captured email to a real address for device testing

## UI Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  ● ● ●   what-ever-mail          [SMTP :1025 ●]    [settings]  │
├──────────┬──────────────────────┬──────────────────────────────┤
│          │  [search...]         │                              │
│  Inbox   │ ─────────────────── │  From: noreply@ever-admin... │
│  (24)    │  noreply@ever-admin  │  To:   user@example.com      │
│          │  Workspace ready!    │  Subj: Your workspace is...  │
│  Trash   │  2 min ago           │                              │
│          │ ─────────────────── │  [HTML] [Text] [Source] [Hdrs]│
│          │  hello@acme.com      │ ─────────────────────────── │
│          │  Invoice #1042       │                              │
│          │  1 hr ago            │   <rendered HTML email>      │
│          │ ─────────────────── │                              │
│          │  ...                 │                              │
└──────────┴──────────────────────┴──────────────────────────────┘
```

## SMTP Integration

Apps connect to what-ever-mail by setting their SMTP config:

```env
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
# No auth required
```

Compatible with any nodemailer, sendmail, or SMTP-capable mailer — no code changes to the sending app beyond the env vars.

## Data Model

```
emails
  id          TEXT PRIMARY KEY  (uuid)
  message_id  TEXT
  from        TEXT
  to          TEXT              (JSON array)
  cc          TEXT              (JSON array)
  subject     TEXT
  date        TEXT              (ISO 8601)
  html        TEXT
  text        TEXT
  raw         TEXT              (full MIME source)
  headers     TEXT              (JSON object)
  attachments TEXT              (JSON array of {name, size, mime})
  read        INTEGER           (0/1)
  created_at  TEXT
```

## Non-goals

- **No real email delivery** — this is a capture tool only; never relay to external SMTP
- **No mobile** — desktop only
- **No multi-user** — single developer, local machine
- **No cloud sync** — everything stays on-device
