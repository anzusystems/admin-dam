import { type Page, expect } from '@playwright/test'
import { ALERT_UPDATE } from '@pages/shared/constants'
import { alertMessage, cardLoad, detailId, filterBy } from '@pages/shared/admin'
import { openSettingsSection, rowWithCell, visibleCy } from '@pages/shared/crud'

export async function openExtSystemBySlug(page: Page, slug: string): Promise<string> {
  await openSettingsSection(page, 'ext-system-settings', 'ext-systems', 'Externé systémy')
  await filterBy(page, 'Slug', slug)
  await rowWithCell(page, slug).first().click()
  await cardLoad(page)
  return detailId(page)
}

export async function renameExtSystem(page: Page, name: string): Promise<void> {
  await visibleCy(page, 'button-edit').click()
  await expect(page).toHaveURL(/\/edit$/)
  const nameInput = page.locator('[data-cy="ext-system-name"] input')
  // The form renders before the ext system is fetched, and the fetched values overwrite anything typed earlier.
  await expect(nameInput).not.toHaveValue('')
  await nameInput.fill(name)
  await visibleCy(page, 'button-save').click()
  await alertMessage(page, ALERT_UPDATE)
  await visibleCy(page, 'button-close').click()
  await expect(page).not.toHaveURL(/\/edit$/)
}
