import { type Page, expect } from '@playwright/test'
import { ALERT_UPDATE } from '@pages/shared/constants'
import { alertMessage, filterBy } from '@pages/shared/admin'
import { confirmCreate, createDialog, openSettingsSection, visibleCy } from '@pages/shared/crud'

export interface AssetLicenceData {
  name: string
  extId: string
  /** Ext system slug as the select lists it, e.g. "cms". */
  extSystem: string
}

async function fillLicence(page: Page, data: AssetLicenceData): Promise<void> {
  await page.locator('[data-cy="asset-licence-name"] input').fill(data.name)
  await page.locator('[data-cy="asset-licence-ext-id"] input').fill(data.extId)
  // An autocomplete: on the edit form its search text is the current system, which filters out every other
  // option, so search for the wanted one instead of only opening the menu.
  const extSystem = page.locator('[data-cy="asset-licence-ext-system"]').filter({ visible: true }).first()
  await extSystem.click()
  await extSystem.locator('input').fill(data.extSystem)
  await page.getByRole('option', { name: data.extSystem, exact: true }).click()
}

/** Create an asset licence through the create dialog of the licence list and return its id. */
export async function createAssetLicence(page: Page, data: AssetLicenceData): Promise<string> {
  await openSettingsSection(page, 'asset-licence-settings', 'asset-licences', 'Licencie assetov')
  await visibleCy(page, 'button-create').click()
  const panel = page.locator('[data-cy="create-panel"]')
  await expect(panel).toBeVisible()
  await fillLicence(page, data)
  await expect(panel.locator('[data-cy="button-close"]')).toBeVisible()
  await expect(panel.locator('[data-cy="button-cancel"]')).toBeVisible()
  return confirmCreate(page, createDialog(page), '/asset-licence')
}

/** Edit an asset licence found by id in the list. */
export async function updateAssetLicence(page: Page, id: string, data: AssetLicenceData): Promise<void> {
  await page.goto('/asset-licences')
  await filterBy(page, 'ID', id)
  await visibleCy(page, 'table-edit').click()
  await expect(page).toHaveURL(/\/edit$/)
  // The form renders before the licence is fetched, and the fetched values overwrite anything typed earlier.
  await expect(page.locator('[data-cy="asset-licence-name"] input')).not.toHaveValue('')
  await fillLicence(page, data)
  await visibleCy(page, 'button-save').click()
  await alertMessage(page, ALERT_UPDATE)
  await visibleCy(page, 'button-close').click()
  await expect(page).not.toHaveURL(/\/edit$/)
}
