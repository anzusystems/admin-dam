import { type Locator, type Page, expect } from '@playwright/test'
import { CORE_DAM_API } from '@pages/shared/constants'
import { exactTextMatch } from '@pages/shared/admin'
import { tileSelector, tiles } from '@pages/assets/assetBulkEditPage'

/**
 * Searching and narrowing the asset list: the left filter drawer, the quick asset type buttons above it,
 * the ordering and the list's own paging.
 *
 * All of them end in the same request — `GET /asset/licence/search` — so every helper here returns that
 * request's query string. It is the only place where a filter's effect can be read in full: the list is
 * shared data, and the assets that come back can only be asserted for fixtures the spec uploaded itself.
 */

/** The asset type quick buttons of the toolbar, by the suffix of their `data-cy`. */
export type AssetType = 'all' | 'image' | 'video' | 'audio' | 'document' | 'in-podcast'

/** The orderings offered above the list, by the button that switches to them. */
const SORTING_BUTTON = {
  relevant: 'Najrelevantnejšie',
  newest: 'Najnovšie',
  oldest: 'Najstaršie',
} as const

export type Sorting = keyof typeof SORTING_BUTTON

/**
 * The filter drawer. It stays mounted while it is closed — translated off-screen to the left — so it is
 * found by a field only it has rather than by its own visibility.
 */
function filterDrawer(page: Page): Locator {
  return page
    .locator('nav.v-navigation-drawer')
    .filter({ has: page.locator('[data-cy="filter-string"]') })
    .first()
}

/** Whether the filter drawer is slid into the viewport. */
async function isFilterDrawerOpen(page: Page): Promise<boolean> {
  return ((await filterDrawer(page).getAttribute('class')) ?? '').includes('v-navigation-drawer--active')
}

/**
 * Open the filter drawer with the toolbar's `mdi-tune` toggle.
 *
 * A closed drawer is not a hidden one: its fields still fill and its "Hľadať" still reports itself
 * visible, only every click on them lands outside the viewport and times out. Opening it first is what
 * keeps a filter test from failing on an unreachable button.
 */
export async function openFilterDrawer(page: Page): Promise<void> {
  if (await isFilterDrawerOpen(page)) return
  await page.locator('button:has(.mdi-tune)').first().click()
  await expect(filterDrawer(page)).toHaveClass(/v-navigation-drawer--active/)
}

/**
 * The drawer field labelled exactly `label`. Exactness is what keeps the ranges apart — "Šírka od" sits
 * inside no other label, but "Text" sits inside several — and every label in the drawer is unique.
 */
export function filterField(page: Page, label: string): Locator {
  return filterDrawer(page)
    .locator('.v-input')
    .filter({ has: page.locator('label').getByText(label, { exact: true }) })
    .first()
}

/** Type into a text or integer filter field. Nothing is sent until the filter is submitted. */
export async function fillFilter(page: Page, label: string, value: string): Promise<void> {
  await filterField(page, label).locator('input').first().fill(value)
}

/**
 * Pick `option` in one of the drawer's select fields — the `Typ` multi-select, a tri-state boolean or the
 * created-at interval. A multi-select keeps its menu open after a pick, and that menu would swallow the
 * caller's next click, so it is closed with Escape either way.
 */
export async function chooseFilterOption(page: Page, label: string, option: string): Promise<void> {
  await filterField(page, label).click()
  const item = page
    .locator('.v-overlay--active .v-list-item')
    .filter({ hasText: exactTextMatch(option) })
    .first()
  await expect(item, `option "${option}" of filter "${label}"`).toBeVisible({ timeout: 15000 })
  await item.click()
  await page.keyboard.press('Escape')
}

/**
 * Pick an existing keyword in the drawer's "Kľúčové slová" autocomplete, which queries the API for the
 * typed text. A keyword created moments earlier takes a little to become findable, so the text is typed
 * again until the suggestion is offered.
 */
export async function pickFilterKeyword(page: Page, name: string): Promise<void> {
  const field = filterField(page, 'Kľúčové slová')
  const input = field.locator('input').first()
  const option = page.locator('.v-overlay--active .v-list-item').filter({ hasText: name }).first()

  await expect(async () => {
    await input.fill('')
    await input.fill(name)
    await expect(option, `suggestion for keyword "${name}"`).toBeVisible({ timeout: 5000 })
  }).toPass({ timeout: 60000 })

  await option.click()
  await page.keyboard.press('Escape')
  await expect(field.locator('.v-chip')).toContainText([name])
}

/** The swatch of the "Najdominantnejšia farba" palette named `colour` — its `title`, e.g. `red`. */
export function colourSwatch(page: Page, colour: string): Locator {
  return filterDrawer(page).locator(`.color-swatches__item[title="${colour}"]`)
}

/**
 * Pick a colour swatch and return the hex the palette holds for it, read back from the swatch itself so
 * no assertion has to hardcode the palette. A picked swatch marks itself with a check.
 */
export async function pickColourSwatch(page: Page, colour: string): Promise<string> {
  const swatch = colourSwatch(page, colour)
  await swatch.click()
  await expect(swatch.locator('.mdi-check')).toBeVisible()
  return swatch.evaluate((el) => {
    const [red, green, blue] = (getComputedStyle(el).backgroundColor.match(/\d+/g) ?? []).map(Number)
    return `#${[red, green, blue].map((part) => part.toString(16).padStart(2, '0')).join('')}`
  })
}

