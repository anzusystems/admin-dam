import { type Page, expect } from '@playwright/test'
import { cardLoad } from '@pages/shared/admin'
import { CORE_DAM_API } from '@pages/shared/constants'
import { clickForAlert } from '@pages/shared/admin'
import { createDialog, visibleCy } from '@pages/shared/crud'

export const JOB_DELETE = 'Výmaz používateľových dát'
export const JOB_SYNC = 'Podcastový synchronizátor'

/** Open the job create dialog on the jobs list and select the job type. */
export async function openJobCreateDialog(page: Page, type: string) {
  await visibleCy(page, 'button-create').click()
  const dialog = createDialog(page, 'Vytvoriť systémovú úlohu')
  await dialog.locator('[data-cy="job-select"] .v-field').click()
  await page.locator('.v-overlay--active .v-list-item').filter({ hasText: type }).first().click()
  return dialog
}

/** The job types offered by the create dialog's type select. */
export async function jobTypeOptions(page: Page): Promise<string[]> {
  await visibleCy(page, 'button-create').click()
  const dialog = createDialog(page, 'Vytvoriť systémovú úlohu')
  await dialog.locator('[data-cy="job-select"] .v-field').click()
  const options = page.locator('.v-overlay--active .v-list-item')
  await expect(options.first()).toBeVisible()
  const texts = (await options.allTextContents()).map((text) => text.trim())
  await page.keyboard.press('Escape')
  await dialog.locator('[data-cy="button-close"]').click()
  await expect(dialog).toBeHidden()
  return texts
}

/** Create a job from the open dialog with its "Vytvoriť" button and return the id from the POST response. */
export async function confirmJob(page: Page, dialog: ReturnType<typeof createDialog>): Promise<string> {
  // Every job type posts to its own `/job/<type>` endpoint.
  const created = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' && new URL(response.url()).pathname.startsWith('/api/adm/v1/job/')
  )
  await clickForAlert(page, dialog.getByRole('button', { name: 'Vytvoriť' }), 'Záznam bol vytvorený')
  const response = await created
  expect(response.ok(), `POST ${response.url()}`).toBeTruthy()
  return String((await response.json()).id)
}

/** Create the "delete user data" job for `userId` through the create dialog, with anonymisation on. */
export async function createUserDataDeleteJob(page: Page, userId: string): Promise<string> {
  const dialog = await openJobCreateDialog(page, JOB_DELETE)
  await dialog.locator('[data-cy="targetUser"] input').fill(userId)
  await dialog.getByRole('checkbox', { name: 'Anonymizuj používateľa' }).check()
  return confirmJob(page, dialog)
}

/** Create the podcast synchronizer job for `podcastId` through the create dialog. */
export async function createPodcastSyncJob(page: Page, podcastId: string): Promise<string> {
  const dialog = await openJobCreateDialog(page, JOB_SYNC)
  await dialog.locator('[data-cy="podcastId"] input').fill(podcastId)
  return confirmJob(page, dialog)
}

/**
 * Anonymise and strip a test user through the API. Users cannot be deleted, so this is the cleanup for a
 * user a test created. Swallows errors — cleanup only.
 */
export async function deleteUserDataViaApi(page: Page, userId: string): Promise<void> {
  await page.request
    .post(`${CORE_DAM_API}/job/user-data-delete`, {
      data: { targetUserId: Number(userId), anonymizeUser: true },
      failOnStatusCode: false,
    })
    .catch(() => {})
}

/** The value rendered under the `heading` (h4) of a detail view. */
export function detailValue(page: Page, heading: string) {
  return page.getByRole('main').getByRole('heading', { name: heading, exact: true }).locator('xpath=..')
}

/**
 * Wait for a job to finish by reloading its detail until the status reads "Hotovo" — the job queue on dev
 * picks jobs up every minute or so. Fails with the last status after `timeout`.
 */
export async function waitForJobDone(page: Page, id: string, timeout = 5 * 60 * 1000): Promise<void> {
  await page.goto(`/jobs/${id}`)
  await cardLoad(page)
  const status = detailValue(page, 'Stav')
  await expect(async () => {
    await page.reload()
    await cardLoad(page)
    await expect(status).toContainText('Hotovo', { timeout: 5000 })
  }).toPass({ timeout, intervals: [10000] })
}
