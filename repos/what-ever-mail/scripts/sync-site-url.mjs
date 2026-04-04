#!/usr/bin/env node
/**
 * Reads siteUrl from website/site.config.json and replaces all
 * https://<any-host>/ references in OG tags, canonical, sitemap,
 * robots.txt, and JSON-LD across the website directory.
 *
 * Usage: node scripts/sync-site-url.mjs
 */

import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const websiteDir = join(__dirname, '..', 'website')
const configPath = join(websiteDir, 'site.config.json')

const config = JSON.parse(readFileSync(configPath, 'utf-8'))
const siteUrl = config.siteUrl.replace(/\/+$/, '') // strip trailing slash
const downloads = config.downloads || {}

const files = ['index.html', 'docs.html', 'download.html', 'sitemap.xml', 'robots.txt']

// Pattern matches https://<host>/ only in OG/canonical/sitemap/JSON-LD contexts
// (preceded by href=", content=", <loc>, or at line start in robots/sitemap).
// This intentionally excludes script src= attributes (e.g. Umami analytics).
const urlPattern = /(?<=(?:href|content|"url")="|<loc>|^(?:Sitemap|Allow|Disallow): ?)https:\/\/[a-z0-9._-]+(?:\.vercel\.app|\.eversoft\.space)(?:\/[^"<\s]*)?/gim

// Download URL tokens
const downloadTokens = {
  '{{DOWNLOAD_MAC_UNIVERSAL}}':  (downloads.mac   || {}).universal  || '#',
  '{{DOWNLOAD_MAC_SILICON}}':    (downloads.mac   || {}).silicon    || '#',
  '{{DOWNLOAD_MAC_INTEL}}':      (downloads.mac   || {}).intel      || '#',
  '{{DOWNLOAD_WIN_INSTALLER}}':  (downloads.win   || {}).installer  || '#',
  '{{DOWNLOAD_WIN_ZIP}}':        (downloads.win   || {}).zip        || '#',
  '{{DOWNLOAD_LINUX_APPIMAGE}}': (downloads.linux || {}).appimage   || '#',
  '{{DOWNLOAD_LINUX_DEB}}':      (downloads.linux || {}).deb        || '#',
}

let totalReplacements = 0

for (const file of files) {
  const filePath = join(websiteDir, file)
  const original = readFileSync(filePath, 'utf-8')

  // Replace site URLs
  let updated = original.replace(urlPattern, (match) => {
    const url = new URL(match)
    return siteUrl + url.pathname
  })

  // Replace download tokens
  for (const [token, url] of Object.entries(downloadTokens)) {
    updated = updated.replaceAll(token, url)
  }

  if (updated !== original) {
    writeFileSync(filePath, updated)
    const count = (original.match(urlPattern) || []).length
    totalReplacements += count
    console.log(`  updated ${file} (${count} URLs)`)
  } else {
    console.log(`  ${file} — already up to date`)
  }
}

console.log(`\nDone. ${totalReplacements} URLs synced to ${siteUrl}`)
