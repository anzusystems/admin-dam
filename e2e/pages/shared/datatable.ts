import { type Locator, type Page, expect } from '@playwright/test'
import { CORE_DAM_API } from '@pages/shared/constants'
import { cardLoad, exactTextMatch, filterInput } from '@pages/shared/admin'
import { visibleCy } from '@pages/shared/crud'

/**
 * The mechanics every settings datatable shares, in one place: the footer's page-size toggle and
 * paginator, the `Radenie` ordering menu, the column-configuration cog and the filter bar.
 *
 * **Sorting is not in the column headers.** No list in the app has a sortable `th` — ordering is a
 * menu button labelled `Radenie:` sitting above the table, next to the cog, and it offers exactly two
 * choices: `Najnovšie` (`order[createdAt]=desc`, the default) and `Najstaršie` (`asc`).
 *
 * Everything that changes the query goes through `withLoad`, which waits for the refetch. Waiting on
 * the rows alone is not enough: the previous result is still on screen and already looks loaded, so
 * the assertion would read the page before the one it asked for.
 */

/** The page sizes the footer offers, in the order it renders them. */
export const PAGE_SIZES = [10, 25, 50] as const
export type PageSize = (typeof PAGE_SIZES)[number]

/** The two orderings the `Radenie` menu offers. */
export const ORDERING = { newest: 'Najnovšie', oldest: 'Najstaršie' } as const

/** Which paginator button to press: the four icons around the page number. */
export type PaginatorStep = 'first' | 'prev' | 'next' | 'last'

const FOOTER = '.anzu-data-footer'

/** The body rows of the datatable. */
export function tableRows(page: Page): Locator {
  return page.locator('tbody tr')
}

/** The values of one column (0-based) across every visible row. */
export async function columnValues(page: Page, column: number): Promise<string[]> {
  return tableRows(page)
    .locator(`td:nth-child(${column + 1})`)
    .allInnerTexts()
}

/** The column titles currently rendered, the trailing actions column included (as an empty string). */
export async function tableHeaders(page: Page): Promise<string[]> {
  await expect(page.locator('thead th').first()).toBeVisible()
  return page.locator('thead th').allInnerTexts()
}

/**
 * Wait until the datatable has finished loading.
 *
 * While it loads it renders a **single placeholder row holding one cell**, which `cardLoad` does not
 * catch — count the rows at that moment and the answer is "1", read a column and the answer is nothing
 * at all. Either a real row or the explicit empty state means the load is over.
 */
export async function waitForTableLoad(page: Page): Promise<void> {
  await cardLoad(page)
  await expect
    .poll(
      async () => {
        const cells = await tableRows(page).first().locator('td').count()
        const empty = await page.locator('tbody').getByText('Žiadne dostupné dáta').count()
        return cells > 1 || empty > 0
      },
      { timeout: 15000, message: 'the datatable finished loading' }
    )
    .toBe(true)
}

/**
 * The datatable of the list fetched from `listEndpoint` (a path under `CORE_DAM_API`, e.g.
 * `/author/ext-system`), with every control that re-queries it bound to that fetch.
 */
