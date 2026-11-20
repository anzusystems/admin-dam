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
  showMoreDetails,
  sidebarContent,
} from '@pages/assets/assetDetailPage'

let page: Page
let ASSET_ID = ''
const TITLE = `TestAssetTitle${RAND_NUM}`

test.describe.serial(`${ADMIN_SUITE} - Empty image asset`, () => {
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext()
    page = await ctx.newPage()
    await prepareUser(page)
  })

  test.afterAll(async () => {
    await cleanupAssets(page, [ASSET_ID])
    await page.context().close()
  })

  test('creates an empty image asset and titles it', async () => {
    ASSET_ID = await createEmptyAsset(page, 'Obrázok')
    await expect(sidebarContent(page)).toContainText(NO_FILE)
    await expect(visibleCy(page, 'button-download')).toBeVisible()
    await expect(visibleCy(page, 'button-delete')).toBeVisible()
    await showMoreDetails(page)
    await saveAssetTitle(page, TITLE)
  })

  test('shows empty crop and slot tabs', async () => {
    await openSidebarTab(page, 'button-focus')
    await expect(sidebarContent(page)).toContainText('Náhľady')
    await expect(sidebarContent(page)).toContainText(
      'Náhľady sú určené pre hlavný obrázok v článku, zoznamy článkov, titulky a rubriky. V tele článku sa zobrazuje formát bez orezania.'
    )

    await openSidebarTab(page, 'button-slots')
    for (const text of [NO_FILE, 'default', 'Žiaden súbor']) {
      await expect(sidebarContent(page)).toContainText(text)
    }
  })

  test('uploads a file into the empty asset', async () => {
    await uploadIntoFirstSlot(page, ASSET_ID, 'image/sample.png')
    // Other suites upload the same sample, so the file is often stored as a duplicate of one of them.
    const asset = await waitForAssetProcessed(page, ASSET_ID, { done: ['processed', 'duplicate'] })
    expect(asset.mainFile.fileAttributes.mimeType).toContain('image')

    await openAssetDetail(page, ASSET_ID)
    await showMoreDetails(page)
    await expect(metadataTextarea(page, 'title')).toHaveValue(TITLE)
    await expectFileUploaded(page, asset.mainFile.fileAttributes.status)
  })
})
