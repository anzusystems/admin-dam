import { test, expect, type Page } from '@playwright/test'
import { prepareUser } from '@pages/shared/login'
import { ADMIN_SUITE, RAND_NUM } from '@pages/shared/constants'
import { uploadAndDescribe, waitForAssetList } from '@pages/shared/upload'
import { cleanupAssets, waitForAssetProcessed } from '@pages/shared/api'
import {
  addNewAuthor,
  addNewKeyword,
  openAndCancelDelete,
  openAndCancelDownload,
  cleanupMetadataRecords,
  clearMetadata,
  expectDetailTabs,
  expectSavedTexts,
  fillTexts,
  openAssetDetail,
  saveMetadata,
  type CreatedMetadataRecords,
} from '@pages/assets/assetDetailPage'

let page: Page
let ASSET_ID = ''
const created: CreatedMetadataRecords = { keywordIds: [], authorIds: [] }

const TITLE = `TestAssetTitle${RAND_NUM}`
const DESCRIPTION = `TestDescription${RAND_NUM}`

test.describe.serial(`${ADMIN_SUITE} - Audio asset`, () => {
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext()
    page = await ctx.newPage()
    await prepareUser(page)
  })

  test.afterAll(async () => {
    await cleanupAssets(page, ASSET_ID ? [ASSET_ID] : [])
    await cleanupMetadataRecords(page, created)
    await page.context().close()
  })

  test('uploads the audio test asset', async () => {
    // Start from a freshly loaded list: the licence switch in prepareUser reloads the admin, and a reload
    // landing mid-upload discards the upload responses.
    const listLoaded = waitForAssetList(page)
    await page.goto('/assets')
    await listLoaded
    ASSET_ID = await uploadAndDescribe(page, 'audio/sample.mp3')
    // sample.mp3 may already exist in the licence, which marks the upload a duplicate — still editable.
    await waitForAssetProcessed(page, ASSET_ID, { done: ['processed', 'duplicate'] })
  })

  test('fills in the metadata', async () => {
    await openAssetDetail(page, ASSET_ID)
    await fillTexts(page, { title: TITLE, description: DESCRIPTION })
    created.keywordIds.push(await addNewKeyword(page, `Keyword${RAND_NUM}`))
    created.authorIds.push(await addNewAuthor(page, `Author${RAND_NUM}`))
    await openAndCancelDelete(page)
    await openAndCancelDownload(page)
    await saveMetadata(page)
    await expectSavedTexts(page, ASSET_ID, { title: TITLE, description: DESCRIPTION })
  })

  test('edits the metadata', async () => {
    await openAssetDetail(page, ASSET_ID)
    await fillTexts(page, { title: `${TITLE}-edit`, description: DESCRIPTION })
    await saveMetadata(page)
    await expectSavedTexts(page, ASSET_ID, { title: `${TITLE}-edit`, description: DESCRIPTION })
  })

  test('clears the metadata', async () => {
    await openAssetDetail(page, ASSET_ID)
    await clearMetadata(page)
    await saveMetadata(page)
    await expectSavedTexts(page, ASSET_ID, { title: '', description: '' })
    await expect(page.locator('[data-cy="custom-field-keywords"] .v-chip')).toHaveCount(0)
    await expect(page.locator('[data-cy="custom-field-authors"] .v-chip')).toHaveCount(0)
    await expectDetailTabs(page, ['button-meta', 'button-distribution', 'button-podcast', 'button-slots'])
  })
})
