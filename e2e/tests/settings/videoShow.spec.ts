import { test, type Page } from '@playwright/test'
import { prepareUser } from '@pages/shared/login'
import { ADMIN_SUITE, RAND_NUM } from '@pages/shared/constants'
import {
  createVideoShow,
  createVideoShowEpisode,
  updateVideoShow,
  updateVideoShowEpisode,
  verifyVideoShowDetail,
  verifyVideoShowEpisodeDetail,
} from '@pages/settings/videoShowPage'
import { deleteViaApi } from '@pages/shared/crud'

let page: Page
let VIDEO_SHOW_ID = ''
let EPISODE_ID = ''

const VIDEO_SHOW_TITLE = `TestVideoShow${RAND_NUM}`
const EPISODE_TITLE = `TestEpisode${RAND_NUM}`

test.describe.serial(`${ADMIN_SUITE} - Video show`, () => {
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext()
    page = await ctx.newPage()
    await prepareUser(page)
  })

  test.afterAll(async () => {
    // The admin offers no delete for video shows or their episodes; remove them through the API where it allows it.
    if (EPISODE_ID) await deleteViaApi(page, `video-show-episode/${EPISODE_ID}`)
    if (VIDEO_SHOW_ID) await deleteViaApi(page, `video-show/${VIDEO_SHOW_ID}`)
    await page.context().close()
  })

  test('creates a video show', async () => {
    VIDEO_SHOW_ID = await createVideoShow(page, VIDEO_SHOW_TITLE)
    await verifyVideoShowDetail(page, VIDEO_SHOW_ID, VIDEO_SHOW_TITLE)
  })

  test('updates the video show', async () => {
    await updateVideoShow(page, VIDEO_SHOW_ID, `${VIDEO_SHOW_TITLE}-edit`)
  })

  test('creates an episode', async () => {
    EPISODE_ID = await createVideoShowEpisode(page, VIDEO_SHOW_ID, EPISODE_TITLE)
    await verifyVideoShowEpisodeDetail(page, VIDEO_SHOW_ID, EPISODE_ID)
  })

  test('updates the episode', async () => {
    await updateVideoShowEpisode(page, VIDEO_SHOW_ID, EPISODE_ID, `${EPISODE_TITLE}-edit`)
  })
})
