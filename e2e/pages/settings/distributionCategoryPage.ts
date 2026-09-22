import { type Page, expect } from '@playwright/test'
import { cardLoad } from '@pages/shared/admin'
import {
  closeDetail,
  confirmCreate,
  createDialog,
  openSettingsSection,
  pickOption,
  saveEdit,
  visibleCy,
} from '@pages/shared/crud'

/** Create a distribution category of the given asset type and return its id. */
export async function createDistributionCategory(page: Page, type: string, name: string): Promise<string> {
  await openSettingsSection(page, 'distribution-category-settings', '/distribution-categories', 'Kategórie distribúcie')
  await visibleCy(page, 'button-create').click()
  const dialog = createDialog(page, 'Vytvoriť distribučnú kategóriu')
  await expect(dialog).toBeVisible()
  await pickOption(page, dialog.getByRole('combobox', { name: 'Typ' }), type)
  await dialog.getByRole('textbox', { name: 'Názov' }).fill(name)
  await expect(dialog.locator('[data-cy="button-cancel"]')).toBeVisible()
  return confirmCreate(page, dialog, '/distribution/category')
}

/** Open a distribution category detail and check it renders its id. */
export async function verifyDistributionCategoryDetail(page: Page, categoryId: string, name: string): Promise<void> {
  await page.goto(`/distribution-categories/${categoryId}`)
  await cardLoad(page)
  await expect(visibleCy(page, 'copy-text')).toHaveText(categoryId)
  await expect(page.locator('main')).toContainText(name)
  await closeDetail(page, categoryId)
  await expect(page).toHaveURL(/\/distribution-categories/)
}

/** Narrow the category list to one asset type and a name. The list shows only Video categories by default. */
export async function filterDistributionCategories(page: Page, type: string, name: string): Promise<void> {
  await page.goto('/distribution-categories')
  await cardLoad(page)
  await pickOption(page, visibleCy(page, 'filter-value'), type)
  await page.keyboard.press('Escape')
  const nameFilter = visibleCy(page, 'filter-string').locator('input')
  await nameFilter.fill(name)
  await nameFilter.press('Enter')
  await cardLoad(page)
}

/** Rename a distribution category found through the list filters. */
export async function updateDistributionCategory(
  page: Page,
  type: string,
  name: string,
  newName: string
): Promise<void> {
  await filterDistributionCategories(page, type, name)
  await page.locator('tr').filter({ hasText: name }).locator('[data-cy="table-edit"]').first().click()
  await expect(page).toHaveURL(/\/edit/)
  await cardLoad(page)
  await page.locator('main').getByRole('textbox', { name: 'Názov' }).fill(newName)
  await saveEdit(page)
  await closeDetail(page, '/edit')
}

/** Check the list finds a category by its name within the asset type. */
export async function expectDistributionCategoryListed(page: Page, type: string, name: string): Promise<void> {
  await filterDistributionCategories(page, type, name)
  await expect(page.locator('td').filter({ hasText: name }).first()).toBeVisible()
}
