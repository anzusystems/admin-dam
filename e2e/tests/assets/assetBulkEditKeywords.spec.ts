import { test, expect, type Page } from '@playwright/test'
import { prepareUser } from '@pages/shared/login'
import { ADMIN_SUITE, ALERT_UPLOAD, RAND_NUM } from '@pages/shared/constants'
import { reloadUntilVisible } from '@pages/shared/admin'
import { uniqueFixtureCopy } from '@pages/shared/fixtures'
import { finishUpload, uploadFiles, waitForAssetList, waitForUpload } from '@pages/shared/upload'
import { cleanupAssets, getAsset } from '@pages/shared/api'
import { deleteViaApi } from '@pages/shared/crud'
import {
  addNewAuthor,
  addNewKeyword,
  fillMetadataText,
  openAssetDetail,
  saveMetadata,
} from '@pages/assets/assetDetailPage'
import {
  addMassAuthor,
  addMassKeyword,
  applyMass,
  clearSelection,
  expectSelectedCount,
  openMassOperations,
  openSelectionEditor,
  saveSelection,
  selectTile,
  tileSelector,
  tileWithCaption,
} from '@pages/assets/assetBulkEditPage'

/**
 * Mass operations on the two chip fields. They are the reason the feature exists — tagging a batch of
 * freshly uploaded photos with one keyword and one author — and they go through autocompletes and their
 * own store mutations rather than the plain text path the sibling spec covers.
 */

let page: Page
/** The three uploaded assets, in upload order. */
const assetIds: string[] = []
/** Keywords and authors created along the way, deleted in `afterAll`. */
const keywordIds: string[] = []
const authorIds: string[] = []

const TITLE = (index: number) => `BulkKw${index}${RAND_NUM}`
const SEEDED = `BulkSeeded${RAND_NUM}`
const FILLED = `BulkFilledKw${RAND_NUM}`
const REPLACED = `BulkReplacedKw${RAND_NUM}`

/** Keyword and author ids of each asset as the API has them, in upload order. */
async function savedChips(): Promise<Array<{ keywords: string[]; authors: string[] }>> {
  const chips = []
  for (const id of assetIds) {
    const asset = await getAsset(page, id)
    chips.push({ keywords: asset.keywords, authors: asset.authors })
  }
  return chips
}

/** Select all three uploaded assets and open the mass operations form on them. */
async function selectUploadedAssets(): Promise<void> {
  await page.goto('/assets')
  await waitForAssetList(page)
  for (const index of [0, 1, 2]) await reloadUntilVisible(page, tileSelector(TITLE(index)))

  // By caption, not by position: a batch shares a `createdAt` second and comes back in no fixed order.
  for (const index of [0, 1, 2]) await selectTile(page, await tileWithCaption(page, TITLE(index)))
  await expectSelectedCount(page, 3)
  await openSelectionEditor(page, 3)
  await openMassOperations(page)
}

test.describe.serial(`${ADMIN_SUITE} - Asset bulk edit keywords and authors`, () => {
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext()
    page = await ctx.newPage()
    await prepareUser(page)
  })

  test.afterAll(async () => {
    await cleanupAssets(page, assetIds)
    for (const id of keywordIds) await deleteViaApi(page, `keyword/${id}`)
    for (const id of authorIds) await deleteViaApi(page, `author/${id}`)
    await page.context().close()
  })

  test('uploads three assets and tags the newest one', async () => {
    const files = [0, 1, 2].map(() => uniqueFixtureCopy('image/sample.png'))
    assetIds.push(...(await uploadFiles(page, files)))
    // Three files at once can take devel past the default 90s window.
    await waitForUpload(page, ALERT_UPLOAD, 180000)
    await finishUpload(page)

    // A title per asset, so the tiles can be told apart; only the last one gets a keyword and an author.
    for (const [index, id] of assetIds.entries()) {
      await openAssetDetail(page, id)
      await fillMetadataText(page, 'title', TITLE(index))
      if (index === 2) {
        keywordIds.push(await addNewKeyword(page, `${SEEDED}kw`))
        authorIds.push(await addNewAuthor(page, `${SEEDED}au`))
      }
      await saveMetadata(page)
    }

    expect(await savedChips()).toEqual([
      { keywords: [], authors: [] },
      { keywords: [], authors: [] },
      { keywords: [keywordIds[0]], authors: [authorIds[0]] },
    ])
  })

  test('"Vyplňte prázdne pole" tags only the assets that have no keyword or author yet', async () => {
    await selectUploadedAssets()
    keywordIds.push(await addMassKeyword(page, `${FILLED}kw`))
    authorIds.push(await addMassAuthor(page, `${FILLED}au`))
    await applyMass(page, 'keywords', 'fill-empty')
    await applyMass(page, 'authors', 'fill-empty')
    await saveSelection(page)

    expect(await savedChips()).toEqual([
      { keywords: [keywordIds[1]], authors: [authorIds[1]] },
      { keywords: [keywordIds[1]], authors: [authorIds[1]] },
      // Already tagged, so the fill left it alone.
      { keywords: [keywordIds[0]], authors: [authorIds[0]] },
    ])
  })

  test('"Nahradiť všade" replaces the keyword and author of every selected asset', async () => {
    await selectUploadedAssets()
    keywordIds.push(await addMassKeyword(page, `${REPLACED}kw`))
    authorIds.push(await addMassAuthor(page, `${REPLACED}au`))
    await applyMass(page, 'keywords', 'replace-all')
    await applyMass(page, 'authors', 'replace-all')
    await saveSelection(page)

    const replaced = { keywords: [keywordIds[2]], authors: [authorIds[2]] }
    expect(await savedChips()).toEqual([replaced, replaced, replaced])
  })

  test('clearing the selection discards an unsaved tagging', async () => {
    await selectUploadedAssets()
    keywordIds.push(await addMassKeyword(page, `${REPLACED}kw2`))
    await applyMass(page, 'keywords', 'replace-all')

    await clearSelection(page)
    const replaced = { keywords: [keywordIds[2]], authors: [authorIds[2]] }
    expect(await savedChips()).toEqual([replaced, replaced, replaced])
  })
})
