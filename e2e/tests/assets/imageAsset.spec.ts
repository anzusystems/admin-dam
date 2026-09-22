import { test, expect, type Page } from '@playwright/test'
import { prepareUser } from '@pages/shared/login'
import { ADMIN_SUITE, RAND_NUM } from '@pages/shared/constants'
import { uploadAndDescribe } from '@pages/shared/upload'
import { cleanupAssets, getAsset } from '@pages/shared/api'
import { deleteViaApi, visibleCy } from '@pages/shared/crud'
import {
  addNewAuthor,
  addNewKeyword,
  clearChips,
  fillMetadataText,
  metadataTextarea,
  openAndCancelDelete,
  openAndCancelDownload,
  openAssetDetail,
  rotateImage,
  saveMetadata,
  showMoreDetails,
} from '@pages/assets/assetDetailPage'

let page: Page
const assetIds: string[] = []
let KEYWORD_ID = ''
let AUTHOR_ID = ''

const TITLE = `TestAssetTitle${RAND_NUM}`
const DESCRIPTION = `TestDescription${RAND_NUM}`

test.describe.serial(`${ADMIN_SUITE} - Image asset`, () => {
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext()
    page = await ctx.newPage()
    await prepareUser(page)
  })

  test.afterAll(async () => {
    await cleanupAssets(page, assetIds)
    if (KEYWORD_ID) await deleteViaApi(page, `keyword/${KEYWORD_ID}`)
    if (AUTHOR_ID) await deleteViaApi(page, `author/${AUTHOR_ID}`)
    await page.context().close()
  })

  test('uploads the image test asset', async () => {
    assetIds.push(await uploadAndDescribe(page, 'image/sample.png'))
  })

  test('fills the metadata with a new keyword and author', async () => {
    await openAssetDetail(page, assetIds[0])
    await showMoreDetails(page)
    await fillMetadataText(page, 'title', TITLE)
    await fillMetadataText(page, 'description', DESCRIPTION)
    KEYWORD_ID = await addNewKeyword(page, `Keyword${RAND_NUM}`)
    AUTHOR_ID = await addNewAuthor(page, `Author${RAND_NUM}`)
    await openAndCancelDelete(page)
    await openAndCancelDownload(page)
    await saveMetadata(page)

    const asset = await getAsset(page, assetIds[0])
    expect(asset.metadata.customData).toMatchObject({ title: TITLE, description: DESCRIPTION })
    expect(asset.keywords).toEqual([KEYWORD_ID])
    expect(asset.authors).toEqual([AUTHOR_ID])
  })

  test('edits the title and description', async () => {
    await openAssetDetail(page, assetIds[0])
    await showMoreDetails(page)
    await expect(metadataTextarea(page, 'title')).toHaveValue(TITLE)
    await fillMetadataText(page, 'title', `${TITLE}-edit`)
    await fillMetadataText(page, 'description', `${DESCRIPTION}-edit`)
    await saveMetadata(page)

    const asset = await getAsset(page, assetIds[0])
    expect(asset.metadata.customData).toMatchObject({ title: `${TITLE}-edit`, description: `${DESCRIPTION}-edit` })
  })

  test('clears the metadata', async () => {
    await openAssetDetail(page, assetIds[0])
    await showMoreDetails(page)
    await fillMetadataText(page, 'title', '')
    await fillMetadataText(page, 'description', '')
    await clearChips(page, 'keywords')
    await clearChips(page, 'authors')
    await saveMetadata(page)
    await expect(visibleCy(page, 'button-meta')).toBeVisible()
    await expect(visibleCy(page, 'button-focus')).toBeVisible()
    await expect(visibleCy(page, 'button-slots')).toBeVisible()

    const asset = await getAsset(page, assetIds[0])
    expect(asset.metadata.customData.title ?? '').toBe('')
    expect(asset.metadata.customData.description ?? '').toBe('')
    expect(asset.keywords).toEqual([])
    expect(asset.authors).toEqual([])
  })

  test('rotates the image on the focus tab', async () => {
    await openAssetDetail(page, assetIds[0])
    await visibleCy(page, 'button-focus').click()
    await rotateImage(page, 'right')
    await rotateImage(page, 'left')
  })
})
