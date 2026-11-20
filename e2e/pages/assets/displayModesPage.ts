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

/** Open the asset list and wait for its first page of assets. */
export async function openAssetList(page: Page): Promise<void> {
  const loaded = waitForAssetList(page)
  await page.goto('/assets')
  await loaded
}

/** Switch the asset list layout with the toolbar toggle. */
export async function switchDisplayMode(page: Page, mode: DisplayMode): Promise<void> {
  await page.locator(`.v-btn:has(.${MODE_ICON[mode]})`).click()
}

/** Asset rows of the list layout. */
export function listRows(page: Page) {
  return page.locator('tr.a-table__row')
}

/** Assert the asset image grid is rendered in the given layout variant (`masonry`, `thumbnail`). */
export async function expectImageGrid(page: Page, variant: 'masonry' | 'thumbnail'): Promise<void> {
  await expect(page.locator('.dam-image-grid')).toHaveClass(new RegExp(`dam-image-grid--${variant}`))
}

// Info card

/**
 * The "Info karta" drawer, opened by the `mdi-information-outline` button that sits beside the three
 * display mode buttons.
 *
 * It is **not a fourth display mode**, even though it shares their toolbar group: it is an independent
 * toggle that stays open while tiles, grid and list swap underneath it. It edits whichever asset is
 * *active* — the one whose tile was clicked — and is the only place several custom fields appear
 * outside the asset detail.
 */
export function infoDrawer(page: Page): Locator {
  return page.locator('nav.v-navigation-drawer--right').first()
}

/** Whether the info card is slid into the viewport. */
export async function isInfoCardOpen(page: Page): Promise<boolean> {
  return ((await infoDrawer(page).getAttribute('class')) ?? '').includes('v-navigation-drawer--active')
}

/** Open the info card, if it is not open already. */
export async function openInfoCard(page: Page): Promise<void> {
  if (await isInfoCardOpen(page)) return
  await page.locator(`.v-btn:has(.${INFO_CARD_ICON})`).first().click()
  await expect(infoDrawer(page)).toHaveClass(/v-navigation-drawer--active/)
}

/** Close the info card, if it is open. */
export async function closeInfoCard(page: Page): Promise<void> {
  if (!(await isInfoCardOpen(page))) return
  await page.locator(`.v-btn:has(.${INFO_CARD_ICON})`).first().click()
  await expect(infoDrawer(page)).not.toHaveClass(/v-navigation-drawer--active/)
}

const INFO_CARD_ICON = 'mdi-information-outline'

/**
 * Make the tile captioned `caption` the active asset, which is what the info card then edits.
 *
 * Activating is a click on the tile itself; a click on its checkbox would *select* it instead, which
 * fills the bulk editor's queue and leaves the info card on whatever was active before. The press is
 * repeated because the grid reflows as the drawer opens, and that swallows a click on its way.
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

/** A custom metadata field of the info card, e.g. `description`, `location`, `focusX`. */
export function infoField(page: Page, name: string): Locator {
  return infoDrawer(page).locator(`[data-cy="custom-field-${name}"]`).first()
}

/**
 * Expand the info card's collapsed fields. Title, location, source keywords and the media API fields
 * are rendered but hidden until "Zobraziť viac detailov" is pressed.
 */
export async function revealInfoDetails(page: Page): Promise<void> {
  const more = infoDrawer(page).getByRole('button', { name: /^Zobraziť viac/ })
  if (await more.isVisible()) await more.click()
  await expect(infoField(page, 'location')).toBeVisible()
}

/** Replace the text of a textarea field of the info card; an empty `value` clears it. */
export async function fillInfoText(page: Page, name: string, value: string): Promise<void> {
  // Vuetify renders a second, hidden textarea to size the visible one, hence `.first()`.
  await infoField(page, name).locator('textarea').first().fill(value)
}

/** The input of a custom field of the info card, whether it is a textarea or a plain input. */
export function infoInput(page: Page, name: string): Locator {
  return infoField(page, name).locator('textarea, input').first()
}

/** The switch of the info card labelled `label`, e.g. `Jednorazová licencia`. */
export function infoSwitch(page: Page, label: string): Locator {
  return infoDrawer(page).locator('.v-switch, .v-checkbox').filter({ hasText: label }).first().getByRole('checkbox')
}

/** Flip a switch of the info card to `on`, leaving it alone when it is already there. */
export async function setInfoSwitch(page: Page, label: string, on: boolean): Promise<void> {
  const toggle = infoSwitch(page, label)
  await expect(toggle).toBeVisible()
  if ((await toggle.isChecked()) !== on) await toggle.click()
  await expect(toggle, `switch "${label}"`).toBeChecked({ checked: on })
}

/** Save the info card's form. Nothing typed into it reaches the API until this runs. */
export async function saveInfoCard(page: Page): Promise<void> {
  await clickForAlert(page, infoDrawer(page).getByRole('button', { name: 'Uložiť', exact: true }), ALERT_UPDATE)
}

/**
 * Open the lightbox on the tile captioned `caption`, through the tile's own `mdi-pencil` action (it
 * only mounts while the tile is hovered).
 *
 * This is the route a user takes, and the only one that gives the lightbox a list to walk: navigating
 * to `/assets/<id>` directly reloads the app, and the lightbox then opens on an asset with no
 * neighbours and no position counter.
 */
export async function openLightboxFromTile(page: Page, caption: string): Promise<void> {
  const tile = await tileWithCaption(page, caption)
  await expect(async () => {
    await tile.hover()
    await tile.locator('.dam-image-grid__item-card-actions button:has(.mdi-pencil)').first().click()
    await expect(page.locator('.dam-image-detail')).toBeVisible({ timeout: 3000 })
  }).toPass({ timeout: 20000 })
}
