import { test, expect, type Page } from '@playwright/test'
import { prepareUser } from '@pages/shared/login'
import { ADMIN_SUITE, ALERT_UPLOAD, RAND_NUM } from '@pages/shared/constants'
import { uniqueFixtureCopy } from '@pages/shared/fixtures'
import { finishUpload, uploadFiles, waitForAssetList, waitForUpload } from '@pages/shared/upload'
import { cleanupAssets, getAsset, waitForAssetProcessed } from '@pages/shared/api'
import { deleteViaApi } from '@pages/shared/crud'
import { addNewKeyword, fillMetadataText, openAssetDetail, saveMetadata } from '@pages/assets/assetDetailPage'
import { tiles } from '@pages/assets/assetBulkEditPage'
import {
  chooseAssetType,
  chooseFilterOption,
  chooseSorting,
  colourSwatch,
  fillFilter,
  loadNextPage,
  openFilterDrawer,
  pickColourSwatch,
  pickFilterKeyword,
  resetFilter,
  submitFilter,
  submitFilterForTiles,
} from '@pages/assets/assetListFilterPage'

/**
 * Finding assets again: the filter drawer, the quick type buttons, the ordering and the list's paging.
 *
 * One filter of each kind is covered rather than all ~35 fields, since the kind is what carries the
 * behaviour — a string, an exact id, a remote autocomplete, a multi-value select, a tri-state boolean,
 * an integer range, a datetime interval and the colour palette.
 *
 * Which assets came back is asserted only for fixtures this spec uploaded, and they are pinned down by
 * `Text`: the licence holds thousands of assets that other suites and real users keep changing, so a
 * filter asserted against those would only be testing today's data. `Text` is the one filter the search
 * reliably combines with the others — `Id` does not, which is DAM-B2 below.
 */

let page: Page
let IMAGE_ID = ''
let DOCUMENT_ID = ''
let KEYWORD_ID = ''

/** Shared by both fixture titles, so one text search finds exactly this run's pair and nothing else. */
const TOKEN = `Filter${RAND_NUM}`
const TITLE_IMAGE = `${TOKEN} Img`
const TITLE_DOCUMENT = `${TOKEN} Doc`
const KEYWORD = `FilterKw${RAND_NUM}`

