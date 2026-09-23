import { type Locator, type Page, expect } from '@playwright/test'
import { ALERT_DELETE, ALERT_UPDATE } from '@pages/shared/constants'
import { alertMessage, clickForAlert, closeAlerts } from '@pages/shared/admin'
import { createdId } from '@pages/assets/assetDetailPage'

/**
 * Bulk editing of the assets selected in the asset list.
 *
 * Selecting tiles fills a queue (`QUEUE_ID_MASS_EDIT`) that the footer renders as one editable row per
 * asset. "Upraviť" expands the footer to the full editor, and "Hromadné operácie" adds a sidebar that
 * writes one value into every row at once — either into the rows that are still empty ("Vyplňte prázdne
 * pole") or into all of them ("Nahradiť všade"). Nothing reaches the API until the selection is saved.
 */

/** Which rows a mass operation writes to. */
export type MassOperation = 'fill-empty' | 'replace-all'

const MASS_OPERATION_ICON: Record<MassOperation, string> = {
  'fill-empty': '.mdi-file-arrow-left-right-outline',
  'replace-all': '.mdi-file-replace-outline',
}

/** The footer holding the current selection. Present even with nothing selected, then reading "0". */
export function selectedFooter(page: Page): Locator {
  return page.locator('.asset-footer__selected')
}

/** The mass operations sidebar of the expanded editor. */
export function massSidebar(page: Page): Locator {
  return page.locator('.asset-queue-editable__sidebar')
}

/**
 * The editable textarea of a text metadata field, inside `scope` (a selection row or the mass sidebar).
 * Vuetify renders a second, hidden textarea to size the visible one, hence `.first()`.
 */
export function fieldTextarea(scope: Locator, name: string): Locator {
  return scope.locator(`[data-cy="custom-field-${name}"] textarea`).first()
}

/**
 * The tiles of the asset list, in the order it shows them — newest first under the default ordering.
 *
 * Position is the only identity a tile has: it carries no asset id, and neither its thumbnail nor its
 * caption is unique (assets sharing a file, a podcast cover or a title all render the same). Callers
 * pin the tiles they mean down by asserting their captions before acting on them.
 */
export function tiles(page: Page): Locator {
  return page.locator('.dam-image-grid__item')
}

/** Selector of the tile captioned `caption` — for waiting out the search index after an upload. */
export function tileSelector(caption: string): string {
  return `.dam-image-grid__item:has-text("${caption}")`
}

/**
 * The one tile captioned `caption` — an asset's title, or its file name while it has no title.
 *
 * Position cannot identify a tile: assets uploaded in the same batch share a `createdAt` second, and
 * the list returns those in no fixed order. A caption the test made unique is the dependable handle,
 * so this insists on matching exactly one tile.
 */
export async function tileWithCaption(page: Page, caption: string): Promise<Locator> {
  const tile = page.locator(tileSelector(caption))
  await expect(tile, `tiles captioned "${caption}"`).toHaveCount(1)
  return tile
}

/** Whether a tile is currently part of the selection. */
async function isSelected(tile: Locator): Promise<boolean> {
  return ((await tile.getAttribute('class')) ?? '').includes('dam-image-grid__item--selected')
}

/**
 * Select a tile through its checkbox button, which only mounts while the tile is hovered.
 * `modifiers` reaches the tile itself: Control toggles one tile, Shift takes the range up to it.
 *
 * The press is repeated until the tile reports itself selected. Emptying the selection unmounts the
 * footer, and the grid reflows into the freed space while the next press is on its way, which
 * swallows it — the same lost click `clickForAlert` retries around. Re-checking before each attempt
 * keeps the retry from toggling a selection that did land back off.
 */
export async function selectTile(page: Page, tile: Locator, modifiers?: Array<'Control' | 'Shift'>): Promise<void> {
  await expect(tile).toBeVisible()
  await expect(async () => {
    if (!(await isSelected(tile))) {
      await tile.hover()
      if (modifiers) {
        await tile.click({ modifiers })
      } else {
        await tile.locator('.detail-icon').first().click()
      }
    }
    await expect(tile).toHaveClass(/dam-image-grid__item--selected/, { timeout: 2000 })
  }).toPass({ timeout: 20000 })
}

