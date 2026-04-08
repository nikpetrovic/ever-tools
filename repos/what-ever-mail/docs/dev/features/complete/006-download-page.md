# Feature: Dedicated Download Page

## Summary

A dedicated download page (`download.html`) that gives users a clear, polished destination for downloading WhatEver Mail across all platforms and formats. Previously, downloads were buried inside `docs.html` via three platform cards pointing directly to binary URLs.

## Motivation

- Single entry point for all download options
- Support for multiple formats per platform (Universal/Silicon/Intel on macOS, Installer/Zip on Windows, AppImage/Deb on Linux)
- Cleaner user journey: "Get it free" → one page → pick your format
- Platform cards in docs.html now navigate to this page instead of triggering direct downloads

## Entry Points

| Source | Change |
|--------|--------|
| `index.html` hero section | Added `⬇ Get it free` button after `.hero-badges` |
| `index.html` CTA section | Changed `⬇ Get it free — macOS` → `⬇ Get it free` pointing to `download.html` |
| `docs.html` platform cards | All 3 cards now link to `download.html` instead of direct binary URLs |

## Page Structure

1. **Sticky nav** — logo + links (no CTA button)
2. **Hero** — version badge, headline, tagline with `localhost:1025` hint
3. **Platform cards** — macOS / Windows / Linux, each with:
   - Primary button (recommended format, gradient style)
   - Secondary buttons (alternatives, outlined style)
   - Per-platform inline note (Gatekeeper tip, chmod hint, etc.)
4. **Reassurance strip** — Free forever · No telemetry · macOS · Windows · Linux
5. **Footer** — logo + Home + Docs links

## Download Formats

| Platform | Primary | Alternatives |
|----------|---------|--------------|
| macOS | Universal `.dmg` | Silicon `.dmg`, Intel `.dmg` |
| Windows | Installer `.exe` | Portable `.zip` |
| Linux | AppImage `.AppImage` | Debian `.deb` |

## Token Pipeline

Download URLs are injected at deploy time via `scripts/sync-site-url.mjs`. The website version uses tokens; the presentation (design source) uses real placeholder URLs.

| Token | Config key |
|-------|-----------|
| `{{DOWNLOAD_MAC_UNIVERSAL}}` | `downloads.mac.universal` |
| `{{DOWNLOAD_MAC_SILICON}}` | `downloads.mac.silicon` |
| `{{DOWNLOAD_MAC_INTEL}}` | `downloads.mac.intel` |
| `{{DOWNLOAD_WIN_INSTALLER}}` | `downloads.win.installer` |
| `{{DOWNLOAD_WIN_ZIP}}` | `downloads.win.zip` |
| `{{DOWNLOAD_LINUX_APPIMAGE}}` | `downloads.linux.appimage` |
| `{{DOWNLOAD_LINUX_DEB}}` | `downloads.linux.deb` |

`site.config.json` was updated from flat strings to a nested structure to support the 7 tokens.

## Files Changed

| File | Change |
|------|--------|
| `resources/presentation/download.html` | Created — design source with real placeholder URLs |
| `website/download.html` | Created — website-ready with `{{DOWNLOAD_*}}` tokens + Umami |
| `website/site.config.json` | Expanded downloads to nested mac/win/linux objects |
| `scripts/sync-site-url.mjs` | Added `download.html` to files list; expanded token map to 7 entries; fixed URL pattern to exclude `script src` attributes (was clobbering Umami analytics URL) |
| `resources/presentation/index.html` | Nav → `download.html`; hero button added; CTA updated |
| `website/index.html` | Same as above |
| `resources/presentation/docs.html` | Platform-card hrefs → `download.html` |
| `website/docs.html` | Same as above |
