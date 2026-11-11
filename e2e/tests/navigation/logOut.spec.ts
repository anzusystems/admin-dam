import { test, expect, type Page } from '@playwright/test'
import { prepareUser } from '@pages/shared/login'
import { ADMIN_SUITE } from '@pages/shared/constants'

let page: Page

test.describe.serial(`${ADMIN_SUITE} - Log out`, () => {
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext()
    page = await ctx.newPage()
    await prepareUser(page)
  })

  test.afterAll(async () => {
    await page.context().close()
  })

  test('logs the user out', async () => {
    await page.locator('[data-cy="navbar-user"]').filter({ visible: true }).first().click()
    await page.locator('[data-cy="navbar-user-logout"]').filter({ visible: true }).first().click()
    await page.locator('[data-cy="button-confirm"]').filter({ visible: true }).first().click()
    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByRole('link', { name: 'Log in' })).toBeVisible()
  })
})
