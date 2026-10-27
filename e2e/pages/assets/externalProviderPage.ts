import { type Locator, type Page, expect } from '@playwright/test'
import { ALERT_UPLOAD, CORE_DAM_API } from '@pages/shared/constants'
import { createdAssetIds, waitForUpload } from '@pages/shared/upload'

/**
 * The view is a second asset grid fed by the provider. An active tile opens the right sidebar with
 * metadata and "Nahrať do ADAM". Ticked tiles fill the selection footer and are imported together.
 * Import POSTs `{ id, externalProvider }` to
 * `/<type>/licence/<licence>/external-provider`. The backend fetches the photo itself.
 */

export const UNSPLASH = 'unsplash_cms'

export interface ProviderPhoto {
  id: string
  url: string
  texts: { displayTitle: string }
  attributes: { assetType: string }
  metadata: Record<string, unknown>
}

export async function openProvider(page: Page, provider: string = UNSPLASH): Promise<void> {
  await page.goto(`/external-providers/${provider}`)
  await expect(providerSearchButton(page)).toBeVisible()
}

export function providerSearchButton(page: Page): Locator {
  return page.locator('nav.v-navigation-drawer').getByRole('button', { name: 'Hľadať' }).first()
}

export function providerSearchInput(page: Page): Locator {
  return page.locator('nav.v-navigation-drawer [data-cy="filter-string"] input').first()
}

export function providerTiles(page: Page): Locator {
  return page.locator('.dam-image-grid__item')
}

/**
 * The status is returned, not asserted, because callers sometimes
 * document a failure: the search is broken on every environment (DAM-B1).
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
 * The single-photo endpoint is the one provider read that works. It answers with
 * the same DTO the search would list, so `stubProviderSearch` can use real data.
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
 * Exists only because of DAM-B1: the provider search returns 500 everywhere, so nothing after it could be reached.
 * Everything after the search is real: photos are the provider's own
 * payloads (see `fetchProviderPhotos`) and the import really runs.
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

export async function activateProviderTile(page: Page, index: number): Promise<Locator> {
  const tile = providerTiles(page).nth(index)
  await expect(tile).toBeVisible()
  await tile.click()
  await expect(tile).toHaveClass(/dam-image-grid__item--active/)
  return tile
}

/**
 * The checkbox mounts only while the tile is hovered.
 * The press is repeated until the tile reports itself selected. The grid reflows
 * as the selection footer mounts and swallows a click, as in the asset list.
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

export async function importActivePhoto(page: Page): Promise<string> {
  const [id] = await createdAssetIds(page, 1, () =>
    page.getByRole('button', { name: 'Nahrať do ADAM', exact: true }).first().click()
  )
  await waitForUpload(page, ALERT_UPLOAD)
  return id
}

export async function importSelection(page: Page, count: number): Promise<string[]> {
  const button = page.getByRole('button', { name: `Nahrať do ADAM (${count})`, exact: true })
  await expect(button).toBeVisible()
  const ids = await createdAssetIds(page, count, () => button.click())
  await waitForUpload(page, ALERT_UPLOAD)
  return ids
}
