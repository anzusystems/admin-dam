import { type Locator, type Page, expect } from '@playwright/test'
import { cardLoad, filterBy } from '@pages/shared/admin'
import { CORE_DAM_API } from '@pages/shared/constants'
import { closeDetail, confirmCreate, createDialog, saveEdit, visibleCy } from '@pages/shared/crud'

export interface AnzuUserCreateData {
  /** Central user id — pick one far above the real accounts, the app has no way to delete a user. */
  id: string
  email: string
  role: string
  /** Picked by (partial) name; omitted picks the first group offered. */
  permissionGroup?: string
}

/** Options of a (multi)select or autocomplete menu opened from `field`. */
function menuOptions(page: Page): Locator {
  return page.locator('.v-overlay--active .v-list-item')
}

/** Click the option whose title is exactly `name` in the open menu. */
async function clickOption(page: Page, name: string): Promise<void> {
  await menuOptions(page)
    .filter({ has: page.locator('.v-list-item-title').getByText(name, { exact: true }) })
    .first()
    .click()
}

/** Create a user from the "Oprávnenia používateľov" (anzu users) list and return its id. */
export async function createAnzuUser(page: Page, data: AnzuUserCreateData): Promise<string> {
  await visibleCy(page, 'button-create').click()
  const dialog = createDialog(page, 'Vytvorenie Anzu používateľa')
  await dialog.locator('[data-cy="user-id"] input').fill(data.id)
  await dialog.locator('[data-cy="user-email"] input').fill(data.email)

  await dialog.getByRole('combobox', { name: 'Role' }).click()
  await clickOption(page, data.role)
  await page.keyboard.press('Escape')

  await dialog.getByRole('combobox', { name: 'Skupiny oprávnení' }).click()
  const groups = menuOptions(page)
  if (data.permissionGroup) await groups.filter({ hasText: data.permissionGroup }).first().click()
  else await groups.first().click()
  await page.keyboard.press('Escape')
  if (data.permissionGroup)
    await expect(dialog.locator('.v-chip').filter({ hasText: data.permissionGroup })).toBeVisible()

  await expect(dialog.locator('[data-cy="button-close"]')).toBeVisible()
  await expect(dialog.locator('[data-cy="button-cancel"]')).toBeVisible()
  return confirmCreate(page, dialog, '/anzu-user')
}

/** Filter a users list by e-mail, open the matching user's detail, check its id and close it again. */
export async function openUserByEmail(page: Page, listPath: string, email: string, id: string): Promise<void> {
  await filterBy(page, email.includes('@') && listPath === '/users' ? 'Email' : 'E-mail', email)
  // Click the e-mail cell — other cells hold chips linking to the user's permission groups.
  await page.locator('tbody td').getByText(email, { exact: true }).first().click()
  await cardLoad(page)
  await expect(page).toHaveURL(new RegExp(`${listPath}/${id}$`))
  await expect(visibleCy(page, 'copy-text')).toHaveText(id)
}

/** Open the anzu-user edit page of the user found by e-mail in the list. */
export async function openAnzuUserEdit(page: Page, email: string): Promise<void> {
  await page.goto('/anzu-users')
  await cardLoad(page)
  // This list only offers an e-mail filter for finding a user, the id filter is behind the advanced ones.
  await filterBy(page, 'E-mail', email)
  await page.locator('tbody tr').filter({ hasText: email }).first().locator('[data-cy="table-edit"]').click()
  await expect(page).toHaveURL(/\/edit$/)
  await cardLoad(page)
  await expect(page.locator('[data-cy="user-email"] input, input[type="text"]').first()).not.toHaveValue('')
}

/**
 * Type the names into the anzu-user edit form. Typed key by key: the full name and avatar text are derived
 * from these fields on input, and are themselves required.
 */
export async function typeUserNames(page: Page, firstName: string, lastName: string): Promise<void> {
  await page.locator('[data-cy="user-first-name"] input').pressSequentially(firstName)
  await page.locator('[data-cy="user-last-name"] input').pressSequentially(lastName)
}

/** Flip the "Povolený" switch of the anzu-user edit form. */
export async function toggleUserEnabled(page: Page): Promise<void> {
  await page.getByRole('checkbox', { name: 'Povolený' }).click()
}

/** Save the anzu-user edit form and return to the list. */
export async function saveAndCloseUser(page: Page): Promise<void> {
  await saveEdit(page)
  await closeDetail(page, '/edit')
  await cardLoad(page)
}

/** Assert the "Povolený" column of the list row for `email` reads `value` (áno / nie). */
export async function expectUserEnabledInList(page: Page, email: string, value: 'áno' | 'nie'): Promise<void> {
  const headers = await page.locator('thead th').allTextContents()
  const column = headers.findIndex((header) => header.trim() === 'Povolený')
  expect(column, 'Povolený column').toBeGreaterThanOrEqual(0)
  const row = page.locator('tbody tr').filter({ hasText: email }).first()
  await expect(row.locator('td').nth(column)).toHaveText(value)
}

export interface UserAccessData {
  licences: string[]
  adminToExtSystems: string[]
  externalProviders: string[]
  distributionServices: string[]
}

/** Toggle every option of a multiselect: selected ones get deselected and vice versa. */
async function toggleMultiselect(page: Page, dataCy: string, options: string[]): Promise<void> {
  const field = page.locator(`[data-cy="${dataCy}"]`)
  await field.locator('.v-field').click()
  await expect(menuOptions(page).first()).toBeVisible()
  for (const option of options) {
    const chip = field.locator('.v-chip').filter({ hasText: new RegExp(`^\\s*${option}\\s*$`) })
    const selected = (await chip.count()) > 0
    await clickOption(page, option)
    await expect(chip).toHaveCount(selected ? 0 : 1)
  }
  await page.keyboard.press('Escape')
  await expect(page.locator('.v-menu.v-overlay--active')).toHaveCount(0)
}

/**
 * On the DAM user edit page, toggle the licences, admin ext systems, external providers and distribution
 * services. Running it twice with the same data restores the original access.
 */
export async function toggleUserAccess(page: Page, data: UserAccessData): Promise<void> {
  const licenceInput = page.locator('[data-cy="user-asset-licences"] input')
  for (const licence of data.licences) {
    await licenceInput.click()
    await licenceInput.fill(licence)
    await clickOption(page, licence)
    await page.keyboard.press('Escape')
  }
  await toggleMultiselect(page, 'user-admin-to-ext-systems', data.adminToExtSystems)
  await toggleMultiselect(page, 'user-allowed-asset-external-providers', data.externalProviders)
  await toggleMultiselect(page, 'user-allowed-distribution-services', data.distributionServices)
}

/** Open the DAM user edit page and wait until the user is loaded. */
export async function openUserEdit(page: Page, id: string): Promise<void> {
  await page.goto(`/users/${id}/edit`)
  await cardLoad(page)
  await expect(visibleCy(page, 'button-save')).toBeVisible()
}

/** The user as the core-dam API returns it. */
export async function fetchUser(page: Page, id: string): Promise<Record<string, any>> {
  const response = await page.request.get(`${CORE_DAM_API}/user/${id}`)
  expect(response.ok(), `GET user/${id}`).toBeTruthy()
  return response.json()
}
