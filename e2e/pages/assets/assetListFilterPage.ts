import { type Locator, type Page, expect } from '@playwright/test'
import { CORE_DAM_API } from '@pages/shared/constants'
import { exactTextMatch } from '@pages/shared/admin'
import { tileSelector, tiles } from '@pages/assets/assetBulkEditPage'

/**
 * All helpers here end in `GET /asset/licence/search` and return that request's query string.
 * The query string is the only full view of a filter's effect. The list is shared
 * data, so returned assets can only be asserted for fixtures the spec uploaded itself.
 */

export type AssetType = 'all' | 'image' | 'video' | 'audio' | 'document' | 'in-podcast'

const SORTING_BUTTON = {
  relevant: 'Najrelevantnejšie',
  newest: 'Najnovšie',
  oldest: 'Najstaršie',
} as const

export type Sorting = keyof typeof SORTING_BUTTON

/**
 * The drawer stays mounted while closed, translated off-screen to the left.
 * It is found by a field only it has, not by its own visibility.
 */
function filterDrawer(page: Page): Locator {
  return page
    .locator('nav.v-navigation-drawer')
    .filter({ has: page.locator('[data-cy="filter-string"]') })
    .first()
}

async function isFilterDrawerOpen(page: Page): Promise<boolean> {
  return ((await filterDrawer(page).getAttribute('class')) ?? '').includes('v-navigation-drawer--active')
}

/**
 * A closed drawer is not hidden: its fields still fill and "Hľadať" reports itself visible.
 * Clicks on them land outside the viewport and time out, so the drawer is opened first.
 */
export async function openFilterDrawer(page: Page): Promise<void> {
  if (await isFilterDrawerOpen(page)) return
  await page.locator('button:has(.mdi-tune)').first().click()
  await expect(filterDrawer(page)).toHaveClass(/v-navigation-drawer--active/)
}

/**
 * Exact match keeps the ranges apart: "Text" appears inside several labels. Every label in the drawer is unique.
 */
export function filterField(page: Page, label: string): Locator {
  return filterDrawer(page)
    .locator('.v-input')
    .filter({ has: page.locator('label').getByText(label, { exact: true }) })
    .first()
}

/**
 * Nothing is sent until the filter is submitted.
 */
export async function fillFilter(page: Page, label: string, value: string): Promise<void> {
  await filterField(page, label).locator('input').first().fill(value)
}

/**
 * A multi-select keeps its menu open after a pick and the menu
 * would swallow the next click, so it is closed with Escape.
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
 * The autocomplete queries the API for the typed text.
 * A keyword created moments earlier takes a while to become
 * findable, so the text is typed again until the suggestion appears.
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

export function colourSwatch(page: Page, colour: string): Locator {
  return filterDrawer(page).locator(`.color-swatches__item[title="${colour}"]`)
}

/**
 * The hex is read back from the swatch itself so no assertion hardcodes the palette.
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
 * The query string shows which filter a control actually sent. The rendered list cannot show that on shared data.
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

export async function submitFilter(page: Page): Promise<URLSearchParams> {
  return searchParams(page, () => filterDrawer(page).getByRole('button', { name: 'Hľadať' }).click())
}

/**
 * Also clears the quick type buttons, but leaves the ordering alone.
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
 * The buttons toggle: `image` then `video` asks for both types, and `all` clears them.
 * A press that changes nothing sends no request and times out.
 */
export async function chooseAssetType(page: Page, type: AssetType): Promise<URLSearchParams> {
  return searchParams(page, () => page.locator(`[data-cy="${TYPE_BUTTON[type]}"]`).first().click())
}

/**
 * Common-admin `ADatatableOrdering`: a "Radenie:" label beside a button that opens the menu.
 * Picking the ordering already in effect sends no request.
 */
export async function chooseSorting(page: Page, sorting: Sorting): Promise<URLSearchParams> {
  await page.getByText('Radenie:', { exact: true }).first().locator('xpath=following-sibling::button[1]').click()
  return searchParams(page, () =>
    page.locator('.v-overlay--active .v-list-item').filter({ hasText: SORTING_BUTTON[sorting] }).first().click()
  )
}

/**
 * The placeholder renders only once the search has come back empty. During the search a spinner replaces the grid.
 * So wait for it, not for a tile count of zero, when no results are expected.
 */
export function emptyAssetList(page: Page): Locator {
  return page.getByText('Žiadne nájdené assety')
}

/**
 * An upload reaches the search index a moment after it finishes, so the
 * first submit can come back without it. Re-submitting waits the index out.
 * `captions` is matched in full, so a filter that lets extra assets through fails.
 * Zero tiles is asserted through the placeholder: the grid is empty during
 * every search, so a bare count of zero passes before results paint.
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
 * The list pages by `offset` in steps of 25 and loads the next page when
 * the end of the grid scrolls into view. One wheel step does not reach it.
 * Scrolling stops once a page has arrived. Continuing through the appended tiles loads extra pages.
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
