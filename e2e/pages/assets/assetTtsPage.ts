import { type Locator, type Page, expect } from '@playwright/test'
import { detailSidebar } from '@pages/assets/assetDetailPage'

/**
 * The `TTS audio` flag links three surfaces: the list filter sends `ttsAudio`, the
 * tile badge is drawn from the same flag, and the API field is `flags.ttsAudio`.
 */

export const TTS_FILTER_LABEL = 'Syntetické (TTS)'

/**
 * Rendered only for audio assets. Image and document details show no TTS switch.
 */
export function ttsAudioSwitch(page: Page): Locator {
  return detailSidebar(page)
    .locator('.v-switch, .v-checkbox')
    .filter({ hasText: 'TTS audio' })
    .first()
    .getByRole('checkbox')
}

export async function setTtsAudio(page: Page, on: boolean): Promise<void> {
  const toggle = ttsAudioSwitch(page)
  await expect(toggle, 'the TTS audio switch (audio assets only)').toBeVisible()
  if ((await toggle.isChecked()) !== on) await toggle.click()
  await expect(toggle, 'TTS audio switch').toBeChecked({ checked: on })
}

/**
 * A tile with no flags renders no icons there, so the badge's absence is a count of zero, not a hidden element.
 */
export function ttsTileBadge(tile: Locator): Locator {
  return tile.locator(`.asset-image__meta-icons img[title="${TTS_FILTER_LABEL}"]`)
}
