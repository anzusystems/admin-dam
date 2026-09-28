import { type Locator, type Page, type Response, expect } from '@playwright/test'
import { ALERT_UPDATE, CORE_DAM_API } from '@pages/shared/constants'
import { alertMessage, closeAlerts } from '@pages/shared/admin'
import { visibleCy } from '@pages/shared/crud'
import { openAssetTab } from '@pages/assets/assetDetailPage'
import { fixture } from '@pages/shared/fixtures'
import { downloadLink } from '@pages/shared/api'

/** What a slot row says about the file it holds. */
export const MAIN_FILE = 'Hlavný súbor'
export const NO_FILE = 'Žiaden súbor'

/** The label of the slot action that has no `data-cy` of its own. */
const MAKE_MAIN_FILE = 'Spraviť ako hlavný súbor'

/** The two things the slot remove dialog can do, and the wording it explains itself with. */
export const REMOVE_FILE = 'Odstrániť súbor natrvalo'
export const UNSET_SLOT = 'Odstrániť len prepojenie z daného slotu'
export const REMOVE_ONLY_DESCRIPTION = 'Súbor bude natrvalo odstránený zo systému'
export const REMOVE_BOTH_DESCRIPTION = 'Súbor sa používa vo viacerých slotoch'

/** The row of a slot (free, premium, ...) in the asset's slots tab. */
export function slotRow(page: Page, slot: string): Locator {
  return page.locator('.sidebar-info .v-row').filter({ hasText: new RegExp(`^\\s*${slot}\\b`) })
}

/** Move the main file from the first slot (free) into `slot` through the slot actions menu. */
export async function switchMainFileToSlot(page: Page, slot: string): Promise<void> {
  await visibleCy(page, 'button-slots').click()
  await page.locator('.sidebar-info [data-cy="button-slot-actions"]').first().click()
  await page.locator('.v-overlay--active [data-cy="button-slot-switch"]').click()
  const dialog = page.getByRole('dialog').filter({ hasText: 'Vymeniť s iným slotom' })
  await dialog.locator('[data-cy="button-choose-slot"] .v-field').click()
  await page.getByRole('option', { name: slot, exact: true }).click()
  await dialog.locator('[data-cy="button-unset"]').click()
  await expect(dialog).toBeHidden()
  await page.getByRole('button', { name: 'Znovu načítať sloty assetu' }).click()
}

/**
 * Open the slots tab of an asset detail and wait for its first slot row.
 *
 * `slot` defaults to audio's `free`; the single-slot types (image, video, document) name theirs `default`.
 */
export async function openSlots(page: Page, assetId: string, slot = 'free'): Promise<void> {
  await openAssetTab(page, assetId, 'button-slots')
  await expect(slotRow(page, slot)).toBeVisible()
}

/** Re-fetch the slots through "Znovu načítať sloty assetu". */
export async function reloadSlots(page: Page): Promise<void> {
  const reloaded = page.waitForResponse((response: Response) =>
    response.url().startsWith(`${CORE_DAM_API}/asset-slot/asset/`)
  )
  await page.getByRole('button', { name: 'Znovu načítať sloty assetu' }).click()
  await reloaded
}

/** Make the file of `slot` public or private through its visibility menu. */
export async function setSlotVisibility(page: Page, slot: string, visibility: 'public' | 'private'): Promise<void> {
  await slotRow(page, slot).locator('.mdi-dots-vertical').click()
  if (visibility === 'public') {
    await page.locator('.v-overlay--active .v-list-item').filter({ hasText: 'Nastaviť ako verejné' }).click()
    const dialog = page.getByRole('dialog').filter({ hasText: 'Nastaviť ako verejné' })
    await expect(dialog.locator('[data-cy="button-close"]')).toBeVisible()
    await expect(dialog.locator('[data-cy="button-cancel"]')).toBeVisible()
    await dialog.locator('[data-cy="button-confirm"]').click()
    await alertMessage(page, ALERT_UPDATE)
    await expect(slotRow(page, slot)).toContainText('Súbor je prístupný')
  } else {
    await page.locator('.v-overlay--active .v-list-item').filter({ hasText: 'Nastaviť ako súkromné' }).click()
    await expect(slotRow(page, slot)).toContainText('Súbor je neprístupný')
  }
}

