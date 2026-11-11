import { type Locator, type Page, expect } from '@playwright/test'
import { visibleCy } from '@pages/shared/crud'
import { columnValues as tableColumnValues, datatable, tableRows } from '@pages/shared/datatable'

/**
 * TTS narration requests — the log of "turn this text into audio" jobs.
 *
 * The rows are **not created by hand**: the list's only write is `Syntetizovať`, which queues a new
 * narration, and the rows themselves offer a detail but no edit. So the coverage here is the listing,
 * its filters and the synthesize form, and no test confirms that form — a confirmed one bills a real
 * provider call and leaves an asset behind.
 */

/** Column order of the list, for reading a row by meaning rather than by number. */
export const COLUMN = { id: 0, state: 1, voiceFamily: 2, mode: 3, title: 4, startedAt: 5, createdAt: 6 } as const

/** The narration request list, bound to the endpoint it refetches. */
function narrationTable(page: Page) {
  return datatable(page, '/tts-narration-request/ext-system')
}

/** Open the narration requests list from the settings navigation. */
export async function openNarrationRequests(page: Page): Promise<void> {
  await page.goto('/settings')
  await narrationTable(page).withLoad(() => visibleCy(page, 'tts-narration-request-settings').click())
  await expect(page).toHaveURL(/\/tts-narration-requests$/)
}

/** The body rows of the list. */
export const narrationRows = tableRows

/** The values of one column across every visible row. */
export const columnValues = tableColumnValues

/**
 * Reveal the collapsed filter fields. Only the voice family slug and the submit/reset buttons are shown
 * until then, so any test touching `Stav` has to expand first.
 */
async function showAdvancedFilters(page: Page): Promise<void> {
  const state = page.locator('[data-cy="filter-value"]').filter({ visible: true }).first()
  if (await state.isVisible()) return
  await visibleCy(page, 'filter-advanced').click()
  await expect(state).toBeVisible()
}

/** Submit the list's filter form and wait for the result it fetches. */
async function submitFilters(page: Page): Promise<void> {
  await narrationTable(page).submitFilter()
}

/** Filter the list down to one request state, e.g. `Hotové`. */
export async function filterByState(page: Page, state: string): Promise<void> {
  await showAdvancedFilters(page)
  await page.locator('[data-cy="filter-value"]').filter({ visible: true }).first().click()
  await page.getByRole('option', { name: state, exact: true }).click()
  await page.keyboard.press('Escape')
  await submitFilters(page)
}

/** Filter the list by the slug of the voice family that narrated the request. */
export async function filterByVoiceFamilySlug(page: Page, slug: string): Promise<void> {
  await page.locator('[data-cy="filter-string"]').filter({ visible: true }).first().locator('input').fill(slug)
  await submitFilters(page)
}

/** Empty the list's filters. */
export async function resetNarrationFilters(page: Page): Promise<void> {
  await narrationTable(page).resetFilter()
}

/** The "Syntetizovať TTS audio" dialog. */
export function synthesizeDialog(page: Page): Locator {
  return page.locator('[data-cy="create-panel"]')
}

/** Open the synthesize dialog. */
export async function openSynthesizeDialog(page: Page): Promise<Locator> {
  await visibleCy(page, 'button-synthesize').click()
  const dialog = synthesizeDialog(page)
  await expect(dialog).toBeVisible()
  return dialog
}

/** Close the synthesize dialog with "Zrušiť", queuing nothing. */
export async function cancelSynthesizeDialog(page: Page): Promise<void> {
  await synthesizeDialog(page).locator('[data-cy="button-cancel"]').click()
  await expect(synthesizeDialog(page)).toBeHidden()
}
