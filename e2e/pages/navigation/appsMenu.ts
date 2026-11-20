import { type Page, expect } from '@playwright/test'

/** The grid button in the asset list header that opens the apps/settings menu. */
const APPS_MENU_BUTTON = '.v-btn:has(.mdi-view-grid-plus-outline)'

/** Open the apps menu from the asset list header. */
export async function openAppsMenu(page: Page): Promise<void> {
  const settingsEntry = page.locator('.v-overlay--active [data-cy="button-settings"]')
  // Closing a dialog opened from the menu can leave the menu open, and clicking the button again would close it.
  await expect(page.locator('.v-dialog.v-overlay--active')).toHaveCount(0)
  if (!(await settingsEntry.isVisible())) await page.locator(APPS_MENU_BUTTON).click()
  await expect(settingsEntry).toBeVisible()
}

/** Click an apps-menu entry by its data-cy and wait for the navigation to `urlPart`. */
export async function openFromAppsMenu(page: Page, dataCy: string, urlPart: string): Promise<void> {
  await openAppsMenu(page)
  await page.locator(`.v-overlay--active [data-cy="${dataCy}"]`).click()
  await expect(page).toHaveURL(new RegExp(urlPart))
}

/** Go back from a settings-like section (podcasts, video shows) to the asset list. */
export async function backToAssets(page: Page): Promise<void> {
  await page.locator('[data-cy="back-to-assets-settings"]').first().click()
  await expect(page).toHaveURL(/\/assets/)
}
