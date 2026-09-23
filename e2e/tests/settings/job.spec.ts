import { test, expect, type Page } from '@playwright/test'
import { prepareUser } from '@pages/shared/login'
import { ADMIN_SUITE } from '@pages/shared/constants'
import { cleanupAssets, deleteAsset } from '@pages/shared/api'
import { uploadAndDescribe } from '@pages/shared/upload'
import { uniqueFixtureCopy } from '@pages/shared/fixtures'
import { JOB_DELETE, JOB_SYNC, createPodcastSyncJob, jobTypeOptions, waitForJobDone } from '@pages/settings/jobPage'
import {
  addAssetToNewEpisode,
  expectEpisodeFlags,
  findImportedEpisodeAsset,
  podcastTitle,
  removeAssetFromPodcast,
  setAssetTitle,
  type PodcastEpisodeAsset,
} from '@pages/settings/podcastSyncPage'
import { openAssetTab } from '@pages/assets/assetDetailPage'
import { slotRow, switchMainFileToSlot } from '@pages/assets/assetSlotsPage'
import { openSettingsSection, visibleCy } from '@pages/shared/crud'

let page: Page
const assetIds: string[] = []
let episode: PodcastEpisodeAsset
let PODCAST_TITLE = ''

// Destructive: every run deletes one RSS-imported episode asset on the target environment so the synchronizer
// has something to re-import. Skip it with `--grep-invert @destructive` when that data matters.
test.describe.serial(`${ADMIN_SUITE} - System jobs`, { tag: '@destructive' }, () => {
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext()
    page = await ctx.newPage()
    await prepareUser(page)
  })

  test.afterAll(async () => {
    await cleanupAssets(page, assetIds)
    await page.context().close()
  })

  test('offers the user data deletion and podcast synchronizer jobs', async () => {
    await openSettingsSection(page, 'job-settings', '/jobs', 'Systémové úlohy')
    const types = await jobTypeOptions(page)
    expect(types).toContain(JOB_SYNC)
    expect(types).toContain(JOB_DELETE)
  })

  test('uploads the audio test asset', async () => {
    await page.goto('/assets')
    assetIds.push(await uploadAndDescribe(page, uniqueFixtureCopy('audio/sample.mp3')))
  })

  test('replaces an imported podcast episode with the test asset', async () => {
    episode = await findImportedEpisodeAsset(page)
    PODCAST_TITLE = await podcastTitle(page, episode.podcastId)

    await page.goto(`/podcasts/${episode.podcastId}`)
    await visibleCy(page, 'podcast-list').click()
    await expect(page.getByRole('main')).toContainText(episode.podcastId)

    // The feed episode is detached from the podcast and its asset deleted, so the synchronizer has to
    // re-import the feed audio into the test asset that takes over the episode title.
    await removeAssetFromPodcast(page, episode.assetId)
    await deleteAsset(page, episode.assetId)

    await setAssetTitle(page, assetIds[0], episode.title)
    await addAssetToNewEpisode(page, assetIds[0], PODCAST_TITLE, episode.title)
  })

  test('moves the uploaded file to the premium slot', async () => {
    await switchMainFileToSlot(page, 'premium')
    const premium = slotRow(page, 'premium')
    await expect(premium).toContainText('Súbor je neprístupný')
    await expect(premium).toContainText('Hlavný súbor')
    await expectEpisodeFlags(page, episode.podcastId, episode.title, 'nie')
  })

  test('synchronizes the podcast into the free slot and enables the episode', async () => {
    await page.goto('/jobs')
    const jobId = await createPodcastSyncJob(page, episode.podcastId)
    await expect(page.locator('tbody tr').filter({ hasText: jobId }).first()).toContainText(JOB_SYNC)
    await waitForJobDone(page, jobId)

    const free = slotRow(page, 'free')
    const premium = slotRow(page, 'premium')
    // The synchronizer imports the feed audio into the free slot and publishes the episode afterwards, so the
    // slots can lag behind the finished job.
    await expect(async () => {
      await openAssetTab(page, assetIds[0], 'button-slots')
      await expect(free).toContainText('Súbor je neprístupný', { timeout: 5000 })
    }).toPass({ timeout: 3 * 60 * 1000, intervals: [10000] })
    await expect(premium).toContainText('Hlavný súbor')
    await expect(premium).toContainText('sample')

    await expectEpisodeFlags(page, episode.podcastId, episode.title, 'áno')
  })
})
