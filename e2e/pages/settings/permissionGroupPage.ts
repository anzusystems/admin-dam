import { type Page, expect } from '@playwright/test'
import { cardLoad, filterBy } from '@pages/shared/admin'
import { closeDetail, confirmCreate, createDialog, rowWithCell, saveEdit, visibleCy } from '@pages/shared/crud'

export interface PermissionGroupData {
  title: string
  description: string
}

/** Create a permission group from the list's create dialog and return its id. */
export async function createPermissionGroup(page: Page, data: PermissionGroupData): Promise<string> {
  await visibleCy(page, 'button-create').click()
  const dialog = createDialog(page, 'Vytvorenie skupiny oprávnení')
  await dialog.locator('[data-cy="permissionGroup-title"] input').fill(data.title)
  await dialog.locator('[data-cy="permissionGroup-description"] input').fill(data.description)
  await expect(dialog.locator('[data-cy="button-close"]')).toBeVisible()
  await expect(dialog.locator('[data-cy="button-cancel"]')).toBeVisible()
  return confirmCreate(page, dialog, '/permission-group')
}

/** Find the group by title in the list, open its detail and check the rendered id. */
export async function openPermissionGroupByTitle(page: Page, title: string, id: string): Promise<void> {
  await filterBy(page, 'Nadpis', title)
  await rowWithCell(page, title).first().click()
  await cardLoad(page)
  await expect(page).toHaveURL(new RegExp(`/permission-groups/${id}$`))
  await expect(visibleCy(page, 'copy-text')).toHaveText(id)
}

/** Overwrite the title and description of the group on its edit page and save. */
export async function editPermissionGroup(page: Page, id: string, data: PermissionGroupData): Promise<void> {
  await page.goto(`/permission-groups/${id}/edit`)
  await cardLoad(page)
  const title = page.locator('[data-cy="permissionGroup-title"] input')
  // The form renders empty before the group is fetched; typing earlier gets overwritten by the loaded values.
  await expect(title).not.toHaveValue('')
  await title.fill(data.title)
  await page.locator('[data-cy="permissionGroup-description"] input').fill(data.description)
  await saveEdit(page)
  await closeDetail(page, '/edit')
}
