import { existsSync, unlinkSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const bundleFile = join(__dirname, '..', 'build', 'release-notes-bundle.json')

if (existsSync(bundleFile)) {
  unlinkSync(bundleFile)
  console.log('Release notes bundle cleaned up.')
} else {
  console.log('No release notes bundle to clean up.')
}
