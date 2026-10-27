import { test, expect, type Page } from '@playwright/test'
import { prepareUser } from '@pages/shared/login'
import { ADMIN_SUITE } from '@pages/shared/constants'
import { backToAssets, openAppsMenu, openFromAppsMenu } from '@pages/navigation/appsMenu'

let page: Page

test.describe.serial(`${ADMIN_SUITE} - Header navigation`, { tag: '@smoke' }, () => {
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext()
    page = await ctx.newPage()
    await prepareUser(page)
  })

  test.afterAll(async () => {
    await page.context().close()
  })

  test('opens the empty asset dialog', async () => {
    await openAppsMenu(page)
    await page.locator('.v-overlay--active [data-cy="button-main-empty-asset"]').click()
    const dialog = page.getByRole('dialog').filter({ hasText: 'Vytvoriť prázdny asset' })
    await expect(dialog).toBeVisible()
    await dialog.locator('[data-cy="button-close"]').first().click()
    await expect(dialog).toBeHidden()
  })

  test('navigates to podcasts and back', async () => {
    await openFromAppsMenu(page, 'button-main-podcast', '/podcasts')
    await backToAssets(page)
  })

  test('navigates to video shows and back', async () => {
    await openFromAppsMenu(page, 'button-main-video-show', '/video-shows')
    await backToAssets(page)
  })

  test('opens the licence switch dialog', async () => {
    await openAppsMenu(page)
    await page.locator('.v-overlay--active [data-cy="button-switch-licence"]').click()
    const dialog = page.getByRole('dialog').filter({ hasText: 'Prepnutie externého systému a licencie' })
    await expect(dialog).toBeVisible()
    await dialog.locator('[data-cy="button-cancel"]').click()
    await expect(dialog).toBeHidden()
  })

  test('navigates to settings', async () => {
    await openFromAppsMenu(page, 'button-settings', '/settings')
  })
})
