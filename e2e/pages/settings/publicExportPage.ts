import { type Page, expect } from '@playwright/test'
import { alertMessage, cardLoad } from '@pages/shared/admin'
import { confirmCreate, createDialog, pickOption, saveEdit, visibleCy } from '@pages/shared/crud'

export interface PublicExportData {
  slug: string
  /** Licence name, picked from the licence autocomplete. */
  licence: string
  /** Web | Appka */
  type?: string
}

/** Pick `option` from the licence autocomplete of the public export form — it only lists matches of the typed text. */
async function pickLicence(page: Page, licence: string): Promise<void> {
  const input = page.locator('[data-cy="publicExport-licence"] input').filter({ visible: true }).first()
  await input.click()
  await input.fill(licence)
  await page.locator('.v-overlay--active .v-list-item').filter({ hasText: licence }).first().click()
}

/** Create a public export from the list's create dialog and return its id. */
export async function createPublicExport(page: Page, data: PublicExportData): Promise<string> {
  await page.goto('/public-exports')
  await cardLoad(page)
  await visibleCy(page, 'button-create').click()
  const dialog = createDialog(page, 'Vytvoriť verejný export')
  await dialog.locator('[data-cy="publicExport-slug"] input').fill(data.slug)
  await pickLicence(page, data.licence)
  return confirmCreate(page, dialog, '/public-export')
}

/** Assert the detail of the export shows every given value. */
export async function verifyPublicExport(page: Page, id: string, data: PublicExportData): Promise<void> {
  await page.goto(`/public-exports/${id}`)
  await cardLoad(page)
  // The licence renders with its ext system prefix ("Blog system - 1 Sme Family"), so match substrings.
  const detail = page.getByRole('main')
  for (const value of [data.slug, data.licence, data.type ?? 'Web']) {
    await expect(detail).toContainText(value)
  }
}

/** Edit the export from its detail and save; the app returns to the detail view. */
export async function updatePublicExport(page: Page, id: string, data: PublicExportData): Promise<void> {
  await page.goto(`/public-exports/${id}`)
  await cardLoad(page)
  await visibleCy(page, 'button-edit').click()
  await expect(page).toHaveURL(/\/edit$/)
  const slug = page.locator('[data-cy="publicExport-slug"] input')
  await expect(slug).not.toHaveValue('')
  await slug.fill(data.slug)
  await pickLicence(page, data.licence)
  if (data.type) await pickOption(page, page.locator('[data-cy="publicExport-type"] .v-field'), data.type)
  await saveEdit(page)
  await expect(page).not.toHaveURL(/\/edit$/)
}

/** Delete the export from its detail. */
export async function deletePublicExport(page: Page, id: string, alert: string): Promise<void> {
  await page.goto(`/public-exports/${id}`)
  await cardLoad(page)
  await visibleCy(page, 'button-delete').click()
  await visibleCy(page, 'button-confirm-delete').click()
  await alertMessage(page, alert)
}
