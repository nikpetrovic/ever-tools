# Windows CI Build + Log Rotation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a GitHub Actions workflow that builds the Windows installer on a `windows-latest` runner (fixing the native `better-sqlite3` cross-compilation issue), and cap `app.log` at 500 KB on startup so it never grows unbounded.

**Architecture:**
The Windows build workflow runs on `windows-latest` where Visual Studio Build Tools are pre-installed, so `electron-rebuild` can recompile `better-sqlite3` against Electron's Node version natively. Log rotation is a one-time truncation in `logger.ts` at app startup — if the file exceeds 500 KB it is cleared before new entries are appended.

**Tech Stack:** GitHub Actions, electron-builder, electron-rebuild, Node.js 20, TypeScript, Node.js `fs`

---

## Files

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `.github/workflows/build-windows.yml` | CI workflow: install → rebuild native addons → package:win → upload artifacts |
| Modify | `repos/what-ever-mail/src/main/logger.ts` | Truncate `app.log` if > 500 KB before first write |

---

## Task 1: Log rotation in logger.ts

**Files:**
- Modify: `repos/what-ever-mail/src/main/logger.ts`

Add a `rotateLogIfNeeded()` function that truncates `app.log` when it exceeds 500 KB, called once before the first `appendFileSync`. Use a module-level flag so the check runs only once per process.

- [ ] **Step 1: Update `src/main/logger.ts`**

Replace the entire file content with:

```typescript
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd repos/what-ever-mail
npx tsc -p tsconfig.node.json --noEmit 2>&1 | grep logger
```

Expected: no output (no errors for logger.ts).

- [ ] **Step 3: Commit**

```bash
git add repos/what-ever-mail/src/main/logger.ts
git commit -m "chore: rotate app.log at 500 KB to prevent unbounded growth"
```

---

## Task 2: GitHub Actions Windows build workflow

**Files:**
- Create: `.github/workflows/build-windows.yml`

The workflow:
- Triggers on `workflow_dispatch` (manual) and on push of version tags (`v*`)
- Runs on `windows-latest`
- Uses Node 20 LTS
- Runs `npm run rebuild` to recompile `better-sqlite3` against Electron 31's Node version
- Runs `npm run package:win` which already calls `release-notes:bundle` internally
- Uploads the NSIS installer and zip as workflow artifacts

**Note on `npmRebuild: false` in electron-builder.yml:** This flag is correct and must stay `false`. It prevents electron-builder from running its own rebuild (which would fail in CI because it uses a different approach). We handle the rebuild explicitly via `npm run rebuild` before packaging.

- [ ] **Step 1: Create `.github/workflows/build-windows.yml`**

The file lives at the repo root (not inside `repos/what-ever-mail/`):

```yaml
name: Build Windows

on:
  workflow_dispatch:
  push:
    tags:
      - 'v*'

jobs:
  build-windows:
    runs-on: windows-latest

    defaults:
      run:
        working-directory: repos/what-ever-mail

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: repos/what-ever-mail/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Rebuild native addons for Electron
        run: npm run rebuild

      - name: Package for Windows
        run: npm run package:win

      - name: Upload installer artifact
        uses: actions/upload-artifact@v4
        with:
          name: what-ever-mail-windows-installer
          path: repos/what-ever-mail/dist/*.exe
          if-no-files-found: error

      - name: Upload zip artifact
        uses: actions/upload-artifact@v4
        with:
          name: what-ever-mail-windows-zip
          path: repos/what-ever-mail/dist/*.zip
          if-no-files-found: error
```

- [ ] **Step 2: Verify the workflow file is valid YAML**

```bash
node -e "require('js-yaml').load(require('fs').readFileSync('.github/workflows/build-windows.yml','utf8')); console.log('YAML valid')" 2>/dev/null || python3 -c "import yaml,sys; yaml.safe_load(open('.github/workflows/build-windows.yml')); print('YAML valid')"
```

Expected: `YAML valid`

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/build-windows.yml
git commit -m "chore: add GitHub Actions workflow for Windows build"
```

---

## How to use after merging

**Manual trigger:**
1. Go to the repository on GitHub
2. Actions tab → "Build Windows" → "Run workflow"
3. When complete, download artifacts from the workflow run summary

**Automatic trigger:**
Push a tag: `git tag v0.2.1 && git push origin v0.2.1` — the workflow fires automatically.

**Finding the build output:**
Artifacts are available for 90 days (GitHub default). Download and run the `.exe` installer on Windows.
