import { test, type Page } from '@playwright/test'
import { prepareUser } from '@pages/shared/login'
import { ADMIN_SUITE, RAND_NUM } from '@pages/shared/constants'
import { uploadAndDescribe, waitForAssetList } from '@pages/shared/upload'
import { cleanupAssets, waitForAssetProcessed } from '@pages/shared/api'
import { deleteViaApi } from '@pages/shared/crud'
import { createVideoShow } from '@pages/settings/videoShowPage'
import { fillTexts, openAssetDetail, saveMetadata } from '@pages/assets/assetDetailPage'
import { addAssetToNewVideoShowEpisode, expectVideoShowEpisodeListed } from '@pages/assets/assetEpisodePage'

let page: Page
let ASSET_ID = ''
let VIDEO_SHOW_ID = ''
let EPISODE_ID = ''

const TITLE = `TestAssetTitle${RAND_NUM}`
const DESCRIPTION = `TestDescription${RAND_NUM}`
const VIDEO_SHOW_TITLE = `TestVideoShow${RAND_NUM}`

test.describe.serial(`${ADMIN_SUITE} - Video asset to video show episode`, () => {
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext()
    page = await ctx.newPage()
    await prepareUser(page)
  })

  test.afterAll(async () => {
    if (EPISODE_ID) await deleteViaApi(page, `video-show-episode/${EPISODE_ID}`)
    await cleanupAssets(page, ASSET_ID ? [ASSET_ID] : [])
    if (VIDEO_SHOW_ID) await deleteViaApi(page, `video-show/${VIDEO_SHOW_ID}`)
    await page.context().close()
  })

  test('prepares a video show and the video test asset', async () => {
    // A dedicated show keeps the test episode out of real shows, and unlike podcasts it can be deleted.
    VIDEO_SHOW_ID = await createVideoShow(page, VIDEO_SHOW_TITLE)
    // Start from a freshly loaded list, so no reload lands mid-upload.
    const listLoaded = waitForAssetList(page)
    await page.goto('/assets')
    await listLoaded
    ASSET_ID = await uploadAndDescribe(page, 'video/sample.mp4')
    await waitForAssetProcessed(page, ASSET_ID, { done: ['processed', 'duplicate'] })
  })

  test('adds the video asset to a new video show episode', async () => {
    await openAssetDetail(page, ASSET_ID)
    await fillTexts(page, { title: TITLE, description: DESCRIPTION })
    await saveMetadata(page)
    EPISODE_ID = await addAssetToNewVideoShowEpisode(page, VIDEO_SHOW_TITLE, `${VIDEO_SHOW_TITLE}-edit`)
  })

  test('lists the video show episode on the asset', async () => {
    await openAssetDetail(page, ASSET_ID)
    await expectVideoShowEpisodeListed(page, `${VIDEO_SHOW_TITLE}-edit`)
  })
})
