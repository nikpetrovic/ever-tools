# Enhancement: Gatekeeper FAQ + download.html macOS note update

## Context

macOS blocks unsigned apps with Gatekeeper. The current workaround note ("right-click → Open") is incomplete — users who already dismissed the dialog need the `xattr` command to remove the quarantine flag. Adding a proper FAQ entry and linking to it from the download page gives users a clear, discoverable fix.

## Changes

### 1. `website/docs.html` — Add FAQ item (faq7)

Add a new accordion item after `faq6` inside `#faq .faq-list`:

**Question:** macOS says the app is damaged or from an unidentified developer — how do I fix it?

**Body:**
- Explain Gatekeeper quarantine flag set on downloaded files
- Right-click → Open workaround (quick tip for first-time block)
- Terminal command to fully remove the quarantine flag:
  ```
  xattr -r -d com.apple.quarantine /Applications/WhatEver\ Mail.app
  ```
- Note: replace path with actual location if not installed in `/Applications`

### 2. `website/download.html` — Update macOS `platform-note`

Replace current text:
> On first launch, right-click → Open if Gatekeeper blocks it.

With:
> If Gatekeeper blocks the app, <a href="docs.html#faq7">remove the quarantine flag</a>.

### 3. Mirror both changes to `resources/presentation/` sources

- `resources/presentation/docs.html` — same FAQ addition
- `resources/presentation/download.html` — same note update

## Files to Modify

| File | Change |
|------|--------|
| `website/docs.html` | Add `faq7` Gatekeeper accordion item |
| `website/download.html` | Update macOS `platform-note` with link to `docs.html#faq7` |
| `resources/presentation/docs.html` | Same FAQ addition |
| `resources/presentation/download.html` | Same note update |

## Verification

1. Open `docs.html#faq` — new "macOS says damaged…" item appears as `faq7`
2. Click it — expands with `xattr` command and explanation
3. Open `download.html` — macOS card note reads "If Gatekeeper blocks the app, remove the quarantine flag" with working link
4. Click the link — navigates to `docs.html#faq7`
