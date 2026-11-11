import { type Locator, type Page, expect } from '@playwright/test'
import { cardLoad, detailId } from '@pages/shared/admin'
import { openSettingsSection, saveEdit, visibleCy } from '@pages/shared/crud'

export interface SelectOption {
  name: string
  value: string
}

/** The detail renders options as a plain list, not the list editor. */
function detailOption(page: Page, name: string): Locator {
  return page
    .locator('main .v-list-item')
    .filter({ has: page.locator('.v-list-item-title').getByText(name, { exact: true }) })
}

function optionRow(page: Page, name: string): Locator {
  return page.locator('.a-le-row-wrapper').filter({ has: page.locator('.a-le-title').getByText(name, { exact: true }) })
}

export async function openFirstCategorySelect(page: Page): Promise<string> {
  await openSettingsSection(
    page,
    'distribution-category-select-settings',
    '/distribution-category-selects',
    'Výbery v distribučných kategóriách'
  )
  await cardLoad(page)
  await page.locator('.v-data-table__tr').first().click()
  await cardLoad(page)
  return detailId(page)
}

export async function addCategorySelectOption(page: Page, option: SelectOption): Promise<void> {
  await visibleCy(page, 'button-edit').click()
  await page.getByRole('button', { name: 'Pridať položku' }).click()
  const row = page.locator('.a-le-row-wrapper').last()
  await row.getByRole('textbox', { name: 'Názov' }).fill(option.name)
  await row.getByRole('textbox', { name: 'Hodnota' }).fill(option.value)
  const assignable = row.getByRole('checkbox', { name: 'Priraditeľné' })
  if (!(await assignable.isChecked())) await assignable.click()
  await expect(visibleCy(page, 'button-close')).toBeVisible()
  await saveEdit(page)
}

export async function expectCategorySelectOption(page: Page, selectId: string, option: SelectOption): Promise<void> {
  await page.goto(`/distribution-category-selects/${selectId}`)
  await cardLoad(page)
  const item = detailOption(page, option.name)
  await expect(item).toBeVisible()
  await expect(item.locator('.v-list-item-subtitle')).toHaveText(option.value)
}

export async function removeCategorySelectOption(page: Page, selectId: string, name: string): Promise<void> {
  await page.goto(`/distribution-category-selects/${selectId}`)
  await cardLoad(page)
  await visibleCy(page, 'button-edit').click()
  await optionRow(page, name).locator('.a-le-action--delete').click()
  await page.locator('.v-overlay--active').getByRole('button', { name: 'Zmazať' }).click()
  await expect(optionRow(page, name)).toHaveCount(0)
  await saveEdit(page)
  await page.goto(`/distribution-category-selects/${selectId}`)
  await cardLoad(page)
  await expect(page.locator('main .v-list-item-title').first()).toBeVisible()
  await expect(detailOption(page, name)).toHaveCount(0)
}
