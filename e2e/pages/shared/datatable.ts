import { type Locator, type Page, expect } from '@playwright/test'
import { CORE_DAM_API } from '@pages/shared/constants'
import { cardLoad, exactTextMatch, filterInput } from '@pages/shared/admin'
import { visibleCy } from '@pages/shared/crud'

/**
 * Sorting is not in the column headers. No list has a sortable `th`. Ordering is the `Radenie:` menu button above the
 * table, next to the cog, with two choices: `Najnovšie` (`order[createdAt]=desc`, default) and `Najstaršie` (`asc`).
 * Everything that changes the query goes through `withLoad`, which waits for the refetch. Waiting
 * on rows alone is not enough: the previous result is still on screen and already looks loaded.
 */

export const PAGE_SIZES = [10, 25, 50] as const
export type PageSize = (typeof PAGE_SIZES)[number]

export const ORDERING = { newest: 'Najnovšie', oldest: 'Najstaršie' } as const

export type PaginatorStep = 'first' | 'prev' | 'next' | 'last'

const FOOTER = '.anzu-data-footer'

export function tableRows(page: Page): Locator {
  return page.locator('tbody tr')
}

export async function columnValues(page: Page, column: number): Promise<string[]> {
  return tableRows(page)
    .locator(`td:nth-child(${column + 1})`)
    .allInnerTexts()
}

export async function tableHeaders(page: Page): Promise<string[]> {
  await expect(page.locator('thead th').first()).toBeVisible()
  return page.locator('thead th').allInnerTexts()
}

/**
 * While loading, the datatable renders a single placeholder row with one cell, which
 * `cardLoad` does not catch. Counting rows then gives 1, and reading a column gives nothing.
 * Either a real row or the explicit empty state means the load is over.
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

export function datatable(page: Page, listEndpoint: string) {
  const isListCall = (url: string): boolean => url.startsWith(`${CORE_DAM_API}${listEndpoint}`)

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
    const index = step === 'first' || step === 'next' ? 0 : 1
    return page.locator(`${FOOTER}${group} button`).nth(index)
  }

  const orderingButton = (): Locator =>
    visibleCy(page, 'table-settings').locator('xpath=preceding-sibling::div[1]').getByRole('button')

  return {
    withLoad,
    rows: () => tableRows(page),
    paginatorButton,
    orderingButton,

    setPageSize: async (size: PageSize): Promise<string> => {
      const url = await withLoad(() => page.locator(`[data-cy="table-size"] button[value="${size}"]`).click())
      await expect(page.locator('[data-cy="table-size"] .v-btn--active')).toHaveText(String(size))
      return url
    },

    activePageSize: async (): Promise<string> => page.locator('[data-cy="table-size"] .v-btn--active').innerText(),

    goTo: async (step: PaginatorStep): Promise<string> => withLoad(() => paginatorButton(step).click()),

    summary: async (): Promise<string> => page.locator(`${FOOTER}__pagination`).innerText(),

    currentPage: async (): Promise<string> => page.locator(`${FOOTER} .current-page`).innerText(),

    chooseOrdering: async (label: string): Promise<string> => {
      await orderingButton().click()
      const option = page.locator('.v-overlay--active .v-list-item').filter({ hasText: exactTextMatch(label) })
      const url = await withLoad(() => option.click())
      await expect(orderingButton()).toContainText(label)
      return url
    },

    currentOrdering: async (): Promise<string> => (await orderingButton().innerText()).trim(),

    fillFilter: async (label: string | RegExp, value: string): Promise<void> => {
      await filterInput(page, label).fill(value)
    },

    submitFilter: async (): Promise<string> => withLoad(() => visibleCy(page, 'filter-submit').click()),

    resetFilter: async (): Promise<string> => withLoad(() => visibleCy(page, 'filter-reset').click()),
  }
}

// Column configuration changes nothing server-side, so nothing here waits for a request.
// The choice is kept per table in localStorage (`table_<system>_<entity>`).
// It survives a reload and must be restored by whoever changed it.

export async function openColumnMenu(page: Page): Promise<Locator> {
  await visibleCy(page, 'table-settings').click()
  const menu = page.locator('.v-overlay--active .v-list')
  await expect(menu.getByText('Zobrazené stĺpce')).toBeVisible()
  return menu
}

export async function closeColumnMenu(page: Page): Promise<void> {
  await page.keyboard.press('Escape')
  await expect(page.locator('.v-overlay--active .v-list')).toBeHidden()
}

/** Exact match, so `ID` does not also hit `Identifikátor`. */
export async function toggleColumn(page: Page, title: string): Promise<void> {
  const menu = page.locator('.v-overlay--active .v-list')
  await menu
    .locator('.v-list-item')
    .filter({ hasText: exactTextMatch(title) })
    .click()
}
