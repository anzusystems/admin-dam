import { type Locator, type Page, expect } from '@playwright/test'
import { CORE_DAM_API } from '@pages/shared/constants'
import { cardLoad, detailId, exactTextMatch } from '@pages/shared/admin'
import { confirmCreate, createDialog, saveEdit, visibleCy } from '@pages/shared/crud'
import { datatable } from '@pages/shared/datatable'

/**
 * Asset licence groups — a named bundle of asset licences belonging to one ext system. They are what
 * the mixed-licence asset listing draws on, so a group is read far more often than it is written.
 *
 * **A group cannot be deleted** (DAM-B3): the API has no delete in the admin client and answers the
 * one it does route with a 500, so a created group stays on the environment. Fixtures are therefore
 * named with the run's `RAND_NUM` and swept best-effort by `deleteLicenceGroupsViaApi`, which will
 * start working — and clear the backlog of leftovers — the day the bug is fixed.
 */

/** The list is fetched from here; every paginated/filtered query starts with this path. */
const LICENCE_GROUP_ENDPOINT = '/asset-licence-group'

/** Column order of the list, for reading a row by meaning rather than by number. */
export const COLUMN = { name: 0, extSystem: 1, licences: 2, createdAt: 3, modifiedAt: 4 } as const

export interface LicenceGroupData {
  name: string
  /** Ext system **slug**, as the select labels it: `cms`, `blog`, `dennik_sport`, … */
  extSystem: string
  /** Asset licence name, as the autocomplete labels it, e.g. `Sme Family`. */
  licence?: string
}

/** The licence group list, bound to the endpoint it refetches. */
export function licenceGroupTable(page: Page) {
  return datatable(page, LICENCE_GROUP_ENDPOINT)
}

/** Open the licence groups list from the settings navigation, with its first page loaded. */
export async function openLicenceGroups(page: Page): Promise<void> {
  await page.goto('/settings')
  await licenceGroupTable(page).withLoad(() => visibleCy(page, 'asset-licence-group-settings').click())
  await expect(page).toHaveURL(/\/asset-licence-groups$/)
  await expect(page.locator('.v-breadcrumbs-item__text').last()).toContainText('Skupiny licencií assetov')
}

/**
 * Type into a remote autocomplete and pick the option it suggests. Both fields of this form fetch
 * their options as you type, so the menu has to be awaited rather than opened and scrolled.
 */
async function pickSuggestion(page: Page, field: Locator, text: string): Promise<void> {
  await field.locator('input').fill(text)
  const options = page.locator('.v-overlay--active .v-list-item')
  await expect(options.first()).toBeVisible({ timeout: 15000 })
  await options
    .filter({ hasText: exactTextMatch(text) })
    .first()
    .click()
  await page.keyboard.press('Escape')
}

/** The create dialog of the licence group list. */
export async function openCreateDialog(page: Page): Promise<Locator> {
  await visibleCy(page, 'button-create').click()
  const panel = page.locator('[data-cy="create-panel"]')
  await expect(panel).toBeVisible()
  return panel
}

/** Fill the create/edit form. Every field is optional so a validation test can leave them empty. */
export async function fillLicenceGroupForm(page: Page, scope: Locator, data: Partial<LicenceGroupData>): Promise<void> {
  if (data.name !== undefined) await scope.locator('[data-cy="asset-licence-group-name"] input').fill(data.name)
  if (data.extSystem)
    await pickSuggestion(page, scope.locator('[data-cy="asset-licence-group-ext-system"]'), data.extSystem)
  if (data.licence) await pickSuggestion(page, scope.locator('[data-cy="asset-licence-group-licences"]'), data.licence)
}

/** Create a licence group through the list's create dialog and return its id. */
export async function createLicenceGroup(page: Page, data: LicenceGroupData): Promise<string> {
  const panel = await openCreateDialog(page)
  await fillLicenceGroupForm(page, panel, data)
  return confirmCreate(page, createDialog(page), LICENCE_GROUP_ENDPOINT)
}

/** Open a group's edit form by URL and wait until the saved values have arrived in it. */
export async function openLicenceGroupEdit(page: Page, id: string): Promise<Locator> {
  await page.goto(`/asset-licence-groups/${id}/edit`)
  await cardLoad(page)
  const form = page.locator('[data-cy="asset-licence-group-name"]')
  // The form renders before the group is fetched, and the fetched values overwrite anything typed earlier.
  await expect(form.locator('input')).not.toHaveValue('')
  return page.locator('main')
}

/** Rename a group and optionally add a licence to it, then save. */
export async function updateLicenceGroup(page: Page, id: string, data: Partial<LicenceGroupData>): Promise<void> {
  const form = await openLicenceGroupEdit(page, id)
  await fillLicenceGroupForm(page, form, data)
  await saveEdit(page)
}

/** Open a group's detail by URL and check it is the one asked for. */
export async function openLicenceGroupDetail(page: Page, id: string): Promise<void> {
  await page.goto(`/asset-licence-groups/${id}`)
  await cardLoad(page)
  expect(await detailId(page)).toBe(id)
}

/** Fetch a licence group through the API — used to assert a save landed. */
export async function fetchLicenceGroup(page: Page, id: string): Promise<{ name: string; licences: number[] }> {
  const response = await page.request.get(`${CORE_DAM_API}${LICENCE_GROUP_ENDPOINT}/${id}`)
  expect(response.ok(), `GET ${LICENCE_GROUP_ENDPOINT}/${id} responds ${response.status()}`).toBeTruthy()
  return response.json()
}

/** The status the API answers a delete with. See DAM-B3 — it is a 500 today. */
export async function deleteLicenceGroupStatus(page: Page, id: string): Promise<number> {
  const response = await page.request.delete(`${CORE_DAM_API}${LICENCE_GROUP_ENDPOINT}/${id}`, {
    failOnStatusCode: false,
  })
  return response.status()
}

/**
 * Best-effort sweep of every group whose name starts with `prefix`, this run's and any left by an
 * earlier one. Swallows failures: while DAM-B3 is open none of these deletes can succeed.
 */
export async function deleteLicenceGroupsViaApi(page: Page, prefix: string): Promise<void> {
  const response = await page.request
    .get(`${CORE_DAM_API}${LICENCE_GROUP_ENDPOINT}?limit=100&offset=0`, { failOnStatusCode: false })
    .catch(() => null)
  if (!response?.ok()) return
  const body = await response.json().catch(() => null)
  const groups: Array<{ id: number; name: string }> = body?.data ?? body ?? []
  for (const group of groups) {
    if (group.name?.startsWith(prefix)) await deleteLicenceGroupStatus(page, String(group.id)).catch(() => 0)
  }
}
