# ever-tools

Internal tooling and utilities for the Eversoft platform.

## Getting started

See individual tool READMEs inside `repos/` for setup instructions.

---

## what-ever-mail

Local SMTP capture tool for testing emails during development.

### Start

```bash
cd repos/what-ever-mail
npm install
npm run dev
```

The app opens with hot-reload. The SMTP server starts automatically on port **1025**.

### Send a test email

```bash
curl -s --url "smtp://localhost:1025" \
  --mail-from "test@example.com" \
  --mail-rcpt "you@example.com" \
  --upload-file - <<EOF
From: Test Sender <test@example.com>
To: you@example.com
Subject: Hello from what-ever-mail
Content-Type: text/html

<h1>It works!</h1><p>This is a test email.</p>
EOF
```

Or with nodemailer:

```js
const transporter = nodemailer.createTransport({ host: 'localhost', port: 1025, secure: false });
await transporter.sendMail({ from: 'dev@test.com', to: 'you@app.com', subject: 'Test', html: '<b>Hello!</b>' });
```

### Point your app at it

```env
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
```

No username or password required.

---

### Release notes emails

On first launch after install or update, the app automatically shows release notes as emails in the inbox. These emails are bundled into the app at build time from files in `resources/release-notes/`.

#### How it works

1. HTML or plain-text email files live in `resources/release-notes/` — named `NNN-slug.html` or `NNN-slug.txt` (e.g. `001-welcome.html`, `002-new-features.txt`)
2. `resources/release-notes/email-meta.yml` defines the sender, recipient, and subject used for all release note emails:
   ```yaml
   from: team@whatever-mail.com
   to: valueable-customer@you-are-awesome.com
   subject: Hello from WhatEver Mail!
   ```
3. At build time, `npm run release-notes:bundle` reads these files and writes `build/release-notes-bundle.json`, which is then embedded in the app package
4. On first launch after a version change, the app loads the bundle and injects all emails into the local inbox

#### Adding release notes for a new version

1. Create a folder `resources/release-notes-<version>/` (e.g. `resources/release-notes-0.2.0/`) with the email files and an `email-meta.yml`
2. Copy or symlink it to `resources/release-notes/` before building — the bundle script always reads from `resources/release-notes/`
3. Build as normal (the bundle step runs automatically as part of every `package:*` script)

To test release notes locally without building a package:

```bash
cd repos/what-ever-mail
npm run release-notes:bundle   # generates build/release-notes-bundle.json
npm run dev                    # run the app — on next launch it will show the emails
```

---

### Building distributables

All `package:*` scripts automatically:
1. Bundle the release notes (`release-notes:bundle`)
2. Compile the app (`build`)
3. Run electron-builder for the target platform
4. Clean up the temporary bundle file (`release-notes:cleanup`)

Run all commands from `repos/what-ever-mail/`.

#### macOS

```bash
# Apple Silicon (M-series)
npm run package:mac:arm

# Intel
npm run package:mac:intel

# Universal binary (works on both — larger file)
npm run package:mac:universal
```

Output: `dist/` — produces both a `.dmg` installer and a `.zip` archive per architecture.

> **Note:** Code signing and notarization are disabled (`notarize: false`). Distribute signed builds through your own Apple Developer account if needed.

#### Windows

```bash
npm run package:win
```

Output: `dist/` — produces an NSIS installer (`*-setup.exe`) and a `.zip` archive, both x64.

> **Note:** Must be run on Windows or via a Windows cross-compilation environment. The NSIS installer creates a desktop shortcut automatically.

#### Linux

```bash
npm run package:linux
```

Output: `dist/` — produces an `.AppImage` and a `.deb` package, both x64.

#### Default (current platform)

```bash
npm run package
```

Builds for whatever platform you are currently on using electron-builder defaults.

---

## Repository structure

```
docs/       ← project documentation, guides, and feature specs
repos/      ← tool repositories (cloned separately)
templates/  ← shared templates (emails, etc.)
```
