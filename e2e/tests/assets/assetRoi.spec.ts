import { test, expect, type Page } from '@playwright/test'
import { prepareUser } from '@pages/shared/login'
import { ADMIN_SUITE } from '@pages/shared/constants'
import { assetTypeConfig, cleanupAssets, getAsset, waitForAssetProcessed } from '@pages/shared/api'
import { uploadFile, waitForAssetList } from '@pages/shared/upload'
import { uniqueFixtureCopy } from '@pages/shared/fixtures'
import {
  detailSidebar,
  expectRoiPreviewsLoaded,
  openAssetTab,
  refreshRoiPreviews,
  roiPreviewSources,
  roiPreviewTitles,
} from '@pages/assets/assetDetailPage'

/**
 * The "Fókus" tab of an image detail — the crop previews and their reload.
 *
 * **There is no cropper, and no crop ratio can be chosen.** The tab shows a read-only preview per ratio the
 * ext system configures, a slot picker, the reload button and the two rotate buttons; `pointX`/`pointY` and
 * the rest of the region of interest can only be written through `PUT /roi/<id>`, which nothing in this
 * build calls.
 *
 * Rotation is covered by `imageAsset.spec.ts` and is not repeated here.
 */

let page: Page
let ASSET_ID = ''
let MAIN_FILE_ID = ''

test.describe.serial(`${ADMIN_SUITE} - Asset detail Fókus`, () => {
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext()
    page = await ctx.newPage()
    await prepareUser(page)
  })

  test.afterAll(async () => {
    await cleanupAssets(page, [ASSET_ID])
    await page.context().close()
  })

  test('uploads the image test asset', async () => {
    const listLoaded = waitForAssetList(page)
    await page.goto('/assets')
    await listLoaded
    ASSET_ID = await uploadFile(page, uniqueFixtureCopy('image/sample.png'))
    MAIN_FILE_ID = (await waitForAssetProcessed(page, ASSET_ID)).mainFile.id
  })

  test('shows one crop preview per configured ratio, and each one loads', async () => {
    const config = await assetTypeConfig(page, 'image')
    await openAssetTab(page, ASSET_ID, 'button-focus')

    // The first preview is the ratio the ext system declares; the square one is shown alongside it.
    const titles = await roiPreviewTitles(page)
    expect(titles[0]).toBe(`${config.roiWidth}:${config.roiHeight}`)
    expect(titles).toEqual(['3:2', '1:1'])

    // Each preview is the main file, cropped to the box its title names.
    const sources = await roiPreviewSources(page)
    expect(sources).toHaveLength(titles.length)
    for (const source of sources) {
      expect(source).toContain(MAIN_FILE_ID)
    }
    expect(sources[0]).toContain('/w300-h200-')
    expect(sources[1]).toContain('/w200-h200-')

    await expectRoiPreviewsLoaded(page)
  })

  test('the slot picker is disabled for an image, which has a single slot', async () => {
    const config = await assetTypeConfig(page, 'image')
    expect(config.slots).toEqual(['default'])

    await openAssetTab(page, ASSET_ID, 'button-focus')
    const picker = detailSidebar(page).getByRole('combobox').first()
    await expect(picker).toContainText(config.defaultSlotName)
    // There is nowhere to switch to, so the select is rendered disabled rather than hidden.
    await expect(detailSidebar(page).locator('.v-field--disabled')).toHaveCount(1)
  })

  test('"Znovu načítať náhľady" refreshes the crop previews @bug', async () => {
    test.fail() // DAM-B6: the handler throws and the previews never reload — see KNOWN-BUGS.md
    test.info().annotations.push({ type: 'bug', description: 'DAM-B6' })

    await openAssetTab(page, ASSET_ID, 'button-focus')
    await expectRoiPreviewsLoaded(page)
    const before = await roiPreviewSources(page)

    // The previews are cached by URL, so a reload can only reach the image server by changing it.
    await refreshRoiPreviews(page)
    await expect.poll(() => roiPreviewSources(page)).not.toEqual(before)
  })

  test('the asset keeps its main file through a visit to the tab', async () => {
    // A guard for the bug above: whatever the reload button does or fails to do, it must not damage the asset.
    await openAssetTab(page, ASSET_ID, 'button-focus')
    await refreshRoiPreviews(page)
    expect((await getAsset(page, ASSET_ID)).mainFile.id).toBe(MAIN_FILE_ID)
  })
})
