import { type Locator, type Page, expect } from '@playwright/test'
import { ALERT_UPDATE } from '@pages/shared/constants'
import { clickForAlert } from '@pages/shared/admin'
import { waitForAssetList } from '@pages/shared/upload'
import { tileWithCaption } from '@pages/assets/assetBulkEditPage'

export type DisplayMode = 'tiles' | 'grid' | 'list'

const MODE_ICON: Record<DisplayMode, string> = {
  tiles: 'mdi-view-compact',
  grid: 'mdi-view-grid',
  list: 'mdi-view-headline',
}

export async function openAssetList(page: Page): Promise<void> {
  const loaded = waitForAssetList(page)
  await page.goto('/assets')
  await loaded
}

export async function switchDisplayMode(page: Page, mode: DisplayMode): Promise<void> {
  await page.locator(`.v-btn:has(.${MODE_ICON[mode]})`).click()
}

export function listRows(page: Page) {
  return page.locator('tr.a-table__row')
}

export async function expectImageGrid(page: Page, variant: 'masonry' | 'thumbnail'): Promise<void> {
  await expect(page.locator('.dam-image-grid')).toHaveClass(new RegExp(`dam-image-grid--${variant}`))
}

/**
 * Not a fourth display mode, although it shares their toolbar group. It
 * is an independent toggle that stays open while the layout changes.
 * It edits the active asset (the one whose tile was clicked).
 * It is the only place besides the asset detail where several custom fields appear.
 */
export function infoDrawer(page: Page): Locator {
  return page.locator('nav.v-navigation-drawer--right').first()
}

export async function isInfoCardOpen(page: Page): Promise<boolean> {
  return ((await infoDrawer(page).getAttribute('class')) ?? '').includes('v-navigation-drawer--active')
}

export async function openInfoCard(page: Page): Promise<void> {
  if (await isInfoCardOpen(page)) return
  await page.locator(`.v-btn:has(.${INFO_CARD_ICON})`).first().click()
  await expect(infoDrawer(page)).toHaveClass(/v-navigation-drawer--active/)
}

export async function closeInfoCard(page: Page): Promise<void> {
  if (!(await isInfoCardOpen(page))) return
  await page.locator(`.v-btn:has(.${INFO_CARD_ICON})`).first().click()
  await expect(infoDrawer(page)).not.toHaveClass(/v-navigation-drawer--active/)
}

const INFO_CARD_ICON = 'mdi-information-outline'

/**
 * Activating is a click on the tile itself. A click on its checkbox selects it instead,
 * which fills the bulk editor queue and leaves the info card on the previous asset.
 * The press is repeated because the grid reflows as the drawer opens and swallows a click.
 */
export async function activateTile(page: Page, caption: string): Promise<Locator> {
  const tile = await tileWithCaption(page, caption)
  await expect(async () => {
    if (!((await tile.getAttribute('class')) ?? '').includes('dam-image-grid__item--active')) {
      await tile.click()
    }
    await expect(tile).toHaveClass(/dam-image-grid__item--active/, { timeout: 2000 })
  }).toPass({ timeout: 20000 })
  return tile
}

export function infoField(page: Page, name: string): Locator {
  return infoDrawer(page).locator(`[data-cy="custom-field-${name}"]`).first()
}

/**
 * Title, location, source keywords and media API fields are
 * rendered but hidden until "Zobraziť viac detailov" is pressed.
 */
export async function revealInfoDetails(page: Page): Promise<void> {
  const more = infoDrawer(page).getByRole('button', { name: /^Zobraziť viac/ })
  if (await more.isVisible()) await more.click()
  await expect(infoField(page, 'location')).toBeVisible()
}

export async function fillInfoText(page: Page, name: string, value: string): Promise<void> {
  // Vuetify renders a second, hidden textarea to size the visible one, hence `.first()`.
  await infoField(page, name).locator('textarea').first().fill(value)
}

export function infoInput(page: Page, name: string): Locator {
  return infoField(page, name).locator('textarea, input').first()
}

export function infoSwitch(page: Page, label: string): Locator {
  return infoDrawer(page).locator('.v-switch, .v-checkbox').filter({ hasText: label }).first().getByRole('checkbox')
}

export async function setInfoSwitch(page: Page, label: string, on: boolean): Promise<void> {
  const toggle = infoSwitch(page, label)
  await expect(toggle).toBeVisible()
  if ((await toggle.isChecked()) !== on) await toggle.click()
  await expect(toggle, `switch "${label}"`).toBeChecked({ checked: on })
}

export async function saveInfoCard(page: Page): Promise<void> {
  await clickForAlert(page, infoDrawer(page).getByRole('button', { name: 'Uložiť', exact: true }), ALERT_UPDATE)
}

/**
 * Uses the tile's `mdi-pencil` action, which mounts only while the tile is hovered.
 * This is the user's route and the only one that gives the lightbox a list to walk. Navigating to
 * `/assets/<id>` reloads the app, and the lightbox opens with no neighbours and no position counter.
 */
export async function openLightboxFromTile(page: Page, caption: string): Promise<void> {
  const tile = await tileWithCaption(page, caption)
  await expect(async () => {
    await tile.hover()
    await tile.locator('.dam-image-grid__item-card-actions button:has(.mdi-pencil)').first().click()
    await expect(page.locator('.dam-image-detail')).toBeVisible({ timeout: 3000 })
  }).toPass({ timeout: 20000 })
}
