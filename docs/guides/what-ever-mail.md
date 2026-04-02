# what-ever-mail Guide

App-specific instructions for building and shipping what-ever-mail.

---

## Shipping With State (Ad-hoc)

> **Non-default, ad-hoc only.** Use when you want to ship the app pre-loaded with specific emails already in the database.
> Default seed data location TBD — will be prepared separately.

### Trigger phrases

When the user says **"ship with state"**, **"ship with current"**, or similar:

1. **Export the live DB** — the runtime DB lives at:
   ```
   ~/Library/Application Support/WhatEver Mail/emails.db
   ```

2. **Mark all emails as unread** in the exported copy:
   ```bash
   sqlite3 /path/to/emails.db "UPDATE emails SET is_read = 0;"
   ```

3. **Place the DB in resources** so electron-builder bundles it:
   ```
   repos/what-ever-mail/resources/seed.db
   ```

4. **Wire up the app** to copy `seed.db` → `emails.db` on first launch if no DB exists yet (main process, before DB init).

5. **Build normally**:
   ```bash
   npm run package:mac:arm
   ```

6. **After shipping**, remove `resources/seed.db` to restore default (empty) behavior for future builds — unless it becomes the new default.

### Notes

- All emails must be marked unread before bundling (step 2).
- Do not commit `resources/seed.db` to git unless it is intentional default seed data.
- This process will be automated/formalized once the default seed data location is decided.
