import { type Locator, type Page, expect } from '@playwright/test'
import { CORE_DAM_API } from '@pages/shared/constants'
import { cardLoad, detailId, exactTextMatch } from '@pages/shared/admin'
import { confirmCreate, createDialog, detailRow, saveEdit, visibleCy } from '@pages/shared/crud'
import { datatable } from '@pages/shared/datatable'

/**
 * Author clean phrases (`Čistenie autorov`) turn the free-text author line of an imported asset into DAM authors.
 * `Rozdelenie` splits on the phrase, `Odstránenie` strips it, `Nahradenie` strips it and adds a chosen author.
 * The section has a playground (`Ihrisko`). `runPlayground` proves a created rule works, not only that it is stored.
 */

/** The list is scoped to the ext system, unlike the create/update paths. */
const CLEAN_PHRASE_LIST_ENDPOINT = '/author-clean-phrase/ext-system'
const CLEAN_PHRASE_ENDPOINT = '/author-clean-phrase'

export const COLUMN = { phrase: 0, mode: 1, type: 2, createdAt: 3, modifiedAt: 4 } as const

export const MODE = { remove: 'Odstránenie', replace: 'Nahradenie', split: 'Rozdelenie' } as const

export const TYPE = { word: 'Slovo', regex: 'Regulárny výraz' } as const

export interface CleanPhraseData {
  phrase?: string
  type?: string
  mode?: string
  wordBoundary?: boolean
  position?: number
  /** Author name to substitute for `Nahradenie` rules, typed into the remote autocomplete. */
  authorReplacement?: string
}

export function cleanPhraseTable(page: Page) {
  return datatable(page, CLEAN_PHRASE_LIST_ENDPOINT)
}

/**
 * Not `openSettingsSection`: the navigation item has `data-cy="job-settings"`, the same as `Systémové úlohy`.
 * A data-cy lookup opens the wrong section, so the link text is used.
 */
export async function openCleanPhrases(page: Page): Promise<void> {
  await page.goto('/settings')
  await cleanPhraseTable(page).withLoad(() => page.getByRole('link', { name: 'Čistenie autorov' }).click())
  await expect(page).toHaveURL(/\/author-clean-phrases$/)
  await expect(page.locator('.v-breadcrumbs-item__text').last()).toContainText('Pravidlá')
}

async function pickFromSelect(page: Page, field: Locator, option: string): Promise<void> {
  await field.click()
  await page
    .locator('.v-overlay--active .v-list-item')
    .filter({ hasText: exactTextMatch(option) })
    .first()
    .click()
  await page.keyboard.press('Escape')
}

async function setSwitch(scope: Locator, dataCy: string, on: boolean): Promise<void> {
  const toggle = scope.locator(`[data-cy="${dataCy}"] input`).first()
  if ((await toggle.isChecked()) !== on) await toggle.click()
  await expect(toggle, dataCy).toBeChecked({ checked: on })
}

/** Every field is optional so a validation test can leave them empty. */
export async function fillCleanPhraseForm(page: Page, scope: Locator, data: CleanPhraseData): Promise<void> {
  if (data.phrase !== undefined) await scope.locator('[data-cy="authorCleanPhrase-phrase"] input').fill(data.phrase)
  if (data.type) await pickFromSelect(page, scope.locator('[data-cy="authorCleanPhrase-type"]'), data.type)
  if (data.mode) await pickFromSelect(page, scope.locator('[data-cy="authorCleanPhrase-mode"]'), data.mode)
  if (data.wordBoundary !== undefined) await setSwitch(scope, 'authorCleanPhrase-wordBoundary', data.wordBoundary)
  if (data.position !== undefined) {
    await scope.locator('[data-cy="authorCleanPhrase-position"] input').fill(String(data.position))
  }
  if (data.authorReplacement) {
    const field = scope.locator('[data-cy="authorCleanPhrase-authorReplacement"]')
    await field.locator('input').fill(data.authorReplacement)
    const options = page.locator('.v-overlay--active .v-list-item')
    await expect(options.first()).toBeVisible({ timeout: 15000 })
    await options.filter({ hasText: data.authorReplacement }).first().click()
    await page.keyboard.press('Escape')
  }
}

export async function createCleanPhrase(page: Page, data: CleanPhraseData): Promise<string> {
  await visibleCy(page, 'button-create').click()
  const panel = page.locator('[data-cy="create-panel"]')
  await expect(panel).toBeVisible()
  await fillCleanPhraseForm(page, panel, data)
  return confirmCreate(page, createDialog(page), CLEAN_PHRASE_ENDPOINT)
}

export async function openCleanPhraseEdit(page: Page, id: string): Promise<Locator> {
  await page.goto(`/author-clean-phrases/${id}/edit`)
  await cardLoad(page)
  // The form renders before the rule is fetched, and the fetched values overwrite anything typed earlier.
  await expect(page.locator('[data-cy="authorCleanPhrase-phrase"] input')).not.toHaveValue('')
  return page.locator('main')
}