/**
 * Assert how many assets the selection holds. The tiles are the reliable source — an emptied selection
 * unmounts its footer — so the footer is only checked while there is something in it.
 */
export async function expectSelectedCount(page: Page, count: number): Promise<void> {
  await expect(page.locator('.dam-image-grid__item--selected')).toHaveCount(count)
  if (count > 0) await expect(selectedFooter(page)).toContainText(`Vybrané súbory: ${count}`)
}

/** Expand the selection footer into the full editor and wait for a row per selected asset. */
export async function openSelectionEditor(page: Page, rowCount: number): Promise<void> {
  await selectedFooter(page).getByRole('button', { name: 'Upraviť' }).first().click()
  await expect(page.locator('.asset-queue-editable')).toBeVisible()
  await expect(page.locator('.dam-upload-queue__item')).toHaveCount(rowCount)
}

/** Open the mass operations sidebar of the expanded editor. */
export async function openMassOperations(page: Page): Promise<void> {
  if (await massSidebar(page).isVisible()) return
  await selectedFooter(page).getByRole('button', { name: 'Hromadné operácie' }).first().click()
  await expect(massSidebar(page)).toBeVisible()
}

/** Labels of the mass operations fields that carry no `data-cy` of their own. */
const MASS_FIELD_LABEL: Record<string, string> = {
  keywords: 'Kľúčové slová',
  authors: 'Autori',
}

/** The row of one field in the mass operations form, holding the field and its two apply buttons. */
function massRow(page: Page, field: string): Locator {
  const rows = massSidebar(page).locator('.v-row')
  const label = MASS_FIELD_LABEL[field]
  return label
    ? rows.filter({ hasText: label })
    : rows.filter({ has: page.locator(`[data-cy="custom-field-${field}"]`) })
}

/** Type a value into a text field of the mass operations form. It is not applied until `applyMass`. */
export async function fillMassText(page: Page, field: string, value: string): Promise<void> {
  await fieldTextarea(massSidebar(page), field).fill(value)
}

/**
 * Create a keyword from the mass operations form and leave it in that form, ready to be applied.
 * Returns its id, so the spec can delete it afterwards.
 */
export async function addMassKeyword(page: Page, name: string): Promise<string> {
  const field = massRow(page, 'keywords')
  await field.locator('input').first().fill(name)
  const created = createdId(page, 'keyword')
  // With nothing matching the typed text the list offers it as a new record, behind its own button.
  await page.getByRole('option', { name }).getByRole('button', { name }).click()
  const id = await created
  await expect(field.locator('.v-chip')).toContainText([name])
  await page.keyboard.press('Escape')
  // Creating the record raises an alert, which goes on intercepting clicks for its leave transition.
  await closeAlerts(page)
  return id
}

/** Create an author through the mass operations form's "+" and return its id. */
export async function addMassAuthor(page: Page, name: string): Promise<string> {
  const field = massRow(page, 'authors')
  const dialog = page.getByRole('dialog').filter({ has: page.locator('[data-cy="author-name"]') })
  // The press is repeated until the dialog is up: an alert or a menu still closing over the form
  // swallows it silently, and the fill below would then type into the page behind it.
  await expect(async () => {
    if (!(await dialog.isVisible())) {
      await closeAlerts(page)
      await field.locator('[data-cy="add-author"]').click()
    }
    await expect(dialog).toBeVisible({ timeout: 2000 })
  }).toPass({ timeout: 20000 })
  await dialog.locator('[data-cy="author-name"] input').fill(name)
  const created = createdId(page, 'author')
  await dialog.locator('[data-cy="button-confirm"]').click()
  const id = await created
  await expect(dialog).toBeHidden()
  await expect(field.locator('.v-chip')).toContainText([name])
  await closeAlerts(page)
  return id
}

