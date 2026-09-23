import { test, expect, type Page } from '@playwright/test'
import { prepareUser } from '@pages/shared/login'
import { ADMIN_SUITE, ALERT_UPLOAD, RAND_NUM } from '@pages/shared/constants'
import { reloadUntilVisible } from '@pages/shared/admin'
import { uniqueFixtureCopy } from '@pages/shared/fixtures'
import { finishUpload, uploadAndDescribe, uploadFiles, waitForAssetList, waitForUpload } from '@pages/shared/upload'
import { cleanupAssets, getAsset, waitForAssetProcessed } from '@pages/shared/api'
import { expectApiStatus } from '@pages/shared/crud'
import { fillMetadataText, openAssetDetail, saveMetadata } from '@pages/assets/assetDetailPage'
import {
  applyMass,
  applyMassForm,
  clearMassForm,
  clearSelection,
  copyRowAssetId,
  deleteSelectionRow,
  expectSelectedCount,
  fieldTextarea,
  fillMassText,
  massSidebar,
  openMassOperations,
  openSelectionEditor,
  rowTexts,
  saveSelection,
  saveSelectionKeepingOpen,
  selectTile,
  tileSelector,
  tileWithCaption,
  tiles,
} from '@pages/assets/assetBulkEditPage'

let page: Page
/** The three uploaded assets, in upload order. The middle one is left without a description. */
const assetIds: string[] = []
/** Assets outside that trio — kept apart so `saved()` never re-fetches one the tests deleted. */
const extraIds: string[] = []

/** Titles caption the tiles, which is how the three are told apart — so they stay unique until the end. */
const TITLE = (index: number) => `BulkTitle${index}${RAND_NUM}`
const TITLE_DOOMED = `BulkDoomed${RAND_NUM}`
const TITLE_REPLACED = `BulkReplaced${RAND_NUM}`

const DESCRIPTION_SEEDED = (index: number) => `BulkSeededDesc${index}${RAND_NUM}`
const DESCRIPTION_FILLED = `BulkFilledDesc${RAND_NUM}`
const DESCRIPTION_FORM = `BulkFormDesc${RAND_NUM}`
const DESCRIPTION_DISCARDED = `BulkDiscardedDesc${RAND_NUM}`

/** A metadata field of each asset as the API has it, in upload order. */
async function saved(field: 'title' | 'description'): Promise<string[]> {
  const values: string[] = []
  for (const id of assetIds) {
    values.push((await getAsset(page, id)).metadata?.customData?.[field] ?? '')
  }
  return values
}

/** Open the asset list and wait until the uploads have reached the search index. */
async function openListWithUploads(): Promise<void> {
  await page.goto('/assets')
  await waitForAssetList(page)
  for (const index of [0, 1, 2]) await reloadUntilVisible(page, tileSelector(TITLE(index)))
}

/**
 * Select the three uploaded assets by their titles, in upload order, and open the editor on them.
 * Selecting them in a fixed order is what makes the editor rows line up with `assetIds`.
 */
async function selectUploadedAssets(): Promise<void> {
  await openListWithUploads()
  for (const index of [0, 1, 2]) {
    await selectTile(page, await tileWithCaption(page, TITLE(index)))
  }
  await expectSelectedCount(page, 3)
  await openSelectionEditor(page, 3)
}