/**
 * Open the actions menu (copy id, download, make main file, duplicate, switch, remove) of `slot`.
 *
 * The press is re-issued until the menu is up: a dialog or menu that is still animating closed keeps
 * intercepting pointer events, so a press right after one closes lands on nothing — the swallowed click
 * `clickForAlert` documents. Re-pressing is safe because the activator only toggles the menu.
 */
export async function openSlotActions(page: Page, slot: string): Promise<Locator> {
  await closeAlerts(page)
  const menu = page.locator('.v-overlay--active .v-list').last()
  await expect(async () => {
    await slotRow(page, slot).locator('[data-cy="button-slot-actions"]').click()
    await expect(menu).toBeVisible({ timeout: 2000 })
  }).toPass({ timeout: 30000 })
  return menu
}

/** Close the slot actions menu and wait until it can no longer swallow the next click. */
export async function closeSlotActions(page: Page): Promise<void> {
  await page.keyboard.press('Escape')
  await expect(page.locator('.v-overlay--active .v-list')).toHaveCount(0, { timeout: 5000 })
}

/**
 * Assert what the row of `slot` says, and what it does not.
 *
 * Every text is asserted on its own: the row is a single element, and `toContainText` given an array
 * expects one *element per text* instead, so a row holding all of them would fail.
 */
export async function expectSlot(page: Page, slot: string, texts: string[], absent: string[] = []): Promise<void> {
  const row = slotRow(page, slot)
  for (const text of texts) await expect(row).toContainText(text)
  for (const text of absent) await expect(row).not.toContainText(text)
}

/** The labels the actions menu of `slot` offers, in the order it lists them. Leaves the menu closed. */
export async function slotMenuLabels(page: Page, slot: string): Promise<string[]> {
  const menu = await openSlotActions(page, slot)
  await expect(menu.locator('.v-list-item').first()).toBeVisible()
  const labels = (await menu.locator('.v-list-item').allInnerTexts()).map((label) => label.trim())
  await closeSlotActions(page)
  return labels
}

/**
 * Make the file of `slot` the asset's main file.
 *
 * The item carries no `data-cy`, so it is clicked by its label, and it is rendered only for a slot that is
 * not already the main one. A file *duplicated* into a second slot takes the main flag into both rows, so
 * neither of those offers it — only a slot holding a different file does.
 *
 * Nothing is alerted on success, which is why the PATCH is what gets waited for rather than an alert.
 */
export async function makeSlotMainFile(page: Page, slot: string): Promise<void> {
  const menu = await openSlotActions(page, slot)
  const patched = page.waitForResponse(
    (response: Response) => response.request().method() === 'PATCH' && /\/asset\/[^/]+\/main$/.test(response.url())
  )
  await menu.locator('.v-list-item').filter({ hasText: MAKE_MAIN_FILE }).click()
  const response = await patched
  expect(response.ok(), `make main file responds ${response.status()}`).toBeTruthy()
  await expect(slotRow(page, slot)).toContainText(MAIN_FILE)
}

/** Whether the actions menu of `slot` offers "Spraviť ako hlavný súbor". Leaves the menu closed. */
export async function offersMakeMainFile(page: Page, slot: string): Promise<boolean> {
  return (await slotMenuLabels(page, slot)).includes(MAKE_MAIN_FILE)
}

/**
 * Download the file of `slot` through its menu, and return the file the app was given a link for.
 *
 * The app asks the API for a signed link and opens it in a new tab, which the browser turns straight into
 * a download — the popup therefore never navigates anywhere and its URL stays blank, so the link has to be
 * read from the API answer rather than from the tab.
 */
export async function downloadSlotFile(page: Page, slot: string): Promise<{ id: string; link: string }> {
  const menu = await openSlotActions(page, slot)
  const linked = downloadLink(page)
  const opened = page.waitForEvent('popup')
  await menu.locator('[data-cy="button-slot-download"]').click()
  const file = await linked
  await (await opened).close().catch(() => {})
  return file
}

/**
 * Duplicate (`button-slot-duplicate`) or switch (`button-slot-switch`) the file of `slot` into `target`. The
 * slot picker offers every other slot; `expectedOptions` asserts that list.
 */
