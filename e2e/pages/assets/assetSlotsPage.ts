import { type Locator, type Page, type Response, expect } from '@playwright/test'
import { ALERT_UPDATE, CORE_DAM_API } from '@pages/shared/constants'
import { alertMessage, closeAlerts } from '@pages/shared/admin'
import { visibleCy } from '@pages/shared/crud'
import { openAssetTab } from '@pages/assets/assetDetailPage'
import { fixture } from '@pages/shared/fixtures'
import { downloadLink } from '@pages/shared/api'

export const MAIN_FILE = 'Hlavný súbor'
export const NO_FILE = 'Žiaden súbor'

const MAKE_MAIN_FILE = 'Spraviť ako hlavný súbor'

export const REMOVE_FILE = 'Odstrániť súbor natrvalo'
export const UNSET_SLOT = 'Odstrániť len prepojenie z daného slotu'
export const REMOVE_ONLY_DESCRIPTION = 'Súbor bude natrvalo odstránený zo systému'
export const REMOVE_BOTH_DESCRIPTION = 'Súbor sa používa vo viacerých slotoch'

export function slotRow(page: Page, slot: string): Locator {
  return page.locator('.sidebar-info .v-row').filter({ hasText: new RegExp(`^\\s*${slot}\\b`) })
}

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

/** `slot` defaults to audio's `free`. Single-slot types (image, video, document) name theirs `default`. */
export async function openSlots(page: Page, assetId: string, slot = 'free'): Promise<void> {
  await openAssetTab(page, assetId, 'button-slots')
  await expect(slotRow(page, slot)).toBeVisible()
}

export async function reloadSlots(page: Page): Promise<void> {
  const reloaded = page.waitForResponse((response: Response) =>
    response.url().startsWith(`${CORE_DAM_API}/asset-slot/asset/`)
  )
  await page.getByRole('button', { name: 'Znovu načítať sloty assetu' }).click()
  await reloaded
}

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
 * The press is re-issued until the menu is up. A dialog or menu still animating closed intercepts
 * pointer events, so a press right after it closes lands on nothing (see `clickForAlert`).
 * Re-pressing is safe because the activator only toggles the menu.
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

export async function closeSlotActions(page: Page): Promise<void> {
  await page.keyboard.press('Escape')
  await expect(page.locator('.v-overlay--active .v-list')).toHaveCount(0, { timeout: 5000 })
}

/**
 * Each text is asserted on its own. `toContainText` given an array expects
 * one element per text, so a single row holding all of them would fail.
 */
export async function expectSlot(page: Page, slot: string, texts: string[], absent: string[] = []): Promise<void> {
  const row = slotRow(page, slot)
  for (const text of texts) await expect(row).toContainText(text)
  for (const text of absent) await expect(row).not.toContainText(text)
}

export async function slotMenuLabels(page: Page, slot: string): Promise<string[]> {
  const menu = await openSlotActions(page, slot)
  await expect(menu.locator('.v-list-item').first()).toBeVisible()
  const labels = (await menu.locator('.v-list-item').allInnerTexts()).map((label) => label.trim())
  await closeSlotActions(page)
  return labels
}

/**
 * The item has no `data-cy`, so it is clicked by label. It renders only for a slot that is not already the main one.
 * A file duplicated into a second slot carries the main flag in both rows, so neither offers it.
 * Nothing is alerted on success, so the PATCH is awaited instead of an alert.
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

export async function offersMakeMainFile(page: Page, slot: string): Promise<boolean> {
  return (await slotMenuLabels(page, slot)).includes(MAKE_MAIN_FILE)
}

/**
 * The app asks the API for a signed link and opens it in a new tab. The
 * browser turns that into a download, so the popup URL stays blank.
 * The link is therefore read from the API answer, not from the tab.
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

/** `expectedOptions` asserts the list of slots the picker offers (every other slot). */
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
 * Unlinking is a choice only when the file sits in more than one
 * slot. For the last slot there is nothing left to unlink it from.
 */
export async function openSlotRemove(page: Page, slot: string): Promise<Locator> {
  const menu = await openSlotActions(page, slot)
  await menu.locator('[data-cy="button-slot-remove"]').click()
  const dialog = page.getByRole('dialog').filter({ has: page.locator('[data-cy="button-remove"]') })
  await expect(dialog.locator('[data-cy="button-remove"]')).toBeVisible()
  return dialog
}

export async function cancelSlotRemove(page: Page, dialog: Locator): Promise<void> {
  await dialog.locator('[data-cy="button-cancel"]').click()
  await expect(dialog).toBeHidden()
  await closeSlotActions(page).catch(() => {})
}

export async function unlinkSlotFile(page: Page, slot: string): Promise<void> {
  const dialog = await openSlotRemove(page, slot)
  await expect(dialog.locator('[data-cy="button-cancel"]')).toBeVisible()
  await expect(dialog.locator('[data-cy="button-remove"]')).toBeVisible()
  await dialog.locator('[data-cy="button-unset"]').click()
  await expect(dialog).toBeHidden()
  await expect(slotRow(page, slot)).toContainText(NO_FILE)
}

/** The file is deleted everywhere, so every other slot holding it is emptied too. */
export async function deleteSlotFile(page: Page, slot: string): Promise<void> {
  const dialog = await openSlotRemove(page, slot)
  await dialog.locator('[data-cy="button-remove"]').click()
  await expect(dialog).toBeHidden()
  await expect(slotRow(page, slot)).toContainText(NO_FILE)
}

export async function uploadIntoSlot(page: Page, assetId: string, slot: string, filePath: string): Promise<void> {
  const slotsReloaded = page.waitForResponse((response: Response) =>
    response.url().startsWith(`${CORE_DAM_API}/asset-slot/asset/${assetId}`)
  )
  await slotRow(page, slot).locator('input[type="file"]').setInputFiles(fixture(filePath))
  await slotsReloaded
}

export function twinRow(page: Page): Locator {
  return page.locator('.sidebar-info .v-row').filter({ hasText: /^\s*Dvojička/ })
}

export async function addFirstAssetAsTwin(page: Page): Promise<{ id: string; tileTitle: string }> {
  await twinRow(page).getByRole('button', { name: 'Pridať' }).click()
  const tile = page.locator('.asset-list-tiles__item').first()
  await expect(tile).toBeVisible()
  const tileTitle = (await tile.locator('[data-cy="asset-tile-title"]').innerText()).trim()
  await tile.click()
  await page.getByRole('button', { name: 'Potvrdiť' }).click()
  const chip = twinRow(page).locator('.v-chip--link')
  await expect(chip).toBeVisible()
  return { id: (await chip.innerText()).trim(), tileTitle }
}