/**
 * Write the mass operations value of one field into the selected rows — into the rows where it is still
 * empty, or into all of them. The rows are updated in the browser; the API sees nothing until the
 * selection is saved.
 */
export async function applyMass(page: Page, field: string, operation: MassOperation): Promise<void> {
  await massRow(page, field).locator(MASS_OPERATION_ICON[operation]).first().click()
}

/** Apply every filled field of the mass operations form at once, through the buttons below it. */
export async function applyMassForm(page: Page, operation: MassOperation): Promise<void> {
  const name = operation === 'fill-empty' ? 'Vyplniť len prázdne' : 'Nahradiť všetko'
  await massSidebar(page).getByRole('button', { name }).click()
}

/** Empty the mass operations form itself. The rows keep whatever was already applied to them. */
export async function clearMassForm(page: Page): Promise<void> {
  await massSidebar(page).getByRole('button', { name: 'Vyčistiť' }).click()
}

/** The current value of a text field in each selected row, in selection order. */
export async function rowTexts(page: Page, name: string): Promise<string[]> {
  const rows = page.locator('.dam-upload-queue__item')
  const values: string[] = []
  for (let i = 0; i < (await rows.count()); i++) {
    values.push(await fieldTextarea(rows.nth(i), name).inputValue())
  }
  return values
}

/** Save every selected asset and close the editor — the selection is cleared by the save. */
export async function saveSelection(page: Page): Promise<void> {
  await clickForAlert(page, selectedFooter(page).getByRole('button', { name: 'Uložiť a ukončiť' }), ALERT_UPDATE)
  await expectSelectedCount(page, 0)
}

/** Save every selected asset through the second save button, which leaves the selection open. */
export async function saveSelectionKeepingOpen(page: Page, rowCount: number): Promise<void> {
  await clickForAlert(page, selectedFooter(page).locator('button .mdi-content-save'), ALERT_UPDATE)
  await expect(page.locator('.dam-upload-queue__item')).toHaveCount(rowCount)
  await expectSelectedCount(page, rowCount)
}

/**
 * The asset id of one selection row, taken from its copy button. A row shows no id of its own, and once
 * a mass operation has given every row the same title their captions no longer tell them apart.
 */
export async function copyRowAssetId(page: Page, index: number): Promise<string> {
  await page.locator('.dam-upload-queue__item').nth(index).locator('[data-cy="table-copy"]').click()
  await alertMessage(page, 'ID bolo skopírované do schránky')
  const id = (await page.evaluate(() => navigator.clipboard.readText())).trim()
  expect(id, 'copied asset id').toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
  return id
}

/**
 * Delete the asset of one selection row through its trash button. This is a real delete, not a way to
 * drop the row: the button removes the asset itself and the row goes with it.
 */
export async function deleteSelectionRow(page: Page, index: number): Promise<void> {
  const rows = page.locator('.dam-upload-queue__item')
  const remaining = (await rows.count()) - 1
  await rows.nth(index).locator('[data-cy="button-delete"]').click()
  const dialog = page.getByRole('dialog').filter({ hasText: 'Odstrániť?' })
  await expect(dialog).toBeVisible()
  await clickForAlert(page, dialog.getByRole('button', { name: 'Zmazať' }), ALERT_DELETE)
  await expect(rows).toHaveCount(remaining)
}

/**
 * Drop the selection through its close button, confirming the warning that unsaved work is lost. The
 * button carries no `data-cy` and the compact footer renders a different set, so it is taken by its icon
 * inside the footer's own action bar.
 */
export async function clearSelection(page: Page): Promise<void> {
  await selectedFooter(page).locator('button .mdi-close').first().click()
  const dialog = page.getByRole('dialog').filter({ hasText: 'Neuložená práca bude stratená' })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'Zrušiť výber' }).click()
  await expect(dialog).toBeHidden()
  await expectSelectedCount(page, 0)
}
