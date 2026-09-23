import { test, expect, type Page } from '@playwright/test'
import { prepareUser } from '@pages/shared/login'
import { ADMIN_SUITE, RAND_NUM } from '@pages/shared/constants'
import { cleanupAssets, waitForAssetProcessed } from '@pages/shared/api'
import { visibleCy } from '@pages/shared/crud'
import { NO_FILE, createEmptyAsset, expectFileUploaded, uploadIntoFirstSlot } from '@pages/assetEmpty/emptyAssetPage'
import {
  metadataTextarea,
  openAssetDetail,
  openSidebarTab,
  saveAssetTitle,
  sidebarContent,
} from '@pages/assets/assetDetailPage'

let page: Page
let ASSET_ID = ''
const TITLE = `TestAssetTitle${RAND_NUM}`

test.describe.serial(`${ADMIN_SUITE} - Empty video asset`, () => {
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext()
    page = await ctx.newPage()
    await prepareUser(page)
  })

  test.afterAll(async () => {
    await cleanupAssets(page, [ASSET_ID])
    await page.context().close()
  })

  test('creates an empty video asset and titles it', async () => {
    ASSET_ID = await createEmptyAsset(page, 'Video')
    await expect(sidebarContent(page)).toContainText(NO_FILE)
    await expect(visibleCy(page, 'button-download')).toBeVisible()
    await expect(visibleCy(page, 'button-delete')).toBeVisible()
    await saveAssetTitle(page, TITLE)
  })

  test('shows empty distribution, video show and slot tabs', async () => {
    await openSidebarTab(page, 'button-distribution')
    await expect(sidebarContent(page)).toContainText(NO_FILE)
    await expect(sidebarContent(page)).toContainText('Nie je vybraná žiadna distribučná kategória')
    await expect(sidebarContent(page)).toContainText('Nie je čo zobraziť')

    await openSidebarTab(page, 'button-video-show')
    await expect(visibleCy(page, 'button-add-new-vs-episode')).toBeVisible()
    await expect(sidebarContent(page)).toContainText(NO_FILE)
    await expect(sidebarContent(page)).toContainText('Nie je čo zobraziť')

    await openSidebarTab(page, 'button-slots')
    for (const text of [NO_FILE, 'default', 'Žiaden súbor']) {
      await expect(sidebarContent(page)).toContainText(text)
    }
  })

  test('uploads a file into the empty asset', async () => {
    await uploadIntoFirstSlot(page, ASSET_ID, 'video/sample.mp4')
    // Other suites upload the same sample, so the file is often stored as a duplicate of one of them.
    const asset = await waitForAssetProcessed(page, ASSET_ID, { done: ['processed', 'duplicate'] })
    expect(asset.mainFile.fileAttributes.mimeType).toContain('video')

    await openAssetDetail(page, ASSET_ID)
    await expect(metadataTextarea(page, 'title')).toHaveValue(TITLE)
    await expectFileUploaded(page, asset.mainFile.fileAttributes.status)
  })
})
