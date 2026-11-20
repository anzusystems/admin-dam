import type { FullConfig } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'
import { FIXTURE_FILES, FIXTURES_DIR, TEST_DATA_BUCKET_URL } from '../pages/shared/fixtures'

/**
 * Playwright globalSetup — runs once before any test.
 * Validates all required environment variables so tests fail fast with a clear message instead of
 * cryptic errors mid-run, and downloads the media fixtures the upload tests need.
 */
export default async function globalSetup(config: FullConfig): Promise<void> {
  const required: string[] = ['BASE_URL', 'FORCE_LOGIN_URL', 'ADMIN_USER_ID', 'URL_DOMAIN', 'URL_PROTO', 'LICENCE_ID']

  const missing = required.filter((key) => !process.env[key])

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n  ${missing.join('\n  ')}\n\nCopy .env.dist to .env.devel (or .env.staging) and fill in all values.`
    )
  }

  const pool = (process.env.FORCE_LOGIN_USER_IDS ?? '').split(',').filter((id) => id.trim())
  if (pool.length > 0 && pool.length < config.workers) {
    console.warn(
      `FORCE_LOGIN_USER_IDS lists ${pool.length} account(s) but ${config.workers} workers are configured — ` +
        `workers will share accounts and switch each other's licence. Add more ids or lower --workers.`
    )
  }

  await downloadFixtures()
}

/** Fetch every media fixture that is not on disk yet. The files are too large to keep in git. */
async function downloadFixtures(): Promise<void> {
  for (const file of FIXTURE_FILES) {
    const target = path.join(FIXTURES_DIR, file)
    if (fs.existsSync(target)) continue

    const response = await fetch(`${TEST_DATA_BUCKET_URL}/${file}`)
    if (!response.ok) throw new Error(`Fixture download failed for ${file}: HTTP ${response.status}`)

    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.writeFileSync(target, Buffer.from(await response.arrayBuffer()))
  }
}
