import { type Page, expect } from '@playwright/test'
import { cardLoad } from '@pages/shared/admin'
import { CORE_DAM_API } from '@pages/shared/constants'
import { visibleCy } from '@pages/shared/crud'
import { JOB_SYNC, confirmJob, openJobCreateDialog, waitForJobDone } from '@pages/settings/jobPage'

export interface ImportedEpisode {
  episodeId: string
  assetId: string
  title: string
}

/**
 * The newest episode of `podcastId` in web order that the synchronizer imported from the RSS feed and that still
 * has its asset — the one the web lists first.
 */
export async function newestImportedEpisode(page: Page, podcastId: string): Promise<ImportedEpisode> {
  const response = await page.request.get(
    `${CORE_DAM_API}/podcast-episode/podcast/${podcastId}?limit=10&offset=0&order[attributes.webOrderPosition]=desc`
  )
  expect(response.ok(), 'podcast episode list').toBeTruthy()
  const episodes = (await response.json()).data as {
    id: string
    asset: string | null
    flags: { fromRss: boolean }
    texts: { title: string }
  }[]
  const episode = episodes.find((candidate) => candidate.flags.fromRss && candidate.asset)
  expect(episode, `an RSS-imported episode with an asset in podcast ${podcastId}`).toBeTruthy()
  return { episodeId: episode!.id, assetId: episode!.asset!, title: episode!.texts.title }
}

/** Delete an asset from its detail view. */
export async function deleteAssetFromDetail(page: Page, assetId: string): Promise<void> {
  await page.goto(`/assets/${assetId}`)
  await cardLoad(page)
  await visibleCy(page, 'button-delete').click()
  await visibleCy(page, 'button-confirm-delete').click()
  await expect
    .poll(async () => (await page.request.get(`${CORE_DAM_API}/asset/${assetId}`)).status(), { timeout: 30000 })
    .toBe(404)
}

/** Id of the podcast titled exactly `title` in the ext system of the current licence. */
export async function podcastIdByTitle(page: Page, title: string): Promise<string> {
  const response = await page.request.get(
    `${CORE_DAM_API}/podcast/ext-system/1?limit=5&offset=0&filter_eq[texts.title]=${encodeURIComponent(title)}`
  )
  expect(response.ok(), 'podcast list').toBeTruthy()
  const podcast = ((await response.json()).data as { id: string; texts: { title: string } }[]).find(
    (candidate) => candidate.texts.title === title
  )
  expect(podcast, `podcast "${title}"`).toBeTruthy()
  return podcast!.id
}

/** Create a podcast synchronizer job with "Plná synchronizácia" on, and wait until it is done. */
export async function runFullPodcastSync(page: Page, podcastId: string): Promise<void> {
  await page.goto('/jobs')
  await cardLoad(page)
  const dialog = await openJobCreateDialog(page, JOB_SYNC)
  await dialog.locator('[data-cy="podcastId"] input').fill(podcastId)
  await dialog.getByRole('checkbox', { name: 'Plná synchronizácia' }).check()
  const jobId = await confirmJob(page, dialog)
  await waitForJobDone(page, jobId)
}
