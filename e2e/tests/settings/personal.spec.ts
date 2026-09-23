import { test, expect, type Page } from '@playwright/test'
import { prepareUser } from '@pages/shared/login'
import { ADMIN_SUITE } from '@pages/shared/constants'

let page: Page

/** Pick `option` in the settings select behind `dataCy` — the select closes after every pick. */
async function pickSetting(dataCy: string, option: string): Promise<void> {
  await page.locator(`[data-cy="${dataCy}"]`).filter({ visible: true }).first().click()
  await page.locator('.v-overlay--active .v-list-item-title').getByText(option, { exact: true }).click()
}

test.describe.serial(`${ADMIN_SUITE} - Personal settings`, () => {
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext()
    page = await ctx.newPage()
    await prepareUser(page)
  })

  test.afterAll(async () => {
    // Language is persisted per user - switch back so the rest of the suite keeps asserting Slovak texts.
    await pickSetting('settings-language', 'Slovensky').catch(() => {})
    await page.context().close()
  })

  test('opens the settings from the user menu', async () => {
    await page.locator('[data-cy="navbar-user"]').filter({ visible: true }).first().click()
    await page.locator('[data-cy="navbar-user-settings"]').filter({ visible: true }).first().click()
    await expect(page).toHaveURL(/\/settings/)
    await expect(page.locator('.v-breadcrumbs-item__text')).toContainText('Nastavenia')
  })

  test('switches the language between Slovak and English', async () => {
    await pickSetting('settings-language', 'English')
    await expect(page.locator('[data-cy="personal-settings"]').filter({ visible: true }).first()).toContainText(
      'Personal'
    )
    await pickSetting('settings-language', 'Slovensky')
    await expect(page.locator('[data-cy="personal-settings"]').filter({ visible: true }).first()).toContainText(
      'Osobné'
    )
  })

  test('offers the auto, light and dark themes', async () => {
    await page.locator('[data-cy="settings-theme"]').filter({ visible: true }).first().click()
    await expect(page.locator('.v-overlay--active .v-list-item-title')).toHaveText(['Automatická', 'Svetlá', 'Tmavá'])
    await page.keyboard.press('Escape')
  })
})
