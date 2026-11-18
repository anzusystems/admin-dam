import { test, expect, type Page, type Request } from '@playwright/test'
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
 * The provider's search is broken (DAM-B1): it answers 500 for every query on every environment. The admin sent the
 * text as `text` while core-dam reads `term`, so every search reached Unsplash empty (fixed in the admin), and
 * core-dam also fails on Unsplash's answer to a real query (`UnsplashImageDto::$tags` read before it is set,
 * Sentry ANZU-CORE-DAM-2YD). The import tests stub only the search response. The payload is fetched live from the
 * provider's single-photo endpoint, and the import really imports those photos into DAM.
 * Delete `stubProviderSearch` and this note once the search is fixed.
 */

let page: Page
let photos: ProviderPhoto[] = []
const importedIds: string[] = []

/**
 * Real Unsplash photo ids. If a photo is taken down, `fetchProviderPhotos` fails on that id.
 * Fix it by swapping the id, not by loosening the test. A photo Unsplash sends without tags fails too, on core-dam's
 * side (`UnsplashImageDto::$tags`, ANZU-CORE-DAM-2YD): `jFCViYFYcus` did from 2026-11-09 and was swapped.
 */
const PHOTO_IDS = ['zNN6ubHmruI', 'eOpewngf68w', 'CQl3Y5bV6FA']

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

  // Unsplash refuses an empty query, so the page asks it nothing until a term is typed.
  test('opens the Unsplash grid with its search form, and searches nothing before a term is typed', async () => {
    const searches: string[] = []
    const onRequest = (request: Request) => {
      if (request.url().includes('/asset-external-provider/unsplash_cms/search')) searches.push(request.url())
    }
    page.on('request', onRequest)
    await openProvider(page)
    expect(page.url()).toContain('/external-providers/unsplash_cms')
    await expect(providerSearchInput(page)).toBeVisible()
    await expect(page.getByText('Zadajte hľadaný výraz', { exact: true })).toBeVisible()
    page.off('request', onRequest)
    expect(searches, 'the page should not search before a term is typed').toEqual([])
  })

  test('searches Unsplash and lists the results', { tag: '@bug' }, async () => {
    test.fail() // TODO: DAM-B1 (task #87413), drop once the provider search stops answering 500 for every query
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
    expect(await searchProvider(page, 'forest'), 'the stubbed search').toBe(200)
    await expect(providerTiles(page)).toHaveCount(photos.length)

    await activateProviderTile(page, 0)
    const assetId = await importActivePhoto(page)
    importedIds.push(assetId)
    await finishUpload(page)

    const asset = await waitForAssetProcessed(page, assetId)
    expect(asset.attributes.assetType).toBe('image')
    expect(asset.texts.displayTitle).toBe(photos[0].texts.displayTitle)
  })

  test('imports a ticked selection in one go', async () => {
    await openProvider(page)
    expect(await searchProvider(page, 'forest'), 'the stubbed search').toBe(200)
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
