import { type Locator, type Page, expect } from '@playwright/test'
import { visibleCy } from '@pages/shared/crud'
import { columnValues as tableColumnValues, datatable, tableRows } from '@pages/shared/datatable'

/**
 * TTS narration requests are not created by hand.
 * The list's only write is `Syntetizovať`, which queues a new narration. Rows offer a detail but no edit.
 * No test confirms the synthesize form: a confirmed one bills a real provider call and leaves an asset behind.
 */

export const COLUMN = { id: 0, state: 1, voiceFamily: 2, mode: 3, title: 4, startedAt: 5, createdAt: 6 } as const

function narrationTable(page: Page) {
  return datatable(page, '/tts-narration-request/ext-system')
}

export async function openNarrationRequests(page: Page): Promise<void> {
  await page.goto('/settings')
  await narrationTable(page).withLoad(() => visibleCy(page, 'tts-narration-request-settings').click())
  await expect(page).toHaveURL(/\/tts-narration-requests$/)
}

export const narrationRows = tableRows

export const columnValues = tableColumnValues

/**
 * Reveals the collapsed filter fields. Until then only the voice family slug and the
 * submit/reset buttons are shown, so any test touching `Stav` must expand first.
 */
async function showAdvancedFilters(page: Page): Promise<void> {
  const state = page.locator('[data-cy="filter-value"]').filter({ visible: true }).first()
  if (await state.isVisible()) return
  await visibleCy(page, 'filter-advanced').click()
  await expect(state).toBeVisible()
}

async function submitFilters(page: Page): Promise<void> {
  await narrationTable(page).submitFilter()
}

export async function filterByState(page: Page, state: string): Promise<void> {
  await showAdvancedFilters(page)
  await page.locator('[data-cy="filter-value"]').filter({ visible: true }).first().click()
  await page.getByRole('option', { name: state, exact: true }).click()
  await page.keyboard.press('Escape')
  await submitFilters(page)
}

export async function filterByVoiceFamilySlug(page: Page, slug: string): Promise<void> {
  await page.locator('[data-cy="filter-string"]').filter({ visible: true }).first().locator('input').fill(slug)
  await submitFilters(page)
}

export async function resetNarrationFilters(page: Page): Promise<void> {
  await narrationTable(page).resetFilter()
}

export function synthesizeDialog(page: Page): Locator {
  return page.locator('[data-cy="create-panel"]')
}

export async function openSynthesizeDialog(page: Page): Promise<Locator> {
  await visibleCy(page, 'button-synthesize').click()
  const dialog = synthesizeDialog(page)
  await expect(dialog).toBeVisible()
  return dialog
}

export async function cancelSynthesizeDialog(page: Page): Promise<void> {
  await synthesizeDialog(page).locator('[data-cy="button-cancel"]').click()
  await expect(synthesizeDialog(page)).toBeHidden()
}
