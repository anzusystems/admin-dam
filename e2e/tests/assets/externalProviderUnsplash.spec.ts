import { test, expect, type Page } from '@playwright/test'
import { prepareUser } from '@pages/shared/login'
import { ADMIN_SUITE, ALERT_SYSTEM_ERROR } from '@pages/shared/constants'
import { cleanupAssets, getAsset, waitForAssetProcessed } from '@pages/shared/api'
import { finishUpload } from '@pages/shared/upload'
import {
  activateProviderTile,
  fetchProviderPhotos,
  importActivePhoto,
  importSelection,
  openProvider,
  providerSearchInput,
  providerTiles,
  searchProvider,
  selectProviderTile,
  stubProviderSearch,
  type ProviderPhoto,
} from '@pages/assets/externalProviderPage'

/**
 * Importing photos from Unsplash into the current licence.
 *
 * **The provider's search is broken (DAM-B1)** — it answers 500 on every environment and for every
 * query, which is what the second test documents. Everything reachable only through a result tile
 * would be untestable if the spec stopped there, so the import tests stand the search's response in
 * locally. That stub is the *only* thing faked: its payload is fetched live from the provider's
 * working single-photo endpoint, and the import it feeds really imports those photos into DAM.
 * Delete `stubProviderSearch` and this note once the search is fixed.
 */

let page: Page
/** Photos fetched once and reused as the stubbed search results. */
let photos: ProviderPhoto[] = []
/** Everything imported into DAM, deleted in `afterAll`. */
const importedIds: string[] = []

/**
 * Unsplash photo ids that resolved through the provider. They are real, so a photo taken down at
 * Unsplash would make `fetchProviderPhotos` fail on that id — which is the right failure, and is fixed
 * by swapping the id rather than by loosening the test.
 */
const PHOTO_IDS = ['zNN6ubHmruI', 'jFCViYFYcus', 'CQl3Y5bV6FA']

test.describe.serial(`${ADMIN_SUITE} - Unsplash external provider`, () => {
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext()
    page = await ctx.newPage()
    await prepareUser(page)
  })

  test.afterAll(async () => {
    await cleanupAssets(page, importedIds)
    await page.context().close()
  })

  test('opens the Unsplash grid with its search form', async () => {
    await openProvider(page)
    expect(page.url()).toContain('/external-providers/unsplash_cms')
    await expect(providerSearchInput(page)).toBeVisible()
  })

  test('searches Unsplash and lists the results', { tag: '@bug' }, async () => {
    test.fail() // DAM-B1: the provider search answers 500 for every query — see KNOWN-BUGS.md
    test.info().annotations.push({ type: 'bug', description: 'DAM-B1' })

    const status = await searchProvider(page, 'forest')
    expect(status, 'GET asset-external-provider/unsplash_cms/search').toBe(200)
    await expect(page.locator('.v-alert').filter({ hasText: ALERT_SYSTEM_ERROR })).toHaveCount(0)
    await expect(providerTiles(page).first()).toBeVisible()
  })

  test('imports the active photo into the current licence', async () => {
    photos = await fetchProviderPhotos(page, PHOTO_IDS)
    await stubProviderSearch(page, photos)
    await openProvider(page)
    await expect(providerTiles(page)).toHaveCount(photos.length)

    await activateProviderTile(page, 0)
    const assetId = await importActivePhoto(page)
    importedIds.push(assetId)
    await finishUpload(page)

    // The import is real even though the search was not: DAM fetched the photo and stored it.
    const asset = await waitForAssetProcessed(page, assetId)
    expect(asset.attributes.assetType).toBe('image')
    expect(asset.texts.displayTitle).toBe(photos[0].texts.displayTitle)
  })

  test('imports a ticked selection in one go', async () => {
    await openProvider(page)
    await expect(providerTiles(page)).toHaveCount(photos.length)

    // The two photos the single import did not take, so the assertion cannot pass on a leftover.
    await selectProviderTile(page, 1)
    await selectProviderTile(page, 2)

    const assetIds = await importSelection(page, 2)
    importedIds.push(...assetIds)
    await finishUpload(page)

    expect(assetIds).toHaveLength(2)
    expect(new Set(assetIds).size, 'each selected photo becomes its own asset').toBe(2)

    const titles: string[] = []
    for (const id of assetIds) titles.push((await getAsset(page, id)).texts.displayTitle)
    expect(titles.sort()).toEqual([photos[1].texts.displayTitle, photos[2].texts.displayTitle].sort())
  })
})