export async function moveSlotFile(
  page: Page,
  action: 'button-slot-duplicate' | 'button-slot-switch',
  slot: string,
  target: string,
  expectedOptions: string[]
): Promise<void> {
  const menu = await openSlotActions(page, slot)
  await menu.locator(`[data-cy="${action}"]`).click()
  const dialog = page.getByRole('dialog').filter({ has: page.locator('[data-cy="button-choose-slot"]') })
  await dialog.locator('[data-cy="button-choose-slot"]').click()
  await expect(page.getByRole('option')).toHaveText(expectedOptions)
  await page.getByRole('option', { name: target, exact: true }).click()
  await dialog.locator('[data-cy="button-unset"]').click()
  await expect(dialog).toBeHidden()
}

/**
 * Open the remove confirmation of `slot` and return it.
 *
 * What it offers depends on how many slots hold the file: unlinking is only a choice when the file sits in
 * more than one, because for the last slot there would be nothing left to unlink it from.
 */
export async function openSlotRemove(page: Page, slot: string): Promise<Locator> {
  const menu = await openSlotActions(page, slot)
  await menu.locator('[data-cy="button-slot-remove"]').click()
  const dialog = page.getByRole('dialog').filter({ has: page.locator('[data-cy="button-remove"]') })
  await expect(dialog.locator('[data-cy="button-remove"]')).toBeVisible()
  return dialog
}

/** Close the remove confirmation without removing anything. */
export async function cancelSlotRemove(page: Page, dialog: Locator): Promise<void> {
  await dialog.locator('[data-cy="button-cancel"]').click()
  await expect(dialog).toBeHidden()
  await closeSlotActions(page).catch(() => {})
}

/** Unlink the file from `slot` only (not deleting the file) through the slot's remove action. */
export async function unlinkSlotFile(page: Page, slot: string): Promise<void> {
  const dialog = await openSlotRemove(page, slot)
  await expect(dialog.locator('[data-cy="button-cancel"]')).toBeVisible()
  await expect(dialog.locator('[data-cy="button-remove"]')).toBeVisible()
  await dialog.locator('[data-cy="button-unset"]').click()
  await expect(dialog).toBeHidden()
  await expect(slotRow(page, slot)).toContainText(NO_FILE)
}

/**
 * Delete the file of `slot` from the system through the remove dialog's permanent option. The file goes
 * everywhere at once, so every other slot holding it is emptied too.
 */
export async function deleteSlotFile(page: Page, slot: string): Promise<void> {
  const dialog = await openSlotRemove(page, slot)
  await dialog.locator('[data-cy="button-remove"]').click()
  await expect(dialog).toBeHidden()
  await expect(slotRow(page, slot)).toContainText(NO_FILE)
}

/** Upload a file (fixture name or absolute path) into the empty `slot` of the asset shown in the detail. */
export async function uploadIntoSlot(page: Page, assetId: string, slot: string, filePath: string): Promise<void> {
  const slotsReloaded = page.waitForResponse((response: Response) =>
    response.url().startsWith(`${CORE_DAM_API}/asset-slot/asset/${assetId}`)
  )
  await slotRow(page, slot).locator('input[type="file"]').setInputFiles(fixture(filePath))
  await slotsReloaded
}

/** The "Dvojička" (twin asset) row of the slots tab. */
export function twinRow(page: Page): Locator {
  return page.locator('.sidebar-info .v-row').filter({ hasText: /^\s*Dvojička/ })
}

/** Link the first asset of the picker as the twin and return its id and the title its tile shows. */
export async function addFirstAssetAsTwin(page: Page): Promise<{ id: string; tileTitle: string }> {
  await twinRow(page).getByRole('button', { name: 'Pridať' }).click()
  const tile = page.locator('.asset-list-tiles__item').first()
  await expect(tile).toBeVisible()
  const tileTitle = (await tile.locator('.text-truncate').first().innerText()).trim()
  await tile.click()
  await page.getByRole('button', { name: 'Potvrdiť' }).click()
  const chip = twinRow(page).locator('.v-chip--link')
  await expect(chip).toBeVisible()
  return { id: (await chip.innerText()).trim(), tileTitle }
}
