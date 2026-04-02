# 004 — HTML Preview Dark Mode

## Goal

When the user switches the app theme (or OS color scheme), the HTML email preview iframe should adapt accordingly — applying a dark background + light text when in dark mode, and vice versa.

This is a developer experience quality-of-life feature: emails sent from apps that include both light and dark styles should render correctly; emails with no dark mode support should at minimum get a readable background/text fallback.

---

## What Was Attempted

All attempts were made in `src/renderer/components/Preview/HtmlView.tsx`. All were reverted.

### Attempt 1 — `@media (prefers-color-scheme: dark)` in injected CSS

Injected a `<style>` block into the iframe `<head>` using `doc.write()` containing:

```css
@media (prefers-color-scheme: dark) {
  body { background: #1a1a1a; color: #e5e5e5; }
}
```

**Why it failed:** The media query re-evaluates independently inside the iframe — it checks the OS color scheme, not the app's selected theme. Because the app uses its own theme system (CSS variable + `data-theme` attribute), the iframe's media query had no awareness of the current in-app theme selection.

---

### Attempt 2 — Direct dark value injection based on JS `isDark` flag

Read `isDark` from the parent window using `window.matchMedia('(prefers-color-scheme: dark)').matches`, then conditionally injected background/color values directly (no media query):

```css
body { background: #1a1a1a !important; color: #e5e5e5 !important; }
```

**Why it failed:** Email HTML commonly wraps content in a `<table>` or `<div>` with its own background color set via inline styles or internal `<style>` blocks. The `body` override had no effect on those inner elements. Additionally, it's unclear whether the `isDark` value was correct — the app theme is controlled by `data-theme` on the root element, not necessarily by OS preference.

---

### Attempt 3 — Appending override `<style>` after `doc.close()`

After `doc.open() / doc.write() / doc.close()`, attempted to append an additional `<style>` element to `iframe.contentDocument.head` containing `!important` overrides.

**Why it failed:** DOM manipulation after `doc.close()` may not execute reliably in Electron's sandboxed iframe context. The appended style did not take effect.

---

### Attempt 4 — Reading CSS variables from parent + injecting at end of `<body>`

Read the current theme colors from the parent document using:

```ts
getComputedStyle(document.documentElement).getPropertyValue('--bg-panel')
```

Injected those resolved values as a `<style>` block appended as the last child of `<body>` (to maximize specificity via source order), targeting both `body` and common email wrapper elements (`table`, `td`, `div`).

**Why it failed:** Still no visible effect. Root cause unclear — possibly the resolved values were empty strings (CSS variables may not resolve at the time of call, or the variable names didn't match the active theme), or email content elements still override via inline styles.

---

### Attempt 5 — `srcDoc` React prop instead of `doc.write()`

Replaced the imperative `doc.open/write/close` pattern with React's declarative `srcDoc` prop:

```tsx
<iframe srcDoc={builtHtml} sandbox="allow-same-origin" ... />
```

Used `useMemo` to rebuild the HTML string when `html` or `isDark` changed.

**Why it failed:** User confirmed still no visible effect. The approach is architecturally cleaner but shares the same underlying problem — identifying the correct theme state and making injected styles win over email content styles.

---

## Root Cause Hypothesis

The core issue has two layers:

1. **Theme state detection**: The app's current dark/light state lives on `document.documentElement[data-theme]`, not in `prefers-color-scheme`. Reading that attribute and mapping it to a boolean is straightforward, but needs to be done correctly with a `MutationObserver` or event listener if the theme can change while an email is open.

2. **CSS specificity / email HTML overrides**: HTML emails are notorious for using inline styles and internal `<style>` blocks with high specificity. A background override on `body` won't help if every visible element has `background-color` set directly. A working solution likely needs to:
   - Apply overrides to every element (e.g., `* { background: ... !important; color: ... !important; }`) — aggressive and will break intentional email colors
   - OR use `filter: invert(1) hue-rotate(180deg)` on the iframe itself — a CSS trick that inverts the whole iframe without touching its DOM
   - OR leave email HTML untouched (many email clients do this) and only apply a theme-colored backdrop around the iframe

---

## Recommended Approach for Future Implementation

### Option A — CSS `filter` invert (quick, imperfect)

In dark mode, apply `filter: invert(1) hue-rotate(180deg)` to the `<iframe>` element itself. No DOM injection needed. Has side effects on images (they also get inverted).

### Option B — Backdrop only (non-invasive)

Don't modify the email HTML at all. Instead wrap the iframe in a container that sets background/text colors so the surrounding area matches the theme. The email renders as-is. This is what many modern email clients (including Apple Mail) do.

### Option C — Full DOM override with `* { ... !important }` (aggressive)

Inside the iframe, inject a `<style>` with `* { background-color: var(--bg-panel) !important; color: var(--text-1) !important; }` where the variable values are resolved at injection time. This breaks intentional email design but gives a consistent dark appearance.

### Recommended: Option B first, then Option C as an opt-in toggle

Wrap the iframe in a container that mirrors the panel background. Add an optional "Force dark mode" toggle in the preview header that applies Option C when enabled.

---

## Files to Modify

- `src/renderer/components/Preview/HtmlView.tsx` — theme-aware injection or filter
- `src/renderer/components/Preview/PreviewHeader.tsx` — optional "Force dark" toggle
- `src/renderer/components/Preview/Preview.tsx` — pass theme state down

## Branch Name

`feat/004-html-preview-dark-mode`
