import { test, type Page } from '@playwright/test'
import { prepareUser } from '@pages/shared/login'
import { ADMIN_SUITE, RAND_NUM } from '@pages/shared/constants'
import { uploadAndDescribe, waitForAssetList } from '@pages/shared/upload'
import { cleanupAssets, waitForAssetProcessed } from '@pages/shared/api'
import { deleteViaApi, visibleCy } from '@pages/shared/crud'
import { fillTexts, openAssetDetail, saveMetadata } from '@pages/assets/assetDetailPage'
import {
  addAssetToNewPodcastEpisode,
  deletePodcastEpisodeFromTab,
  expectNothingInTab,
  expectPodcastEpisodeListed,
} from '@pages/assets/assetEpisodePage'

let page: Page
let ASSET_ID = ''
let EPISODE_ID = ''
let EPISODE_DELETED = false

const TITLE = `TestAssetTitle${RAND_NUM}`
const DESCRIPTION = `TestDescription${RAND_NUM}`

test.describe.serial(`${ADMIN_SUITE} - Audio asset to podcast episode`, () => {
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext()
    page = await ctx.newPage()
    await prepareUser(page)
  })

  test.afterAll(async () => {
    // The delete test is the intended teardown; this only catches an episode stranded by an earlier failure.
    if (EPISODE_ID && !EPISODE_DELETED) await deleteViaApi(page, `podcast-episode/${EPISODE_ID}`)
    await cleanupAssets(page, ASSET_ID ? [ASSET_ID] : [])
    await page.context().close()
  })

  test('uploads the audio test asset', async () => {
    // The licence switch in prepareUser reloads the admin; a reload landing mid-upload discards the upload.
    const listLoaded = waitForAssetList(page)
    await page.goto('/assets')
    await listLoaded
    ASSET_ID = await uploadAndDescribe(page, 'audio/sample.mp3')
    await waitForAssetProcessed(page, ASSET_ID, { done: ['processed', 'duplicate'] })
  })

  test('adds the audio asset to a new podcast episode', async () => {
    await openAssetDetail(page, ASSET_ID)
    await fillTexts(page, { title: TITLE, description: DESCRIPTION })
    await saveMetadata(page)
    EPISODE_ID = await addAssetToNewPodcastEpisode(page, {
      title: `${TITLE}-edit`,
      description: `${DESCRIPTION}-edit`,
      // Season and episode numbers are integers, so keep them short.
      seasonNumber: RAND_NUM.slice(-4),
      episodeNumber: RAND_NUM.slice(-4),
    })
  })

  test('removes the podcast episode from the asset', async () => {
    await openAssetDetail(page, ASSET_ID)
    await expectPodcastEpisodeListed(page, `${TITLE}-edit`)
    await deletePodcastEpisodeFromTab(page)
    EPISODE_DELETED = true
    await visibleCy(page, 'button-slots').click()
    await visibleCy(page, 'button-podcast').click()
    await expectNothingInTab(page)
  })
})
