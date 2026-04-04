#!/usr/bin/env node
/**
 * Reads siteUrl from website/site.config.json and replaces all
 * https://<any-host>/ references in OG tags, canonical, sitemap,
 * robots.txt, and JSON-LD across the website directory.
 *
 * Usage: node scripts/sync-site-url.mjs
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const websiteDir = join(__dirname, '..', 'website')
const configPath = join(websiteDir, 'site.config.json')

const config = JSON.parse(readFileSync(configPath, 'utf-8'))
const siteUrl = config.siteUrl.replace(/\/+$/, '') // strip trailing slash

const files = ['index.html', 'docs.html', 'sitemap.xml', 'robots.txt']

// Pattern matches https://<host>/ in OG/canonical/sitemap/JSON-LD contexts.
// Captures the path after the host so we can preserve it.
const urlPattern = /https:\/\/[a-z0-9._-]+(?:\.vercel\.app|\.eversoft\.space)(?:\/[^"<\s]*)?/gi

let totalReplacements = 0

for (const file of files) {
  const filePath = join(websiteDir, file)
  const original = readFileSync(filePath, 'utf-8')
  const updated = original.replace(urlPattern, (match) => {
    // Extract the path portion after the host
    const url = new URL(match)
    return siteUrl + url.pathname
  })

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
