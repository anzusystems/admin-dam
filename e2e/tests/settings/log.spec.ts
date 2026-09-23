import { test, expect, type Page } from '@playwright/test'
import { prepareUser } from '@pages/shared/login'
import { ADMIN_SUITE } from '@pages/shared/constants'
import { cardLoad } from '@pages/shared/admin'
import { openSettingsSection, visibleCy } from '@pages/shared/crud'

let page: Page

test.describe.serial(`${ADMIN_SUITE} - Log`, () => {
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext()
    page = await ctx.newPage()
    await prepareUser(page)
  })

  test.afterAll(async () => {
    await page.context().close()
  })

  // The system is a route segment now, not a filter: there is no system select to open and no tab strip
  // to appear, the table is there on arrival and neither a search nor a reset takes it away.
  test('lists the app logs of coreDam', async () => {
    await openSettingsSection(page, 'log-settings', 'logs/dam/app', 'Logy')
    await expect(page.locator('main .v-table').first()).toBeVisible()
  })

  test('keeps the table through a search and a filter reset', async () => {
    await visibleCy(page, 'filter-submit').click()
    await cardLoad(page)
    await expect(page.locator('main .v-table').first()).toBeVisible()
    await visibleCy(page, 'filter-reset').click()
    await cardLoad(page)
    await expect(page.locator('main .v-table').first()).toBeVisible()
  })
})
