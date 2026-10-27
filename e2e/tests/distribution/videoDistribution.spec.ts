import { test, type Page } from '@playwright/test'
import { prepareUser } from '@pages/shared/login'
import { ADMIN_SUITE, RAND_NUM } from '@pages/shared/constants'
import { uniqueFixtureCopy } from '@pages/shared/fixtures'
import { uploadAndDescribe } from '@pages/shared/upload'
import { cleanupAssets, waitForAssetProcessed } from '@pages/shared/api'
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

const CATEGORY = 'Publicistika'
const TITLE = `TestAssetTitle${RAND_NUM}`
const DESCRIPTION = `TestDescription${RAND_NUM}`

test.describe.serial(`${ADMIN_SUITE} - Video distribution`, () => {
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext()
    page = await ctx.newPage()
    await prepareUser(page)
  })

  test.afterAll(async () => {
    await cleanupAssets(page, assetIds)
    await page.context().close()
  })

  test('uploads the video test asset', async () => {
    // A unique copy, so the main file is processed rather than a duplicate of an earlier upload.
    assetIds.push(await uploadAndDescribe(page, uniqueFixtureCopy('video/sample.mp4')))
    await waitForAssetProcessed(page, assetIds[0])
  })

  test('distributes the video to YouTube and JW Player', async () => {
    await openDistributionTab(page, assetIds[0])
    await setDistributionCategory(page, CATEGORY)
    const dialog = await openAddDistribution(page)
    await distribute(page, dialog, 'YouTube', { title: TITLE, description: DESCRIPTION })
    await distribute(page, dialog, 'JW Player Video', { title: TITLE, description: DESCRIPTION, author: 'Pavol Demeš' })
    await closeDistributionDialog(page, dialog)
    await expectDistributed(page, assetIds[0], 'JW Player Video')
    await expectDistributed(page, assetIds[0], 'YouTube')
  })

  test('lists the coreDam logs', async () => {
    await showCoreDamLogs(page)
  })
})
