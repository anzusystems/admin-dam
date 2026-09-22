import { type Page, expect } from '@playwright/test'
import { ALERT_UPDATE, CORE_DAM_API } from '@pages/shared/constants'
import { alertMessage, filterBy } from '@pages/shared/admin'
import { confirmCreate, createDialog, openSettingsSection, visibleCy } from '@pages/shared/crud'

export interface AuthorData {
  name: string
  identifier: string
  /** "Interný" | "Externý" */
  type: string
}

async function pickType(page: Page, type: string): Promise<void> {
  await page.locator('[data-cy="author-type"]').filter({ visible: true }).first().click()
  await page.locator('.v-overlay--active .v-list-item-title').getByText(type, { exact: true }).click()
}

/** Create an author through the create dialog of the authors list and return its id. */
export async function createAuthor(page: Page, data: AuthorData): Promise<string> {
  await openSettingsSection(page, 'author-settings', 'authors', 'Autori')
  await visibleCy(page, 'button-create').click()
  const panel = page.locator('[data-cy="create-panel"]')
  await expect(panel).toBeVisible()
  await panel.locator('[data-cy="author-name"] input').fill(data.name)
  await panel.locator('[data-cy="author-identifier"] input').fill(data.identifier)
  await pickType(page, data.type)
  await expect(panel.locator('[data-cy="button-close"]')).toBeVisible()
  await expect(panel.locator('[data-cy="button-cancel"]')).toBeVisible()
  return confirmCreate(page, createDialog(page), '/author')
}

/** Edit an author found by id in the list: rename it, toggle "reviewed" and change its type. */
export async function updateAuthor(page: Page, id: string, data: AuthorData): Promise<void> {
  await page.goto('/authors')
  await filterBy(page, 'ID', id)
  await visibleCy(page, 'table-edit').click()
  await expect(page).toHaveURL(/\/edit$/)
  // The form renders before the author is fetched, and the fetched values overwrite anything typed earlier.
  await expect(page.locator('[data-cy="author-name"] input')).not.toHaveValue('')
  await page.locator('[data-cy="author-name"] input').fill(data.name)
  await page.locator('[data-cy="author-identifier"] input').fill(data.identifier)
  await visibleCy(page, 'author-flags-reviewed').click()
  await pickType(page, data.type)
  await visibleCy(page, 'button-save').click()
  await alertMessage(page, ALERT_UPDATE)
  await visibleCy(page, 'button-close').click()
  await expect(page).not.toHaveURL(/\/edit$/)
}

/** Best-effort API delete for records a failed run left behind. */
export async function deleteAuthorViaApi(page: Page, id: string): Promise<void> {
  await page.request.delete(`${CORE_DAM_API}/author/${id}`).catch(() => {})
}