/**
 * Run `action` and return the query of the asset search it triggers, once the list has finished loading.
 *
 * Every helper below goes through this: the query string is what says which filter a control actually
 * sent, which the rendered list cannot show on shared data.
 */
export async function searchParams(page: Page, action: () => Promise<unknown>): Promise<URLSearchParams> {
  const searched = page.waitForResponse(
    (response) => response.url().startsWith(`${CORE_DAM_API}/asset/licence/search`),
    { timeout: 30000 }
  )
  await action()
  const params = new URL((await searched).url()).searchParams
  await expect(page.locator('.v-progress-linear--active'))
    .toHaveCount(0, { timeout: 20000 })
    .catch(() => {})
  return params
}

/** Submit the filter drawer with "Hľadať". */
export async function submitFilter(page: Page): Promise<URLSearchParams> {
  return searchParams(page, () => filterDrawer(page).getByRole('button', { name: 'Hľadať' }).click())
}

/**
 * Empty every filter through the drawer's `mdi-filter-remove-outline` button and search again. It clears
 * the quick type buttons along with the drawer's own fields, but leaves the ordering alone.
 */
export async function resetFilter(page: Page): Promise<URLSearchParams> {
  return searchParams(page, () => filterDrawer(page).locator('button:has(.mdi-filter-remove-outline)').click())
}

const TYPE_BUTTON: Record<AssetType, string> = {
  all: 'button-all-types',
  image: 'button-image-types',
  video: 'button-video-types',
  audio: 'button-audio-types',
  document: 'button-document-types',
  'in-podcast': 'button-in-podcast-types',
}

/**
 * Press one of the quick asset type buttons. They toggle rather than select: pressing `image` and then
 * `video` asks for both types, and `all` is what clears them again — so a press that changes nothing
 * sends no request and would time out here.
 */
export async function chooseAssetType(page: Page, type: AssetType): Promise<URLSearchParams> {
  return searchParams(page, () => page.locator(`[data-cy="${TYPE_BUTTON[type]}"]`).first().click())
}

/**
 * Switch the ordering of the list. It is common-admin's `ADatatableOrdering`: a "Radenie:" label beside a
 * button that names the ordering in effect and opens a menu of all of them. Picking the ordering already
 * in effect sends no request.
 */
export async function chooseSorting(page: Page, sorting: Sorting): Promise<URLSearchParams> {
  await page.getByText('Radenie:', { exact: true }).first().locator('xpath=following-sibling::button[1]').click()
  return searchParams(page, () =>
    page.locator('.v-overlay--active .v-list-item').filter({ hasText: SORTING_BUTTON[sorting] }).first().click()
  )
}

/**
 * The list's "no matching assets" placeholder. It renders only once the search has come back empty —
 * while the search is in flight the grid is replaced by a spinner instead — which is what makes it,
 * rather than a tile count of zero, the thing to wait for when no results are expected.
 */
export function emptyAssetList(page: Page): Locator {
  return page.getByText('Žiadne nájdené assety')
}

/**
 * Submit the filter until the list holds exactly the tiles captioned `captions`.
 *
 * An upload reaches the search index a moment after it finishes, so the first submit can legitimately
 * come back without it — re-submitting is what waits the index out. `captions` is matched in full: a
 * filter that lets something else through has to fail here, not be read as a superset.
 *
 * Expecting *no* tiles is asserted through the placeholder: the grid is emptied for the duration of
 * every search, so a bare count of zero passes in the gap between submitting and the results painting,
 * and a filter that returns the wrong assets would be read as returning none.
 */
export async function submitFilterForTiles(page: Page, captions: string[], timeout = 120000): Promise<void> {
  await expect(async () => {
    await submitFilter(page)
    if (captions.length === 0) {
      await expect(emptyAssetList(page), 'the list reports no matching assets').toBeVisible({ timeout: 5000 })
    }
    await expect(tiles(page), 'assets returned by the filter').toHaveCount(captions.length, { timeout: 5000 })
    for (const caption of captions) {
      await expect(page.locator(tileSelector(caption)), `tile "${caption}"`).toHaveCount(1, { timeout: 5000 })
    }
  }).toPass({ timeout })
}

/**
 * Scroll the list to its end and return the query of the page it loads next.
 *
 * The list pages by `offset` in steps of 25 and fetches the next page once the end of the grid scrolls
 * into view; one wheel step nowhere near reaches it from the top of a 25-tile masonry layout. The
 * scrolling stops as soon as a page has arrived — keeping the wheel down through the newly appended
 * tiles pulls in several more pages, which no caller asked for.
 */
export async function loadNextPage(page: Page): Promise<URLSearchParams> {
  let arrived = false
  const nextPage = page
    .waitForResponse(
      (response) =>
        response.url().startsWith(`${CORE_DAM_API}/asset/licence/search`) &&
        new URL(response.url()).searchParams.get('offset') !== '0',
      { timeout: 60000 }
    )
    .then((response) => {
      arrived = true
      return response
    })

  const viewport = page.viewportSize() ?? { width: 1920, height: 1080 }
  await page.mouse.move(Math.round(viewport.width / 2), Math.round(viewport.height / 2))
  for (let step = 0; step < 40; step++) {
    if (arrived) break
    await page.mouse.wheel(0, 600)
    await page.waitForTimeout(150)
  }
  return new URL((await nextPage).url()).searchParams
}
