import { test, expect, type Page } from '@playwright/test'
import { prepareUser } from '@pages/shared/login'
import { ADMIN_SUITE } from '@pages/shared/constants'
import { uploadAndDescribe, waitForAssetList } from '@pages/shared/upload'
import { cleanupAssets, waitForAssetProcessed } from '@pages/shared/api'
import { metadataField, metadataTextarea, openAssetDetail } from '@pages/assets/assetDetailPage'

let page: Page
const assetIds: string[] = []

const EXPECTED_DESCRIPTION = 'child son congratulates mother on holiday and gives flowers'
const EXPECTED_AUTHOR = 'test author'

// The title is never autofilled from image metadata, so it is not asserted. Keywords are only attached when a
// keyword entity with that name already exists — the ones below do on every environment the suite runs on.
test.describe.serial(`${ADMIN_SUITE} - Asset metadata autofill`, () => {
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext()
    page = await ctx.newPage()
    await prepareUser(page)
  })

  test.afterAll(async () => {
    await cleanupAssets(page, assetIds)
    await page.context().close()
  })

  test('autofills the metadata from EXIF and IPTC tags', async () => {
    const id = await uploadAndDescribe(page, 'image/sampleMeta1.jpg')
    assetIds.push(id)
    await waitForAssetProcessed(page, id, { done: ['processed', 'duplicate'] })
    await openAssetDetail(page, id)
    await expect(metadataTextarea(page, 'description')).toHaveValue(EXPECTED_DESCRIPTION)
    await expect(metadataField(page, 'keywords').locator('.v-chip')).toHaveText(['kid', 'happy', 'son'].map(chip))
    await expect(metadataField(page, 'authors').locator('.v-chip')).toHaveText([chip(EXPECTED_AUTHOR)])
  })

  test('autofills the metadata from XMP subjects and owners', async () => {
    const listLoaded = waitForAssetList(page)
    await page.goto('/assets')
    await listLoaded
    const id = await uploadAndDescribe(page, 'image/sampleMeta2.jpg')
    assetIds.push(id)
    await waitForAssetProcessed(page, id, { done: ['processed', 'duplicate'] })
    await openAssetDetail(page, id)
    await expect(metadataTextarea(page, 'description')).toHaveValue(EXPECTED_DESCRIPTION)
    await expect(metadataField(page, 'keywords').locator('.v-chip')).toHaveText([chip("happy mother's day!")])
    await expect(metadataField(page, 'authors').locator('.v-chip')).toHaveText([chip(EXPECTED_AUTHOR)])
  })
})

/** Exact chip text, ignoring the surrounding whitespace Vuetify renders. */
function chip(text: string): RegExp {
  return new RegExp(`^\\s*${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`)
}
