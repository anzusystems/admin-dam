import { test, expect, type Page } from '@playwright/test'
import { prepareUser } from '@pages/shared/login'
import { ADMIN_SUITE, RAND_NUM } from '@pages/shared/constants'
import { uploadAndDescribe } from '@pages/shared/upload'
import { cleanupAssets, getAsset } from '@pages/shared/api'
import { visibleCy } from '@pages/shared/crud'
import {
  fillMetadataText,
  openAndCancelDelete,
  openAndCancelDownload,
  openAssetDetail,
  revealMetadataField,
  saveMetadata,
} from '@pages/assets/assetDetailPage'

let page: Page
const assetIds: string[] = []

const TITLE = `TestAssetTitle${RAND_NUM}`
const DESCRIPTION = `TestDescription${RAND_NUM}`

test.describe.serial(`${ADMIN_SUITE} - Document asset`, () => {
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext()
    page = await ctx.newPage()
    await prepareUser(page)
  })

  test.afterAll(async () => {
    await cleanupAssets(page, assetIds)
    await page.context().close()
  })

  test('uploads the document test asset', async () => {
    assetIds.push(await uploadAndDescribe(page, 'document/sample.doc'))
  })

  test('fills the title and description', async () => {
    await openAssetDetail(page, assetIds[0])
    await revealMetadataField(page, 'title')
    await fillMetadataText(page, 'title', TITLE)
    await fillMetadataText(page, 'description', DESCRIPTION)
    await openAndCancelDelete(page)
    await openAndCancelDownload(page)
    await saveMetadata(page)

    const asset = await getAsset(page, assetIds[0])
    expect(asset.metadata.customData).toMatchObject({ title: TITLE, description: DESCRIPTION })
  })

  test('edits the title', async () => {
    await openAssetDetail(page, assetIds[0])
    await revealMetadataField(page, 'title')
    await fillMetadataText(page, 'title', `${TITLE}-edit`)
    await fillMetadataText(page, 'description', DESCRIPTION)
    await saveMetadata(page)

    const asset = await getAsset(page, assetIds[0])
    expect(asset.metadata.customData).toMatchObject({ title: `${TITLE}-edit`, description: DESCRIPTION })
  })

  test('clears the title and description', async () => {
    await openAssetDetail(page, assetIds[0])
    await revealMetadataField(page, 'title')
    await fillMetadataText(page, 'title', '')
    await fillMetadataText(page, 'description', '')
    await saveMetadata(page)
    await expect(visibleCy(page, 'button-slots')).toBeVisible()

    const asset = await getAsset(page, assetIds[0])
    expect(asset.metadata.customData.title ?? '').toBe('')
    expect(asset.metadata.customData.description ?? '').toBe('')
  })
})
