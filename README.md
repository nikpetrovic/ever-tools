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

## Repository structure

```
docs/       ← project documentation, guides, and feature specs
repos/      ← tool repositories (cloned separately)
templates/  ← shared templates (emails, etc.)
```
