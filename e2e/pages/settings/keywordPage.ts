import { type Page, expect } from '@playwright/test'
import { ALERT_UPDATE, CORE_DAM_API } from '@pages/shared/constants'
import { alertMessage, filterBy } from '@pages/shared/admin'
import { confirmCreate, createDialog, openSettingsSection, visibleCy } from '@pages/shared/crud'

/** Create a keyword through the create dialog of the keywords list and return its id. */
export async function createKeyword(page: Page, name: string): Promise<string> {
  await openSettingsSection(page, 'keyword-settings', 'keywords', 'Kľúčové slová')
  await visibleCy(page, 'button-create').click()
  const panel = page.locator('[data-cy="create-panel"]')
  await expect(panel).toBeVisible()
  await panel.locator('[data-cy="keyword-name"] input').fill(name)
  await expect(panel.locator('[data-cy="button-close"]')).toBeVisible()
  await expect(panel.locator('[data-cy="button-cancel"]')).toBeVisible()
  return confirmCreate(page, createDialog(page), '/keyword')
}

/** Edit a keyword found by id in the list: rename it and toggle "reviewed". */
export async function updateKeyword(page: Page, id: string, name: string): Promise<void> {
  await page.goto('/keywords')
  await filterBy(page, 'ID', id)
  await visibleCy(page, 'table-edit').click()
  await expect(page).toHaveURL(/\/edit$/)
  const nameInput = page.locator('[data-cy="keyword-name"] input')
  // The form renders before the keyword is fetched, and the fetched values overwrite anything typed earlier.
  await expect(nameInput).not.toHaveValue('')
  await nameInput.fill(name)
  await visibleCy(page, 'keyword-flags-reviewed').click()
  await visibleCy(page, 'button-save').click()
  await alertMessage(page, ALERT_UPDATE)
  await visibleCy(page, 'button-close').click()
  await expect(page).not.toHaveURL(/\/edit$/)
}

/** Best-effort API delete for the keyword a run created. */
export async function deleteKeywordViaApi(page: Page, id: string): Promise<void> {
  await page.request.delete(`${CORE_DAM_API}/keyword/${id}`).catch(() => {})
}