export async function updateCleanPhrase(page: Page, id: string, data: CleanPhraseData): Promise<void> {
  const form = await openCleanPhraseEdit(page, id)
  await fillCleanPhraseForm(page, form, data)
  await saveEdit(page)
}

export async function openCleanPhraseDetail(page: Page, id: string): Promise<void> {
  await page.goto(`/author-clean-phrases/${id}`)
  await cardLoad(page)
  expect(await detailId(page)).toBe(id)
}

/**
 * Returns the text of the alert the app raises, which the caller asserts.
 * It is wrong today (DAM-B4): the delete reports `Záznam bol upravený.`.
 */
export async function deleteOpenCleanPhrase(page: Page): Promise<string> {
  await visibleCy(page, 'button-delete').click()
  const dialog = page.locator('.v-overlay--active').filter({ hasText: 'Odstrániť?' }).first()
  await expect(dialog).toBeVisible()
  await dialog.locator('[data-cy="button-confirm-delete"]').click()
  await expect(page).toHaveURL(/\/author-clean-phrases$/)
  const alert = page.locator('.v-alert').first()
  await expect(alert).toBeVisible({ timeout: 15000 })
  return (await alert.innerText()).trim()
}

/** Only `Fráza` and the buttons are shown until the filters are revealed. */
export async function showAdvancedFilters(page: Page): Promise<void> {
  const collapsed = page.locator('[data-cy="filter-value"]').filter({ visible: true })
  if ((await collapsed.count()) > 0) return
  await visibleCy(page, 'filter-advanced').click()
  await expect(collapsed.first()).toBeVisible()
}

function filterSelect(page: Page, label: string): Locator {
  return page.locator('[data-cy="filter-value"]').filter({ hasText: label }).first()
}

export async function filterCleanPhrasesBy(page: Page, label: string, option: string): Promise<void> {
  await showAdvancedFilters(page)
  await pickFromSelect(page, filterSelect(page, label), option)
  await cleanPhraseTable(page).submitFilter()
}

/** The playground dialog reuses the create panel's data-cy. */
export function playgroundDialog(page: Page): Locator {
  return page.locator('[data-cy="create-panel"]')
}

/**
 * `authorNames` are the strings the rules split the line into.
 * `authors` are the resolved DAM authors, rendered as chips like `Name (Identifier)`.
 */
export async function runPlayground(page: Page, text: string): Promise<{ authorNames: string[]; authors: string[] }> {
  await page.getByRole('button', { name: 'Ihrisko' }).click()
  const dialog = playgroundDialog(page)
  await expect(dialog).toBeVisible()
  await dialog.locator('[data-cy="authorCleanPhrase-episode"] textarea').first().fill(text)

  const answered = page.waitForResponse(
    (response) =>
      response.url().startsWith(`${CORE_DAM_API}${CLEAN_PHRASE_LIST_ENDPOINT}`) &&
      response.url().endsWith('/playground'),
    { timeout: 30000 }
  )
  await dialog.locator('[data-cy="button-confirm"]').click()
  const response = await answered
  expect(response.ok(), `the playground responds ${response.status()}`).toBeTruthy()
  const payload: { authorNames: string[]; authors: string[] } = await response.json()

  /**
   * Waits until the row has as many chips as expected.
   * Author chips are not rendered from the playground answer. It
   * carries author ids that the app resolves in a second request.
   * Reading the instant the answer lands finds an empty row and wrongly reports no author.
   */
  const chips = async (title: string, expected: number): Promise<string[]> => {
    const row = detailRow(dialog, title)
    await expect(row).toBeVisible()
    const chipTexts = row.locator('.v-chip__content')
    await expect(chipTexts, `${title}: ${expected} chip(s) rendered`).toHaveCount(expected)
    return (await chipTexts.allInnerTexts()).map((chip) => chip.trim())
  }
  const result = {
    authorNames: await chips('Reťazce autorov', payload.authorNames.length),
    authors: await chips('Autori', payload.authors.length),
  }

  await dialog.locator('[data-cy="button-cancel"]').click()
  await expect(dialog).toBeHidden()
  return result
}

export async function cleanPhraseStatus(page: Page, id: string): Promise<number> {
  const response = await page.request.get(`${CORE_DAM_API}${CLEAN_PHRASE_ENDPOINT}/${id}`, { failOnStatusCode: false })
  return response.status()
}

export async function deleteCleanPhraseViaApi(page: Page, id: string): Promise<void> {
  await page.request
    .delete(`${CORE_DAM_API}${CLEAN_PHRASE_ENDPOINT}/${id}`, { failOnStatusCode: false })
    .catch(() => {})
}