test.describe.serial(`${ADMIN_SUITE} - Asset bulk edit`, () => {
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext()
    page = await ctx.newPage()
    await prepareUser(page)
  })

  test.afterAll(async () => {
    await cleanupAssets(page, [...assetIds, ...extraIds])
    await page.context().close()
  })

  test('uploads three assets, titles them all and describes the outer two', async () => {
    // Unique copies: an identical re-upload is stored as a duplicate, which leaves the asset a draft.
    const files = [0, 1, 2].map(() => uniqueFixtureCopy('image/sample.png'))
    assetIds.push(...(await uploadFiles(page, files)))
    // Three files at once can take devel past the default 90s window.
    await waitForUpload(page, ALERT_UPLOAD, 180000)
    await finishUpload(page)

    for (const id of assetIds) await waitForAssetProcessed(page, id)

    for (const [index, id] of assetIds.entries()) {
      await openAssetDetail(page, id)
      await fillMetadataText(page, 'title', TITLE(index))
      // The middle one keeps an empty description, for the mass operations to fill.
      if (index !== 1) await fillMetadataText(page, 'description', DESCRIPTION_SEEDED(index))
      await saveMetadata(page)
    }

    expect(await saved('title')).toEqual([TITLE(0), TITLE(1), TITLE(2)])
    expect(await saved('description')).toEqual([DESCRIPTION_SEEDED(0), '', DESCRIPTION_SEEDED(2)])
  })

  test('"Vyplňte prázdne pole" writes only into the asset without a description', async () => {
    await selectUploadedAssets()
    await openMassOperations(page)
    await fillMassText(page, 'description', DESCRIPTION_FILLED)
    await applyMass(page, 'description', 'fill-empty')

    // The rows follow the order the tiles were selected in, which is the upload order.
    const filled = [DESCRIPTION_SEEDED(0), DESCRIPTION_FILLED, DESCRIPTION_SEEDED(2)]
    expect(await rowTexts(page, 'description')).toEqual(filled)

    await saveSelection(page)
    expect(await saved('description')).toEqual(filled)
  })

  // Only selects, never edits, so it can take the tiles by position without knowing which assets they are.
  test('Ctrl+click toggles one asset and Shift+click takes the range', async () => {
    await openListWithUploads()
    const first = tiles(page).nth(0)
    const last = tiles(page).nth(2)

    await selectTile(page, first, ['Control'])
    await expectSelectedCount(page, 1)
    await first.click({ modifiers: ['Control'] })
    await expectSelectedCount(page, 0)

    await selectTile(page, first)
    await selectTile(page, last, ['Shift'])
    await expectSelectedCount(page, 3)

    await clearSelection(page)
  })

  test('clearing the selection discards the unsaved mass edit', async () => {
    await selectUploadedAssets()
    await openMassOperations(page)
    await fillMassText(page, 'description', DESCRIPTION_DISCARDED)
    await applyMass(page, 'description', 'replace-all')
    expect(await rowTexts(page, 'description')).toEqual(Array(3).fill(DESCRIPTION_DISCARDED))

    await clearSelection(page)
    expect(await saved('description')).toEqual([DESCRIPTION_SEEDED(0), DESCRIPTION_FILLED, DESCRIPTION_SEEDED(2)])
  })

  test('"Nahradiť všetko" applies the whole form, and "Vyčistiť" empties only the form', async () => {
    await selectUploadedAssets()
    await openMassOperations(page)
    await fillMassText(page, 'description', DESCRIPTION_FORM)
    await applyMassForm(page, 'replace-all')
    expect(await rowTexts(page, 'description')).toEqual(Array(3).fill(DESCRIPTION_FORM))

    await clearMassForm(page)
    await expect(fieldTextarea(massSidebar(page), 'description')).toHaveValue('')
    // The rows keep what was applied to them — only the form the values came from is emptied.
    expect(await rowTexts(page, 'description')).toEqual(Array(3).fill(DESCRIPTION_FORM))

    // The second save button writes the same way, but leaves the selection open to carry on editing.
    await saveSelectionKeepingOpen(page, 3)
    expect(await saved('description')).toEqual(Array(3).fill(DESCRIPTION_FORM))
    await clearSelection(page)
  })

  test('the trash button of a row deletes that asset', async () => {
    const doomedId = await uploadAndDescribe(page, uniqueFixtureCopy('image/sample.png'), TITLE_DOOMED)
    extraIds.push(doomedId)
    await waitForAssetProcessed(page, doomedId)

    await page.goto('/assets')
    await waitForAssetList(page)
    await reloadUntilVisible(page, tileSelector(TITLE_DOOMED))
    await selectTile(page, await tileWithCaption(page, TITLE_DOOMED))
    await openSelectionEditor(page, 1)

    expect(await copyRowAssetId(page, 0)).toBe(doomedId)
    await deleteSelectionRow(page, 0)

    // The asset is gone for good — the trash button is a delete, not a way to drop the row. The grid
    // keeps showing its tile until the list is fetched again, so the API is what gets asserted here.
    // Polled rather than read once: the delete is accepted before it is carried out, and the asset
    // answers 200 for a moment after the alert says it is gone.
    await expectApiStatus(page, `asset/${doomedId}`, 404)
  })

  // Runs last: it makes all three titles identical, and the tiles can then no longer be told apart.
  test('"Nahradiť všade" overwrites the title of every selected asset', async () => {
    await selectUploadedAssets()
    await openMassOperations(page)
    await fillMassText(page, 'title', TITLE_REPLACED)
    await applyMass(page, 'title', 'replace-all')

    expect(await rowTexts(page, 'title')).toEqual(Array(3).fill(TITLE_REPLACED))

    await saveSelection(page)
    expect(await saved('title')).toEqual(Array(3).fill(TITLE_REPLACED))
  })
})
