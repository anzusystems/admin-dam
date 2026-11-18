import { type Locator, type Page, expect } from '@playwright/test'
import { CORE_DAM_API } from '@pages/shared/constants'
import { cardLoad, detailId, exactTextMatch } from '@pages/shared/admin'
import { confirmCreate, createDialog, saveEdit, visibleCy } from '@pages/shared/crud'
import { datatable } from '@pages/shared/datatable'

/**
 * A licence group cannot be deleted: the admin has no delete, and core-dam has no DELETE route for it (it answers
 * the method with 500 instead of 405, DAM-B3). Created groups stay on the environment, named with the run's
 * `RAND_NUM`. Nothing tries to delete them, as every try only added an error to Sentry (ANZU-CORE-DAM-63).
 */

const LICENCE_GROUP_ENDPOINT = '/asset-licence-group'

export const COLUMN = { name: 0, extSystem: 1, licences: 2, createdAt: 3, modifiedAt: 4 } as const

export interface LicenceGroupData {
  name: string
  /** Ext system slug as the select labels it, e.g. `cms`. */
  extSystem: string
  licence?: string
}

export function licenceGroupTable(page: Page) {
  return datatable(page, LICENCE_GROUP_ENDPOINT)
}

export async function openLicenceGroups(page: Page): Promise<void> {
  await page.goto('/settings')
  await licenceGroupTable(page).withLoad(() => visibleCy(page, 'asset-licence-group-settings').click())
  await expect(page).toHaveURL(/\/asset-licence-groups$/)
  await expect(page.locator('.v-breadcrumbs-item__text').last()).toContainText('Skupiny licencií assetov')
}

/**
 * Both fields of this form fetch options as you type, so the menu has to be awaited. The text input by its type:
 * a field that already holds a value carries a hidden input with it too, and a single select's field is a
 * combobox of its own.
 */
async function pickSuggestion(page: Page, field: Locator, text: string): Promise<void> {
  await field.locator('input[type="text"]').fill(text)
  const options = page.locator('.v-overlay--active .v-list-item')
  await expect(options.first()).toBeVisible({ timeout: 15000 })
  await options
    .filter({ hasText: exactTextMatch(text) })
    .first()
    .click()
  await page.keyboard.press('Escape')
}

export async function openCreateDialog(page: Page): Promise<Locator> {
  await visibleCy(page, 'button-create').click()
  const panel = page.locator('[data-cy="create-panel"]')
  await expect(panel).toBeVisible()
  return panel
}

/** Every field is optional so a validation test can leave them empty. */
export async function fillLicenceGroupForm(page: Page, scope: Locator, data: Partial<LicenceGroupData>): Promise<void> {
  if (data.name !== undefined) await scope.locator('[data-cy="asset-licence-group-name"] input').fill(data.name)
  if (data.extSystem)
    await pickSuggestion(page, scope.locator('[data-cy="asset-licence-group-ext-system"]'), data.extSystem)
  if (data.licence) await pickSuggestion(page, scope.locator('[data-cy="asset-licence-group-licences"]'), data.licence)
}

export async function createLicenceGroup(page: Page, data: LicenceGroupData): Promise<string> {
  const panel = await openCreateDialog(page)
  await fillLicenceGroupForm(page, panel, data)
  return confirmCreate(page, createDialog(page), LICENCE_GROUP_ENDPOINT)
}

export async function openLicenceGroupEdit(page: Page, id: string): Promise<Locator> {
  await page.goto(`/asset-licence-groups/${id}/edit`)
  await cardLoad(page)
  const form = page.locator('[data-cy="asset-licence-group-name"]')
  // The form renders before the group is fetched, and the fetched values overwrite anything typed earlier.
  await expect(form.locator('input')).not.toHaveValue('')
  return page.locator('main')
}

export async function updateLicenceGroup(page: Page, id: string, data: Partial<LicenceGroupData>): Promise<void> {
  const form = await openLicenceGroupEdit(page, id)
  await fillLicenceGroupForm(page, form, data)
  await saveEdit(page)
}

export async function openLicenceGroupDetail(page: Page, id: string): Promise<void> {
  await page.goto(`/asset-licence-groups/${id}`)
  await cardLoad(page)
  expect(await detailId(page)).toBe(id)
}

export async function fetchLicenceGroup(page: Page, id: string): Promise<{ name: string; licences: number[] }> {
  const response = await page.request.get(`${CORE_DAM_API}${LICENCE_GROUP_ENDPOINT}/${id}`)
  expect(response.ok(), `GET ${LICENCE_GROUP_ENDPOINT}/${id} responds ${response.status()}`).toBeTruthy()
  return response.json()
}
