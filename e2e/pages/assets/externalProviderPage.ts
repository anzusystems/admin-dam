import { type Locator, type Page, expect } from '@playwright/test'
import { ALERT_UPLOAD, CORE_DAM_API } from '@pages/shared/constants'
import { createdAssetIds, waitForUpload } from '@pages/shared/upload'

/**
 * Importing assets from an external provider — today only Unsplash (`unsplash_cms`).
 *
 * The view is a second asset grid fed by the provider instead of by DAM. A tile can be made active,
 * which opens the right sidebar with the photo's metadata and a "Nahrať do ADAM" button, or ticked
 * through its checkbox, which fills the same selection footer the asset list uses and imports the
 * whole selection at once. Importing POSTs `{ id, externalProvider }` to
 * `/<type>/licence/<licence>/external-provider`, and the backend fetches the photo itself.
 */

export const UNSPLASH = 'unsplash_cms'

/** One photo as the provider endpoints return it. */
export interface ProviderPhoto {
  id: string
  url: string
  texts: { displayTitle: string }
  attributes: { assetType: string }
  metadata: Record<string, unknown>
}

/** Open an external provider's grid. */
export async function openProvider(page: Page, provider: string = UNSPLASH): Promise<void> {
  await page.goto(`/external-providers/${provider}`)
  await expect(providerSearchButton(page)).toBeVisible()
}

/** The "Hľadať" button of the provider view's filter drawer, which holds only a `Text` field. */
export function providerSearchButton(page: Page): Locator {
  return page.locator('nav.v-navigation-drawer').getByRole('button', { name: 'Hľadať' }).first()
}

/** The `Text` field of the provider view's filter drawer. */
export function providerSearchInput(page: Page): Locator {
  return page.locator('nav.v-navigation-drawer [data-cy="filter-string"] input').first()
}

/** The provider's result tiles. */
export function providerTiles(page: Page): Locator {
  return page.locator('.dam-image-grid__item')
}

/**
 * Search the provider for `text` and return the HTTP status of the search it fires.
 *
 * The status is returned rather than asserted because the caller is sometimes documenting a failure:
 * the search is broken on every environment (DAM-B1).
 */
export async function searchProvider(page: Page, text: string, provider: string = UNSPLASH): Promise<number> {
  const searched = page.waitForResponse(
    (response) => response.url().startsWith(`${CORE_DAM_API}/asset-external-provider/${provider}/search`),
    { timeout: 30000 }
  )
  await providerSearchInput(page).fill(text)
  await providerSearchButton(page).click()
  return (await searched).status()
}

/**
 * Fetch real photos from the provider by id, through the single-photo endpoint.
 *
 * This is the one provider read that works, and it answers with exactly the DTO the search would have
 * listed — which is what lets `stubProviderSearch` stand in for the broken search with real data rather
 * than something invented.
 */
export async function fetchProviderPhotos(
  page: Page,
  ids: string[],
  provider: string = UNSPLASH
): Promise<ProviderPhoto[]> {
  const photos: ProviderPhoto[] = []
  for (const id of ids) {
    const response = await page.request.get(`${CORE_DAM_API}/asset-external-provider/${provider}/${id}`)
    expect(response.status(), `GET provider photo ${id}`).toBe(200)
    photos.push(await response.json())
  }
  return photos
}

/**
 * Answer the provider's search with `photos` instead of letting it reach the API.
 *
 * **This stub exists only because of DAM-B1** — the provider's own search returns 500 everywhere, so
 * nothing downstream of it could be reached otherwise. Everything after the search is real: the photos
 * are the provider's own payloads (see `fetchProviderPhotos`) and the import really imports them.
 * Delete the stub once the search works.
 */
export async function stubProviderSearch(page: Page, photos: ProviderPhoto[], provider: string = UNSPLASH) {
  await page.route(`**/asset-external-provider/${provider}/search**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: photos, totalCount: photos.length }),
    })
  })
}

/** Make a result tile the active one, which opens the sidebar holding its metadata and import button. */
export async function activateProviderTile(page: Page, index: number): Promise<Locator> {
  const tile = providerTiles(page).nth(index)
  await expect(tile).toBeVisible()
  await tile.click()
  await expect(tile).toHaveClass(/dam-image-grid__item--active/)
  return tile
}

/**
 * Tick a result tile's checkbox, which only mounts while the tile is hovered. The press is repeated
 * until the tile reports itself selected — the grid reflows as the selection footer mounts, and that
 * swallows a click on its way, the same way it does in the asset list.
 */
export async function selectProviderTile(page: Page, index: number): Promise<void> {
  const tile = providerTiles(page).nth(index)
  await expect(tile).toBeVisible()
  await expect(async () => {
    if (!((await tile.getAttribute('class')) ?? '').includes('dam-image-grid__item--selected')) {
      await tile.hover()
      await tile.locator('.dam-image-grid__item-card-actions button').first().click()
    }
    await expect(tile).toHaveClass(/dam-image-grid__item--selected/, { timeout: 2000 })
  }).toPass({ timeout: 20000 })
}

/** Import the active photo through the sidebar's "Nahrať do ADAM" and return the created asset id. */
export async function importActivePhoto(page: Page): Promise<string> {
  const [id] = await createdAssetIds(page, 1, () =>
    page.getByRole('button', { name: 'Nahrať do ADAM', exact: true }).first().click()
  )
  await waitForUpload(page, ALERT_UPLOAD)
  return id
}

/**
 * Import the whole ticked selection through the footer's "Nahrať do ADAM (n)" button, which counts the
 * selection in its own label, and return the created asset ids.
 */
export async function importSelection(page: Page, count: number): Promise<string[]> {
  const button = page.getByRole('button', { name: `Nahrať do ADAM (${count})`, exact: true })
  await expect(button).toBeVisible()
  const ids = await createdAssetIds(page, count, () => button.click())
  await waitForUpload(page, ALERT_UPLOAD)
  return ids
}
