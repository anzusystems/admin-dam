import { test, type Page } from '@playwright/test'
import { prepareUser } from '@pages/shared/login'
import { ADMIN_SUITE, RAND_NUM } from '@pages/shared/constants'
import { uniqueFixtureCopy } from '@pages/shared/fixtures'
import { uploadAndDescribe } from '@pages/shared/upload'
import { cleanupAssets, waitForAssetProcessed } from '@pages/shared/api'
import { addAssetToNewEpisode, removeAssetFromPodcast } from '@pages/settings/podcastSyncPage'
import {
  closeDistributionDialog,
  distribute,
  expectDistributed,
  openAddDistribution,
  openDistributionTab,
  setDistributionCategory,
  showCoreDamLogs,
} from '@pages/distribution/distributionPage'

let page: Page
const assetIds: string[] = []
let IN_PODCAST = false

const PODCAST = 'Dobré ráno'
const CATEGORY = 'Podcasty'
const TITLE = `TestAssetTitle${RAND_NUM}`
const DESCRIPTION = `TestDescription${RAND_NUM}`

test.describe.serial(`${ADMIN_SUITE} - Audio distribution`, () => {
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext()
    page = await ctx.newPage()
    await prepareUser(page)
  })

  test.afterAll(async () => {
    // The episode lives in a real podcast, which cannot be deleted - remove just the test episode.
    if (IN_PODCAST) await removeAssetFromPodcast(page, assetIds[0]).catch(() => {})
    await cleanupAssets(page, assetIds)
    await page.context().close()
  })

  test('uploads the audio test asset', async () => {
    // A unique copy, so the main file is processed rather than a duplicate of an earlier upload.
    assetIds.push(await uploadAndDescribe(page, uniqueFixtureCopy('audio/sample.mp3')))
    await waitForAssetProcessed(page, assetIds[0])
  })

  test('adds the asset to a podcast episode', async () => {
    await addAssetToNewEpisode(page, assetIds[0], PODCAST, TITLE)
    IN_PODCAST = true
  })

  test('distributes the audio to JW Player', async () => {
    await openDistributionTab(page, assetIds[0])
    await setDistributionCategory(page, CATEGORY)
    const dialog = await openAddDistribution(page)
    await distribute(page, dialog, 'JW Player Audio', {
      title: TITLE,
      description: DESCRIPTION,
      author: 'Pavol Demeš',
      keyword: 'Aupark',
      publishNow: true,
    })
    await closeDistributionDialog(page, dialog)
    await expectDistributed(page, assetIds[0], 'JW Player Audio')
  })

  test('lists the coreDam logs', async () => {
    await showCoreDamLogs(page)
  })
})
