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
 * Mechanics shared by every settings list: page-size toggle, paginator,
 * `Radenie` ordering menu and column cog. Covered once, on the authors list.
 * Ordering is not in the column headers. No list renders a sortable
 * `th`; the ordering menu offers only `Najnovšie` and `Najstaršie`.
 * Other specs and parallel workers write to the list, so a page is identified
 * by its `limit`/`offset` and the footer readout, never by its authors.
 */

let page: Page

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
    expect((await tableRows(page).first().locator('td').first().innerText()).trim()).toMatch(/^[0-9a-f-]{36}$/)

    await openAuthors()
    expect(await tableHeaders(page)).toContain('ID')

    await openColumnMenu(page)
    await toggleColumn(page, 'ID')
    await closeColumnMenu(page)
    expect(await tableHeaders(page), 'the column is put back as it was found').not.toContain('ID')
  })
})