test.describe.serial(`${ADMIN_SUITE} - Asset list filters`, () => {
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext()
    page = await ctx.newPage()
    await prepareUser(page)
  })

  test.afterAll(async () => {
    await cleanupAssets(page, [IMAGE_ID, DOCUMENT_ID].filter(Boolean))
    if (KEYWORD_ID) await deleteViaApi(page, `keyword/${KEYWORD_ID}`)
    await page.context().close()
  })

  test('uploads an image and a document sharing one word in their titles', async () => {
    // Unique copies: an identical re-upload is stored as a duplicate, which leaves the asset a draft.
    const files = [uniqueFixtureCopy('image/sample.png'), uniqueFixtureCopy('document/sample.pdf')]
    ;[IMAGE_ID, DOCUMENT_ID] = await uploadFiles(page, files)
    await waitForUpload(page, ALERT_UPLOAD, 180000)
    await finishUpload(page)

    for (const id of [IMAGE_ID, DOCUMENT_ID]) await waitForAssetProcessed(page, id)

    for (const [id, title] of [
      [IMAGE_ID, TITLE_IMAGE],
      [DOCUMENT_ID, TITLE_DOCUMENT],
    ] as const) {
      await openAssetDetail(page, id)
      await fillMetadataText(page, 'title', title)
      await saveMetadata(page)
    }
  })

  test('tags the image with a keyword the filter can then search by', async () => {
    await openAssetDetail(page, IMAGE_ID)
    KEYWORD_ID = await addNewKeyword(page, KEYWORD)
    await saveMetadata(page)
    expect((await getAsset(page, IMAGE_ID)).keywords).toContain(KEYWORD_ID)
  })

  test('finds both fixtures by a word of their titles', async () => {
    await page.goto('/assets')
    await waitForAssetList(page)
    await openFilterDrawer(page)
    await resetFilter(page)

    await fillFilter(page, 'Text', TOKEN)
    await submitFilterForTiles(page, [TITLE_IMAGE, TITLE_DOCUMENT])
    expect((await submitFilter(page)).get('text')).toBe(TOKEN)
  })

  test('narrows a text search to one asset type', async () => {
    await chooseFilterOption(page, 'Typ', 'Dokument')

    const params = await submitFilter(page)
    expect(params.get('text')).toBe(TOKEN)
    expect(params.get('type')).toBe('document')
    // The image drops out, so the two filters are combined rather than replacing one another.
    await submitFilterForTiles(page, [TITLE_DOCUMENT])
  })

  test('splits the results by the "Popísaný" tri-state', async () => {
    await resetFilter(page)
    await fillFilter(page, 'Text', TOKEN)

    // Both fixtures were given a title, so both count as described.
    await chooseFilterOption(page, 'Popísaný', 'áno')
    expect((await submitFilter(page)).get('described')).toBe('true')
    await submitFilterForTiles(page, [TITLE_IMAGE, TITLE_DOCUMENT])

    await chooseFilterOption(page, 'Popísaný', 'nie')
    expect((await submitFilter(page)).get('described')).toBe('false')
    await submitFilterForTiles(page, [])

    // "Všetko" is the third state, and it drops the field from the query rather than sending a default.
    await chooseFilterOption(page, 'Popísaný', 'Všetko')
    expect((await submitFilter(page)).get('described')).toBeNull()
    await submitFilterForTiles(page, [TITLE_IMAGE, TITLE_DOCUMENT])
  })

  test('finds a single asset by its exact id', async () => {
    await resetFilter(page)
    await fillFilter(page, 'Id', IMAGE_ID)

    expect((await submitFilter(page)).get('assetAndMainFileIds')).toBe(IMAGE_ID)
    await submitFilterForTiles(page, [TITLE_IMAGE])
  })

  test('combines the id filter with the other filters', { tag: '@bug' }, async () => {
    test.fail() // DAM-B2: an id filter makes the search ignore every other filter — see KNOWN-BUGS.md
    test.info().annotations.push({ type: 'bug', description: 'DAM-B2' })

    await resetFilter(page)
    await fillFilter(page, 'Id', IMAGE_ID)
    await submitFilterForTiles(page, [TITLE_IMAGE])

    // The id belongs to an image, so asking for documents as well can only come back empty.
    await chooseFilterOption(page, 'Typ', 'Dokument')
    await submitFilterForTiles(page, [], 15000)
  })

  test('finds the tagged asset by its keyword', async () => {
    await resetFilter(page)
    await pickFilterKeyword(page, KEYWORD)

    expect((await submitFilter(page)).get('keywordIds')).toBe(KEYWORD_ID)
    // The keyword was created by this run, so it can only be on the image it was typed into.
    await submitFilterForTiles(page, [TITLE_IMAGE])
  })

  test('filters images by a width range around their real width', async () => {
    const width: number = (await getAsset(page, IMAGE_ID)).mainFile.imageAttributes.width

    await resetFilter(page)
    await fillFilter(page, 'Text', TOKEN)
    await fillFilter(page, 'Šírka od', String(width - 1))
    await fillFilter(page, 'Šírka do', String(width + 1))

    const params = await submitFilter(page)
    expect(params.get('widthFrom')).toBe(String(width - 1))
    expect(params.get('widthUntil')).toBe(String(width + 1))
    // The document has no width at all, so a width range drops it along with everything outside the range.
    // This is the slowest step of the spec: an image's dimensions reach the search index a good while
    // after its file is `processed`, and until they do a width range matches nothing at all.
    await submitFilterForTiles(page, [TITLE_IMAGE])
  })

  test('narrows the width range from the upper bound alone', { tag: '@bug' }, async () => {
    test.fail() // DAM-B10: an upper bound on its own keeps assets that have no width — see KNOWN-BUGS.md
    test.info().annotations.push({ type: 'bug', description: 'DAM-B10' })

    const width: number = (await getAsset(page, IMAGE_ID)).mainFile.imageAttributes.width

    // The upper bound has to bite on its own: it shares its row with "Šírka od" and binds its own field.
    // Below the image's width it drops the image, and the document has no width to be within a range at
    // all — so the pair this run uploaded is gone and the `Text` filter leaves nothing else.
    await resetFilter(page)
    await fillFilter(page, 'Text', TOKEN)
    await fillFilter(page, 'Šírka do', String(width - 1))
    expect((await submitFilter(page)).get('widthFrom')).toBeNull()
    await submitFilterForTiles(page, [], 15000)
  })

  test('filters by the created-at interval', async () => {
    await resetFilter(page)
    await fillFilter(page, 'Text', TOKEN)
    await chooseFilterOption(page, 'Vytvorené od - do', '1 deň')

    const params = await submitFilter(page)
    const from = new Date(params.get('createdAtFrom') ?? '')
    const until = new Date(params.get('createdAtUntil') ?? '')
    expect(until.getTime() - from.getTime(), 'the "1 deň" preset spans a day').toBe(24 * 60 * 60 * 1000)
    // The fixtures were uploaded minutes ago, so a one-day window has to still hold them.
    await submitFilterForTiles(page, [TITLE_IMAGE, TITLE_DOCUMENT])
  })

  test('sends the picked colour swatch as the dominant colour', async () => {
    await resetFilter(page)
    await expect(colourSwatch(page, 'red').locator('.mdi-check')).toBeHidden()

    const hex = await pickColourSwatch(page, 'red')
    // Which assets are "closest" to a palette colour is the backend's judgement, and not something a
    // fixture can be given, so this asserts the query the palette builds rather than the assets it returns.
    expect((await submitFilter(page)).get('closestMostDominantColor')).toBe(hex)
  })

  test('resets every filter but keeps the ordering', async () => {
    await chooseSorting(page, 'oldest')
    await fillFilter(page, 'Text', TOKEN)
    await chooseAssetType(page, 'image')

    const params = await resetFilter(page)
    expect(params.get('text'), 'the drawer field is cleared').toBeNull()
    expect(params.get('type'), 'the quick type button is cleared too').toBeNull()
    expect(params.get('closestMostDominantColor')).toBeNull()
    expect(params.get('order[score_date]'), 'the ordering survives a filter reset').toBe('asc')
    await expect(colourSwatch(page, 'red').locator('.mdi-check')).toBeHidden()
  })

  test('limits the list with the quick asset type buttons', async () => {
    expect((await chooseAssetType(page, 'image')).get('type')).toBe('image')
    // They toggle instead of selecting: a second type is added to the first.
    expect((await chooseAssetType(page, 'video')).get('type')).toBe('image,video')

    // "V podcastoch" is not one more type — it asks for audio that is in a podcast.
    const inPodcast = await chooseAssetType(page, 'in-podcast')
    expect(inPodcast.get('type')).toBe('audio')
    expect(inPodcast.get('inPodcast')).toBe('true')

    const all = await chooseAssetType(page, 'all')
    expect(all.get('type')).toBeNull()
    expect(all.get('inPodcast')).toBeNull()
  })

  test('orders the list by each of the three sortings', async () => {
    expect((await chooseSorting(page, 'relevant')).get('order[score_best]')).toBe('desc')
    expect((await chooseSorting(page, 'newest')).get('order[score_date]')).toBe('desc')
    expect((await chooseSorting(page, 'oldest')).get('order[score_date]')).toBe('asc')
  })

  test('loads the next page when the list is scrolled to its end', async () => {
    await resetFilter(page)
    await expect(tiles(page)).toHaveCount(25)

    expect((await loadNextPage(page)).get('offset')).toBe('25')
    // The page is appended to the grid rather than replacing it. Only the lower bound is asserted: the
    // scrolling that reaches the end of the first page can already be into the second one by then, and
    // the list answers that with a third.
    await expect(tiles(page)).not.toHaveCount(25)
    expect(await tiles(page).count(), 'the second page is appended to the first').toBeGreaterThanOrEqual(50)
  })
})
