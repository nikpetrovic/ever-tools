# 003 — Replace Inline Styles with Tailwind CSS

**Type:** Enhancement (DX / code quality)
**Status:** In progress

## Problem

All 14 renderer components use inline `style={{ }}` props (~122 declarations) instead of Tailwind utility classes. This makes styling hard to scan, prevents Tailwind tooling (IntelliSense, class sorting), and duplicates logic that should live in CSS.

## Solution

1. Extend `tailwind.config.js` with CSS variable tokens (`surface.*`, `fg.*`, `border`, `accent.*`, `grad`) and a custom `app-drag` / `app-no-drag` plugin for Electron's `-webkit-app-region`.
2. Install `clsx` for conditional class composition.
3. Replace all inline styles with Tailwind utility classes across 14 components.

## Files Changed

- `tailwind.config.js` — extend theme + add plugin
- `package.json` — add `clsx`
- `src/renderer/components/*.tsx` — all 14 component files

## Outcome

Zero inline `style` props. All styling expressed as Tailwind classes. CSS variable theming preserved via token mapping. Visual output identical.
