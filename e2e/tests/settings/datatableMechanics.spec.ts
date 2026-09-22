import { test, expect, type Page } from '@playwright/test'
import { prepareUser } from '@pages/shared/login'
import { ADMIN_SUITE } from '@pages/shared/constants'
import {
  ORDERING,
  closeColumnMenu,
  datatable,
  openColumnMenu,
  tableHeaders,
  tableRows,
  toggleColumn,
  waitForTableLoad,
} from '@pages/shared/datatable'

/**
 * The datatable mechanics every settings list shares: the page-size toggle, the paginator, the
 * `Radenie` ordering menu and the column-configuration cog. Covered once, here, on the authors list —
 * the longest one that no other spec reads back — through the helpers in `pages/shared/datatable.ts`.
 *
 * **Ordering is not in the column headers.** No list in the app renders a sortable `th`; the ordering
 * menu above the table offers `Najnovšie` and `Najstaršie` and nothing else.
 *
 * Every assertion here is about mechanics rather than content: the list is written to by other specs
 * (and by a parallel worker), so a page is pinned down by the `limit`/`offset` it asks for and by the
 * footer's readout, never by which authors happen to be on it.
 */

let page: Page

/** The authors list — `/author/ext-system/<id>/search`. */
const authors = () => datatable(page, '/author/ext-system')

async function openAuthors(): Promise<void> {
  await page.goto('/authors')
  await waitForTableLoad(page)
}

test.describe.serial(`${ADMIN_SUITE} - Datatable mechanics`, () => {
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext()
    page = await ctx.newPage()
    await prepareUser(page)
    await openAuthors()
  })

  test.afterAll(async () => {
    await page.context().close()
  })

  test('opens on the first page of 25, newest first', async () => {
    const table = authors()
    expect(await table.activePageSize()).toBe('25')
    expect(await table.currentPage()).toBe('1')
    expect(await table.summary()).toMatch(/^1 - \d+ od/)
    expect(await table.currentOrdering()).toBe(ORDERING.newest)

    // Nowhere to go back to from the first page, and no way to jump to a last page the API never counts.
    await expect(table.paginatorButton('first')).toBeDisabled()
    await expect(table.paginatorButton('prev')).toBeDisabled()
    await expect(table.paginatorButton('next')).toBeEnabled()
  })

  test('switches the page size', async () => {
    const url = await authors().setPageSize(10)

    expect(url).toContain('limit=10')
    expect(url).toContain('offset=0')
    await expect(tableRows(page)).toHaveCount(10)
    expect(await authors().summary()).toMatch(/^1 - 10 od/)
  })

  test('walks to the next page and back', async () => {
    const table = authors()
    const firstOfPageOne = await tableRows(page).first().innerText()

    const next = await table.goTo('next')
    expect(next).toContain('offset=10')
    expect(await table.currentPage()).toBe('2')
    expect(await table.summary()).toMatch(/^11 - 20 od/)
    expect(await tableRows(page).first().innerText(), 'page 2 shows other rows').not.toBe(firstOfPageOne)
    await expect(table.paginatorButton('prev')).toBeEnabled()

    const back = await table.goTo('prev')
    expect(back).toContain('offset=0')
    expect(await table.currentPage()).toBe('1')
    await expect(table.paginatorButton('prev')).toBeDisabled()
  })

  test('orders the list oldest first and back', async () => {
    const table = authors()
    const newestFirst = await tableRows(page).first().innerText()

    const oldest = await table.chooseOrdering(ORDERING.oldest)
    expect(oldest).toContain('order[createdAt]=asc')
    expect(await tableRows(page).first().innerText(), 'the oldest author is not the newest one').not.toBe(newestFirst)

    const newest = await table.chooseOrdering(ORDERING.newest)
    expect(newest).toContain('order[createdAt]=desc')
    expect(await table.currentOrdering()).toBe(ORDERING.newest)
  })

  test('shows and hides a column, and remembers the choice', async () => {
    expect(await tableHeaders(page), 'ID is hidden by default').not.toContain('ID')

    await openColumnMenu(page)
    await toggleColumn(page, 'ID')
    await closeColumnMenu(page)
    expect(await tableHeaders(page)).toContain('ID')
    // The first cell is now the author's id, which is a uuid.
    expect((await tableRows(page).first().locator('td').first().innerText()).trim()).toMatch(/^[0-9a-f-]{36}$/)

    // The choice is kept per table in localStorage, so it outlives a reload.
    await openAuthors()
    expect(await tableHeaders(page)).toContain('ID')

    await openColumnMenu(page)
    await toggleColumn(page, 'ID')
    await closeColumnMenu(page)
    expect(await tableHeaders(page), 'the column is put back as it was found').not.toContain('ID')
  })
})
