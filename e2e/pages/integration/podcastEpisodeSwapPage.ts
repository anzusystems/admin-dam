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

interface EpisodeRow {
  id: string
  asset: string | null
  flags: { fromRss: boolean }
  texts: { title: string }
}

/*
 * The podcast synchronizer pairs a feed item with an episode by its exact title alone, and takes whichever
 * episode of that title the database hands back first. Two episodes of one title therefore make the swap a
 * coin toss, so every helper below keeps the title the test works with down to the test's own episode.
 */

/** Episodes of the podcast carrying exactly this title. */
export async function episodesTitled(page: Page, podcastId: string, title: string): Promise<EpisodeRow[]> {
  const response = await page.request.get(
    `${CORE_DAM_API}/podcast-episode/podcast/${podcastId}?limit=20&offset=0&filter_eq[texts.title]=${encodeURIComponent(title)}`
  )
  expect(response.ok(), 'podcast episodes by title').toBeTruthy()
  return ((await response.json()).data as EpisodeRow[]).filter((episode) => episode.texts.title === title)
}

export async function deleteEpisodeViaApi(page: Page, episodeId: string): Promise<void> {
  const response = await page.request.delete(`${CORE_DAM_API}/podcast-episode/${episodeId}`)
  expect([204, 404], `DELETE podcast episode ${episodeId}`).toContain(response.status())
}

/**
 * Newest imported episode is the one the web lists first. One whose title another episode shares (a test
 * run that died before its cleanup leaves such a twin) is passed over: the synchronizer could pair the feed
 * item with the twin instead of the test's episode.
 */
export async function newestImportedEpisode(page: Page, podcastId: string): Promise<ImportedEpisode> {
  const response = await page.request.get(
    `${CORE_DAM_API}/podcast-episode/podcast/${podcastId}?limit=10&offset=0&order[attributes.webOrderPosition]=desc`
  )
  expect(response.ok(), 'podcast episode list').toBeTruthy()
  const episodes = (await response.json()).data as EpisodeRow[]
  let episode: EpisodeRow | undefined
  for (const candidate of episodes) {
    if (!candidate.flags.fromRss || !candidate.asset) continue
    if ((await episodesTitled(page, podcastId, candidate.texts.title)).length === 1) {
      episode = candidate
      break
    }
  }
  expect(episode, `an RSS-imported episode with an asset and a unique title in podcast ${podcastId}`).toBeTruthy()
  return { episodeId: episode!.id, assetId: episode!.asset!, title: episode!.texts.title }
}

/**
 * Leave the test's episode the only one of its title before the test synchronizes. The scheduled podcast
 * synchronization runs every twenty minutes on its own; one that lands between the delete of the imported
 * episode and the test's own episode imports the feed item back as a new episode with a new asset.
 */
export async function dropReimportedTwins(
  page: Page,
  podcastId: string,
  title: string,
  assetId: string
): Promise<void> {
  for (const episode of await episodesTitled(page, podcastId, title)) {
    if (episode.asset === assetId) continue
    if (episode.asset) await deleteAssetViaApi(page, episode.asset)
    await deleteEpisodeViaApi(page, episode.id)
  }
  expect(
    (await episodesTitled(page, podcastId, title)).map((episode) => episode.asset),
    `"${title}" is left to the test's episode`
  ).toEqual([assetId])
}

/**
 * Teardown: the test's episode stays a manual one, with no asset once the test asset is gone, when the
 * synchronizer never took it over. It would be the twin that trips the next run, so it goes. An episode the
 * synchronizer did take over is the feed's again and stays for the next scheduled import to refill.
 */
export async function dropLeftoverManualEpisodes(page: Page, podcastId: string, title: string): Promise<void> {
  for (const episode of await episodesTitled(page, podcastId, title)) {
    if (!episode.flags.fromRss && !episode.asset) await deleteEpisodeViaApi(page, episode.id)
  }
}

async function deleteAssetViaApi(page: Page, assetId: string): Promise<void> {
  const response = await page.request.delete(`${CORE_DAM_API}/asset/${assetId}`)
  expect([204, 404], `DELETE asset ${assetId}`).toContain(response.status())
  await expect
    .poll(async () => (await page.request.get(`${CORE_DAM_API}/asset/${assetId}`)).status(), { timeout: 30000 })
    .toBe(404)
}

export async function deleteAssetFromDetail(page: Page, assetId: string): Promise<void> {
  await page.goto(`/assets/${assetId}`)
  await cardLoad(page)
  await visibleCy(page, 'button-delete').click()
  await visibleCy(page, 'button-confirm-delete').click()
  await expect
    .poll(async () => (await page.request.get(`${CORE_DAM_API}/asset/${assetId}`)).status(), { timeout: 30000 })
    .toBe(404)
}

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

export async function runFullPodcastSync(page: Page, podcastId: string): Promise<void> {
  await page.goto('/jobs')
  await cardLoad(page)
  const dialog = await openJobCreateDialog(page, JOB_SYNC)
  await dialog.locator('[data-cy="podcastId"] input').fill(podcastId)
  await dialog.getByRole('checkbox', { name: 'Plná synchronizácia' }).check()
  const jobId = await confirmJob(page, dialog)
  await waitForJobDone(page, jobId)
}
