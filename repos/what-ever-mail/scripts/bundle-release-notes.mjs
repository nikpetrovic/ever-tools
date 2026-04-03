import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'fs'
import { dirname, extname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const VALID_PLATFORMS = ['win', 'mac', 'linux']
const platform = process.argv[2]

if (!platform || !VALID_PLATFORMS.includes(platform)) {
  console.error(`Usage: node bundle-release-notes.mjs <platform>`)
  console.error(`  platform: ${VALID_PLATFORMS.join(' | ')}`)
  process.exit(1)
}

const releaseNotesRoot = join(__dirname, '..', 'resources', 'release-notes', 'current')
const metaFile = join(releaseNotesRoot, 'email-meta.yml')
const emailsDir = join(releaseNotesRoot, platform)
const outputFile = join(__dirname, '..', 'build', 'release-notes-bundle.json')

if (!existsSync(metaFile)) {
  console.warn(`No email-meta.yml found at ${metaFile} — skipping bundle.`)
  process.exit(0)
}

if (!existsSync(emailsDir)) {
  console.warn(`No release notes directory found at ${emailsDir} — skipping bundle.`)
  process.exit(0)
}

function parseSimpleYaml(content) {
  const result = {}
  for (const line of content.split('\n')) {
    const colonIndex = line.indexOf(':')
    if (colonIndex === -1) continue
    const key = line.slice(0, colonIndex).trim()
    const value = line.slice(colonIndex + 1).trim()
    if (key) result[key] = value
  }
  return result
}

const meta = parseSimpleYaml(readFileSync(metaFile, 'utf-8'))

if (!meta.from || !meta.to || !meta.subject) {
  console.error('email-meta.yml must contain: from, to, subject')
  process.exit(1)
}

const EMAIL_PATTERN = /^(\d+)-[^.]+\.(html|txt)$/

const emails = readdirSync(emailsDir)
  .filter((f) => EMAIL_PATTERN.test(f))
  .map((filename) => {
    const match = filename.match(EMAIL_PATTERN)
    return {
      number: parseInt(match[1], 10),
      type: extname(filename).slice(1),
      filename,
      content: readFileSync(join(emailsDir, filename), 'utf-8'),
    }
  })
  .sort((a, b) => a.number - b.number)

mkdirSync(dirname(outputFile), { recursive: true })
const bundle = { bundleId: new Date().toISOString(), meta, emails }
writeFileSync(outputFile, JSON.stringify(bundle, null, 2), 'utf-8')
console.log(`Release notes bundled [${platform}]: ${emails.length} email(s) → build/release-notes-bundle.json`)
