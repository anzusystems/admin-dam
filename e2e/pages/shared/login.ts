import { type Page, expect } from '@playwright/test'
import { changeLicence } from '@pages/shared/licence'
import { BASE_URL, LICENCE_ID } from '@pages/shared/constants'

/**
 * Force-login account for this worker.
 *
 * `FORCE_LOGIN_USER_IDS` holds one DAM user id per parallel worker slot; without it every worker
 * falls back to the single `ADMIN_USER_ID`. The slot comes from `TEST_PARALLEL_INDEX` (always
 * `< workers`) rather than `workerIndex`, which keeps climbing when a worker is restarted after a
 * crash — a restarted worker has to reuse its own account, not claim a live worker's.
 */
export function currentUserId(): string {
  const pool = (process.env.FORCE_LOGIN_USER_IDS ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)

  if (pool.length === 0) return process.env.ADMIN_USER_ID ?? ''

  return pool[Number(process.env.TEST_PARALLEL_INDEX ?? 0) % pool.length]
}

/**
 * Force-login the test admin user via the core-dam force-login endpoint, which redirects into the admin
 * already authenticated. Works on local, dev and staging environments where the endpoint is available.
 */
export async function forceLogin(page: Page): Promise<void> {
  const forceLoginUrl = process.env.FORCE_LOGIN_URL
  if (!forceLoginUrl) throw new Error('FORCE_LOGIN_URL env var not set')

  const userId = currentUserId()
  if (!userId) throw new Error('ADMIN_USER_ID env var not set')
  // The endpoint ends in the account id (…/force/login/adm/<id>), so swapping the trailing
  // number is what puts each worker in its own session.
  if (!/\d+$/.test(forceLoginUrl)) {
    throw new Error(`FORCE_LOGIN_URL must end with the user id, got "${forceLoginUrl}"`)
  }

  await page.goto(forceLoginUrl.replace(/\d+$/, userId))
  await page.waitForURL(`${BASE_URL}/**`)
}

/** Switch the admin to Slovak and the dark theme. Both are read from localStorage when the app boots. */
export async function changeToSlovakDarkTheme(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.setItem('theme', 'dark')
    localStorage.setItem('language', 'sk')
  })
}

/**
 * Turn on the super-admin "DEBUG: Show unreleased features" switch on the settings page, so the suite
 * covers features that are merged but still hidden from regular users. Left alone when it is already on.
 */
export async function showUnreleasedFeatures(page: Page): Promise<void> {
  await page.goto('/settings')
  const toggle = page.locator('.v-row').filter({ hasText: 'DEBUG: Show unreleased features' }).getByRole('checkbox')
  await expect(toggle).toBeVisible()
  if (!(await toggle.isChecked())) await toggle.click()
  await expect(toggle).toBeChecked()
  await expect(toggle).toHaveAccessibleName('Show')
}

/**
 * Everything a spec needs before its first step: an authenticated session in Slovak and the dark theme,
 * unreleased features on, clipboard access and the suite's licence selected.
 */
export async function prepareUser(page: Page): Promise<void> {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE_URL })
  await forceLogin(page)
  await changeToSlovakDarkTheme(page)
  await showUnreleasedFeatures(page)
  await changeLicence(page, LICENCE_ID)
}