export function datatable(page: Page, listEndpoint: string) {
  const isListCall = (url: string): boolean => url.startsWith(`${CORE_DAM_API}${listEndpoint}`)

  /**
   * Run `action`, wait for the listing it refetches, and return that request's URL — decoded, so an
   * assertion can read `limit`, `offset` and `order[createdAt]` straight out of it.
   */
  const withLoad = async (action: () => Promise<unknown>): Promise<string> => {
    const requested = page.waitForRequest((request) => isListCall(request.url()), { timeout: 30000 })
    const loaded = page.waitForResponse((response) => isListCall(response.url()), { timeout: 30000 })
    await action()
    const url = decodeURIComponent((await requested).url())
    await loaded
    await waitForTableLoad(page)
    return url
  }

  const paginatorButton = (step: PaginatorStep): Locator => {
    const group = step === 'first' || step === 'prev' ? '__icons-before' : '__icons-after'
    // Each group holds two buttons: the jump-to-end one first in `before`, last in `after`.
    const index = step === 'first' || step === 'next' ? 0 : 1
    return page.locator(`${FOOTER}${group} button`).nth(index)
  }

  /** The `Radenie` menu button — the one right before the column-configuration cog. */
  const orderingButton = (): Locator =>
    visibleCy(page, 'table-settings').locator('xpath=preceding-sibling::div[1]').getByRole('button')

  return {
    withLoad,
    rows: () => tableRows(page),
    paginatorButton,
    orderingButton,

    /** Switch the page size, e.g. to 10 — the footer's `Záznamov na stránke` toggle. */
    setPageSize: async (size: PageSize): Promise<string> => {
      const url = await withLoad(() => page.locator(`[data-cy="table-size"] button[value="${size}"]`).click())
      await expect(page.locator('[data-cy="table-size"] .v-btn--active')).toHaveText(String(size))
      return url
    },

    /** The page size the toggle reports as chosen. */
    activePageSize: async (): Promise<string> => page.locator('[data-cy="table-size"] .v-btn--active').innerText(),

    /** Step the paginator and wait for the page it fetches. */
    goTo: async (step: PaginatorStep): Promise<string> => withLoad(() => paginatorButton(step).click()),

    /** The footer's range readout, e.g. `1 - 10 od 11+`. */
    summary: async (): Promise<string> => page.locator(`${FOOTER}__pagination`).innerText(),

    /** The page number the footer shows. */
    currentPage: async (): Promise<string> => page.locator(`${FOOTER} .current-page`).innerText(),

    /** Pick an ordering from the `Radenie` menu and wait for the re-sorted list. */
    chooseOrdering: async (label: string): Promise<string> => {
      await orderingButton().click()
      const option = page.locator('.v-overlay--active .v-list-item').filter({ hasText: exactTextMatch(label) })
      const url = await withLoad(() => option.click())
      await expect(orderingButton()).toContainText(label)
      return url
    },

    /** The ordering the menu button reports. */
    currentOrdering: async (): Promise<string> => (await orderingButton().innerText()).trim(),

    /** Fill one filter field, found by its exact label, without submitting. */
    fillFilter: async (label: string | RegExp, value: string): Promise<void> => {
      await filterInput(page, label).fill(value)
    },

    /** Submit the filter bar and wait for the filtered list. */
    submitFilter: async (): Promise<string> => withLoad(() => visibleCy(page, 'filter-submit').click()),

    /** Empty the filter bar and wait for the unfiltered list. */
    resetFilter: async (): Promise<string> => withLoad(() => visibleCy(page, 'filter-reset').click()),
  }
}

// Column configuration — the cog above the table. It changes nothing server-side, so none of this
// waits for a request; the choice is kept per table in localStorage (`table_<system>_<entity>`), which
// means it survives a reload and has to be put back by whoever changed it.

/** Open the column-configuration menu and return it. */
export async function openColumnMenu(page: Page): Promise<Locator> {
  await visibleCy(page, 'table-settings').click()
  const menu = page.locator('.v-overlay--active .v-list')
  await expect(menu.getByText('Zobrazené stĺpce')).toBeVisible()
  return menu
}

/** Close the column-configuration menu. */
export async function closeColumnMenu(page: Page): Promise<void> {
  await page.keyboard.press('Escape')
  await expect(page.locator('.v-overlay--active .v-list')).toBeHidden()
}

/**
 * Show or hide one column by its title, with the menu already open. Exact match — `ID` would otherwise
 * also hit `Identifikátor`.
 */
export async function toggleColumn(page: Page, title: string): Promise<void> {
  const menu = page.locator('.v-overlay--active .v-list')
  await menu
    .locator('.v-list-item')
    .filter({ hasText: exactTextMatch(title) })
    .click()
}
