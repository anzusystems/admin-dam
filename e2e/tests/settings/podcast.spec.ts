import { test, expect, type Page } from '@playwright/test'
import { prepareUser } from '@pages/shared/login'
import { ADMIN_SUITE, RAND_NUM } from '@pages/shared/constants'
import {
  createEpisode,
  createPodcast,
  deleteEpisode,
  updateEpisode,
  updatePodcast,
  verifyEpisodeDetail,
  verifyPodcastDetail,
} from '@pages/settings/podcastPage'
import { apiStatus, deleteViaApi } from '@pages/shared/crud'

let page: Page
let PODCAST_ID = ''
let EPISODE_ID = ''
let EPISODE_DELETED = false

const PODCAST_TITLE = `TestPodcast${RAND_NUM}`
const EPISODE_TITLE = `TestEpisode${RAND_NUM}`

test.describe.serial(`${ADMIN_SUITE} - Podcast`, () => {
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext()
    page = await ctx.newPage()
    await prepareUser(page)
  })

  test.afterAll(async () => {
    // The delete test is the intended teardown; this only catches an episode stranded by an earlier failure.
    // Podcasts can't be deleted — neither the admin nor the API allows it: DELETE /podcast/:id answers 500
    // (DAM-B15, see KNOWN-BUGS.md).
    if (EPISODE_ID && !EPISODE_DELETED) await deleteViaApi(page, `podcast-episode/${EPISODE_ID}`)
    await page.context().close()
  })

  test('creates a podcast', async () => {
    PODCAST_ID = await createPodcast(page, {
      title: PODCAST_TITLE,
      description: PODCAST_TITLE.repeat(3),
      rssUrl: `https://${PODCAST_TITLE}.com`,
    })
    await verifyPodcastDetail(page, PODCAST_ID, PODCAST_TITLE)
  })

  test('updates the podcast', async () => {
    await updatePodcast(page, PODCAST_ID, {
      title: `${PODCAST_TITLE}-edit`,
      description: `${PODCAST_TITLE}-edit-description`,
      rssUrl: `https://${PODCAST_TITLE}-edit.com`,
    })
  })

  test('creates an episode', async () => {
    EPISODE_ID = await createEpisode(page, PODCAST_ID, {
      title: EPISODE_TITLE,
      description: EPISODE_TITLE.repeat(3),
      seasonNumber: '1',
      episodeNumber: '1',
    })
    await verifyEpisodeDetail(page, PODCAST_ID, EPISODE_ID)
  })

  test('updates the episode', async () => {
    await updateEpisode(page, PODCAST_ID, EPISODE_ID, {
      title: `${EPISODE_TITLE}-edit`,
      description: `${EPISODE_TITLE}-edit-description`,
      seasonNumber: '2',
      episodeNumber: '3',
      extId: RAND_NUM,
    })
  })

  test('deletes the episode', async () => {
    await deleteEpisode(page, PODCAST_ID, EPISODE_ID)
    EPISODE_DELETED = true
    expect(await apiStatus(page, `podcast-episode/${EPISODE_ID}`)).toBe(404)
  })
})
