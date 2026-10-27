import { type Page, expect } from '@playwright/test'
import { changeLicence } from '@pages/shared/licence'
import { BASE_URL, LICENCE_ID } from '@pages/shared/constants'

/**
 * Force-login account for this worker.
 * `FORCE_LOGIN_USER_IDS` holds one DAM user id per parallel worker
 * slot. Without it every worker uses the single `ADMIN_USER_ID`.
 * The slot comes from `TEST_PARALLEL_INDEX` (always `< workers`), not `workerIndex`, which keeps
 * growing when a worker restarts after a crash. A restarted worker must reuse its own account.
 */
export function currentUserId(): string {
  const pool = (process.env.FORCE_LOGIN_USER_IDS ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)

  if (pool.length === 0) return process.env.ADMIN_USER_ID ?? ''

  return pool[Number(process.env.TEST_PARALLEL_INDEX ?? 0) % pool.length]
}

export async function forceLogin(page: Page): Promise<void> {
  const forceLoginUrl = process.env.FORCE_LOGIN_URL
  if (!forceLoginUrl) throw new Error('FORCE_LOGIN_URL env var not set')

  const userId = currentUserId()
  if (!userId) throw new Error('ADMIN_USER_ID env var not set')
  // The endpoint path ends in the account id (…/force/login/adm/<id>), so swapping that number is
  // what puts each worker in its own session. The path is matched rather than the whole url: a
  // `?url=` redirect ending in a port is digits too.
  const url = new URL(forceLoginUrl)
  if (!/\d+$/.test(url.pathname)) {
    throw new Error(`FORCE_LOGIN_URL path must end with the user id, got "${forceLoginUrl}"`)
  }
  url.pathname = url.pathname.replace(/\d+$/, userId)

  await page.goto(url.toString())
  await page.waitForURL(`${BASE_URL}/**`)
}

/**
 * Both settings are read from localStorage when the app boots.
 */
export async function changeToSlovakDarkTheme(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.setItem('theme', 'dark')
    localStorage.setItem('language', 'sk')
  })
}

/**
 * Turn on the super-admin "DEBUG: Zobraziť nevydané funkcie" switch so the
 * suite covers merged but hidden features. Left alone when already on.
 * Read in Slovak: `changeToSlovakDarkTheme` has switched the language before this runs.
 */
export async function showUnreleasedFeatures(page: Page): Promise<void> {
  await page.goto('/settings')
  const toggle = page.locator('.v-row').filter({ hasText: 'DEBUG: Zobraziť nevydané funkcie' }).getByRole('checkbox')
  await expect(toggle).toBeVisible()
  if (!(await toggle.isChecked())) await toggle.click()
  await expect(toggle).toBeChecked()
  await expect(toggle).toHaveAccessibleName('Zobraziť')
}

export async function prepareUser(page: Page): Promise<void> {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE_URL })
  await forceLogin(page)
  await changeToSlovakDarkTheme(page)
  await showUnreleasedFeatures(page)
  await changeLicence(page, LICENCE_ID)
}
