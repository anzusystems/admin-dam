import { type Page, type Response, expect } from '@playwright/test'
import { ALERT_CREATE, CORE_DAM_API, LICENCE_ID } from '@pages/shared/constants'
import { alertMessage } from '@pages/shared/admin'
import { detailSidebar, sidebarContent } from '@pages/assets/assetDetailPage'
import { openAppsMenu } from '@pages/navigation/appsMenu'
import { fixture } from '@pages/shared/fixtures'

/** Asset type as the "Vytvoriť prázdny asset" dialog lists it. */
export type EmptyAssetType = 'Obrázok' | 'Audio' | 'Video' | 'Dokument'

/** Text every sidebar tab shows while the asset has no file. */
export const NO_FILE = 'Neobsahuje žiaden súbor'

/**
 * Create an empty asset of `type` from the apps menu and return its id. The app opens the new asset in the
 * detail view right away.
 */
export async function createEmptyAsset(page: Page, type: EmptyAssetType): Promise<string> {
  await openAppsMenu(page)
  await page.locator('.v-overlay--active [data-cy="button-main-empty-asset"]').click()
  const dialog = page.getByRole('dialog').filter({ hasText: 'Vytvoriť prázdny asset' })
  await dialog.locator('[data-cy="author-type"]').click()
  await page.getByRole('option', { name: type, exact: true }).click()
  await expect(dialog.locator('[data-cy="button-close"]')).toBeVisible()
  await expect(dialog.locator('[data-cy="button-cancel"]')).toBeVisible()

  const created = page.waitForResponse(
    (response: Response) =>
      response.request().method() === 'POST' && response.url() === `${CORE_DAM_API}/asset/licence/${LICENCE_ID}`
  )
  await dialog.locator('[data-cy="button-confirm"]').click()
  const response = await created
  expect(response.ok(), `create empty asset responds ${response.status()}`).toBeTruthy()
  await alertMessage(page, ALERT_CREATE)
  // The apps menu the dialog was opened from stays expanded over the detail.
  await page.keyboard.press('Escape')
  return String((await response.json()).id)
}

/** Upload a fixture into the first slot of the empty asset from its slots tab. */
export async function uploadIntoFirstSlot(page: Page, assetId: string, file: string): Promise<void> {
  const slotsReloaded = page.waitForResponse((response: Response) =>
    response.url().startsWith(`${CORE_DAM_API}/asset-slot/asset/${assetId}`)
  )
  await sidebarContent(page).locator('input[type="file"]').first().setInputFiles(fixture(file))
  await slotsReloaded
}

/**
 * Assert the asset detail reflects the uploaded file. A file identical to an existing asset is kept as a
 * duplicate and leaves the asset a draft, which the detail flags instead of dropping the "no file" notice.
 */
export async function expectFileUploaded(page: Page, status: string): Promise<void> {
  const sidebar = detailSidebar(page)
  if (status === 'duplicate') {
    await expect(sidebar).toContainText('Hlavný súbor je duplikát')
  } else {
    await expect(sidebar).not.toContainText(NO_FILE)
  }
}
