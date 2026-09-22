import { type Locator, type Page, expect } from '@playwright/test'
import { detailSidebar } from '@pages/assets/assetDetailPage'

/**
 * The TTS side of an asset: the `TTS audio` flag on an audio asset's detail, the `Syntetické (TTS)`
 * badge its tile then carries, and the detail's own TTS tab.
 *
 * The flag is the link between the three surfaces — the list filter sends `ttsAudio`, the badge is
 * drawn from the same flag, and it is `flags.ttsAudio` in the API.
 */

/** The label the app uses for the flag, on the switch, the badge and the list filter. */
export const TTS_FILTER_LABEL = 'Syntetické (TTS)'

/**
 * The `TTS audio` switch of the asset detail sidebar. It is only rendered for **audio** assets — an
 * image or a document detail shows `Jednorazová licencia` and the internal flags but no TTS switch.
 */
export function ttsAudioSwitch(page: Page): Locator {
  return detailSidebar(page)
    .locator('.v-switch, .v-checkbox')
    .filter({ hasText: 'TTS audio' })
    .first()
    .getByRole('checkbox')
}

/** Flip the `TTS audio` switch to `on`, leaving it alone when it is already there. Does not save. */
export async function setTtsAudio(page: Page, on: boolean): Promise<void> {
  const toggle = ttsAudioSwitch(page)
  await expect(toggle, 'the TTS audio switch (audio assets only)').toBeVisible()
  if ((await toggle.isChecked()) !== on) await toggle.click()
  await expect(toggle, 'TTS audio switch').toBeChecked({ checked: on })
}

/**
 * The `Syntetické (TTS)` badge of a tile, one of the small overlay icons in its corner. A tile with no
 * flags at all renders no icons there, so the badge's absence is a count of zero rather than a hidden
 * element.
 */
export function ttsTileBadge(tile: Locator): Locator {
  return tile.locator(`.asset-image__meta-icons img[title="${TTS_FILTER_LABEL}"]`)
}
