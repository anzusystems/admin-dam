import { type Page, expect, test } from '@playwright/test'
import { cardLoad } from '@pages/shared/admin'
import { CORE_DAM_API } from '@pages/shared/constants'
import { clickForAlert } from '@pages/shared/admin'
import { createDialog, visibleCy } from '@pages/shared/crud'

export const JOB_DELETE = 'Výmaz používateľových dát'
export const JOB_SYNC = 'Podcastový synchronizátor'

export async function openJobCreateDialog(page: Page, type: string) {
  await visibleCy(page, 'button-create').click()
  const dialog = createDialog(page, 'Vytvoriť systémovú úlohu')
  await dialog.locator('[data-cy="job-select"] .v-field').click()
  await page.locator('.v-overlay--active .v-list-item').filter({ hasText: type }).first().click()
  return dialog
}

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

export async function confirmJob(page: Page, dialog: ReturnType<typeof createDialog>): Promise<string> {
  const created = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' && new URL(response.url()).pathname.startsWith('/api/adm/v1/job/')
  )
  await clickForAlert(page, dialog.getByRole('button', { name: 'Vytvoriť' }), 'Záznam bol vytvorený')
  const response = await created
  expect(response.ok(), `POST ${response.url()}`).toBeTruthy()
  return String((await response.json()).id)
}

export async function createUserDataDeleteJob(page: Page, userId: string): Promise<string> {
  const dialog = await openJobCreateDialog(page, JOB_DELETE)
  await dialog.locator('[data-cy="targetUser"] input').fill(userId)
  await dialog.getByRole('checkbox', { name: 'Anonymizuj používateľa' }).check()
  return confirmJob(page, dialog)
}

export async function createPodcastSyncJob(page: Page, podcastId: string): Promise<string> {
  const dialog = await openJobCreateDialog(page, JOB_SYNC)
  await dialog.locator('[data-cy="podcastId"] input').fill(podcastId)
  return confirmJob(page, dialog)
}

/**
 * Users cannot be deleted, so this anonymises and strips a test user instead.
 * Swallows errors, cleanup only.
 */
export async function deleteUserDataViaApi(page: Page, userId: string): Promise<void> {
  await page.request
    .post(`${CORE_DAM_API}/job/user-data-delete`, {
      data: { targetUserId: Number(userId), anonymizeUser: true },
      failOnStatusCode: false,
    })
    .catch(() => {})
}

export function detailValue(page: Page, heading: string) {
  return page.getByRole('main').getByRole('heading', { name: heading, exact: true }).locator('xpath=..')
}

/**
 * The job queue on dev picks jobs up every minute or so.
 * Fails with the last status after `timeout`.
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

interface PodcastSyncJob {
  createdAt: string
  status: string
}

const finished = (job: PodcastSyncJob) => job.status === 'done' || job.status === 'error'

/** The latest podcast synchronizations the scheduler ran (no podcast of their own, unlike one a user creates). */
async function scheduledPodcastSyncs(page: Page): Promise<PodcastSyncJob[]> {
  const response = await page.request.get(`${CORE_DAM_API}/job?limit=100&offset=0&order[id]=desc`)
  expect(response.ok(), 'GET job').toBeTruthy()
  const { data } = (await response.json()) as {
    data: Array<PodcastSyncJob & { _resourceName: string; podcastId?: string | null }>
  }
  return data.filter((job) => job._resourceName === 'jobPodcastSynchronizer' && !job.podcastId)
}

/**
 * The environment synchronizes every podcast on a schedule (staging: every 20 minutes). One that runs between the
 * deletion of an episode's asset and the new episode taking its title imports the feed audio into an asset of its
 * own, and the spec's synchronization then has nothing left to import into the test asset. So wait out a scheduled
 * run that is under way or due within `margin`. The interval is read from the last two scheduled runs; with fewer,
 * nothing is waited for.
 */
export async function waitOutScheduledPodcastSync(page: Page, margin = 2 * 60 * 1000): Promise<void> {
  const [latest, previous] = await scheduledPodcastSyncs(page)
  if (!latest || !previous) return
  const last = Date.parse(latest.createdAt)
  const interval = last - Date.parse(previous.createdAt)
  if (interval <= 0) return
  const next = last + (Math.floor((Date.now() - last) / interval) + 1) * interval
  const due = next - Date.now() < margin
  if (finished(latest) && !due) return

  await test.step('Wait out the scheduled podcast synchronization', async () => {
    const after = due ? next - 60 * 1000 : last
    await expect
      .poll(
        async () =>
          (await scheduledPodcastSyncs(page)).some((job) => Date.parse(job.createdAt) >= after && finished(job)),
        { timeout: margin + 5 * 60 * 1000, intervals: [10000] }
      )
      .toBe(true)
  })
}
