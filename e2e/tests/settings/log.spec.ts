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

  test('lists the logs of the selected systems', async () => {
    await openSettingsSection(page, 'log-settings', 'logs', 'Logy')
    const systemFilter = page.locator('[data-cy="filter-value"]').filter({ hasText: 'Systém' }).first()
    await systemFilter.click()
    const options = page.locator('.v-overlay--active .v-list-item')
    await options.filter({ hasText: 'coreDam' }).click()
    await options.filter({ hasText: 'adminDam' }).click()
    await page.keyboard.press('Escape')
    await visibleCy(page, 'filter-submit').click()
    await cardLoad(page)
    await expect(page.locator('main .v-tabs')).toBeVisible()
    // One table per selected system, rendered in its own tab.
    await expect(page.locator('main .v-table').first()).toBeVisible()
  })

  test('hides the logs again after a filter reset', async () => {
    await visibleCy(page, 'filter-reset').click()
    await expect(page.locator('main .v-tabs')).toHaveCount(0)
    await expect(page.locator('main .v-table')).toHaveCount(0)
  })
})
