import { type Page, expect } from '@playwright/test'

const APPS_MENU_BUTTON = '.v-btn:has(.mdi-view-grid-plus-outline)'

export async function openAppsMenu(page: Page): Promise<void> {
  const settingsEntry = page.locator('.v-overlay--active [data-cy="button-settings"]')
  await expect(page.locator('.v-dialog.v-overlay--active')).toHaveCount(0)
  // Closing a dialog opened from the menu can leave the menu open, but for a moment only: taken as open, it then
  // closes under the next click. So an open menu is closed first and the menu is opened afresh.
  if (await settingsEntry.isVisible()) await page.keyboard.press('Escape')
  await expect(settingsEntry).toBeHidden()
  // That moment can also outlast the check above, and the click then closes the menu instead. So the
  // click is repeated, and only while the menu is not showing.
  await expect(async () => {
    if (!(await settingsEntry.isVisible())) await page.locator(APPS_MENU_BUTTON).click()
    await expect(settingsEntry).toBeVisible({ timeout: 3000 })
  }).toPass({ timeout: 20000 })
}

export async function openFromAppsMenu(page: Page, dataCy: string, urlPart: string): Promise<void> {
  await openAppsMenu(page)
  await page.locator(`.v-overlay--active [data-cy="${dataCy}"]`).click()
  await expect(page).toHaveURL(new RegExp(urlPart))
}

export async function backToAssets(page: Page): Promise<void> {
  await page.locator('[data-cy="back-to-assets-settings"]').first().click()
  await expect(page).toHaveURL(/\/assets/)
}
