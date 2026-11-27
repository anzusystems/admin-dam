import { test, expect, type Page } from '@playwright/test'
import { prepareUser } from '@pages/shared/login'
import { ADMIN_SUITE, IS_LOCAL } from '@pages/shared/constants'

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
    // The logout address is the environment's `logoutCoreDamUrl`, on whichever host it points to.
    const loggedOut = page.waitForResponse((response) => new URL(response.url()).pathname.endsWith('/auth/logout'), {
      timeout: 30000,
    })
    await page.locator('[data-cy="button-confirm"]').filter({ visible: true }).first().click()
    await loggedOut
    if (IS_LOCAL) {
      // The local core-dam redirects to the dev server, which the stack does not run (the suite opens the build), so
      // the redirect ends in an error page. Opening the admin again shows the session is gone all the same; the
      // error page can still interrupt the first attempt.
      await expect(async () => {
        await page.goto('/')
        await expect(page).toHaveURL(/\/login/, { timeout: 5000 })
      }).toPass({ timeout: 30000 })
    }
    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByRole('link', { name: 'Prihlásiť sa' })).toBeVisible()
  })
})
