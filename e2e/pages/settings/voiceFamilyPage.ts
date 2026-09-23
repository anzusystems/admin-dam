import { type Locator, type Page, expect } from '@playwright/test'
import { ALERT_UPDATE, CORE_DAM_API } from '@pages/shared/constants'
import { alertMessage, cardLoad } from '@pages/shared/admin'
import { confirmCreate, createDialog, pickOption, visibleCy } from '@pages/shared/crud'

/**
 * Voice families — the TTS voices an ext system may narrate with. Each one carries a slug, a display
 * name, a language, an optional preferred provider (`ElevenLabs`, `Google TTS`) and an active flag,
 * and a narration request picks one of them.
 */

export interface VoiceFamily {
  slug: string
  displayName: string
  /** As the select labels them: `Slovenčina` or `Angličtina`. */
  language?: string
  /** As the select labels them: `Žiadny`, `ElevenLabs` or `Google TTS`. */
  provider?: string
  active?: boolean
}

/**
 * Open the voice families list from the settings navigation.
 *
 * Not `openSettingsSection`: this section renders no breadcrumb, which that helper asserts on.
 */
export async function openVoiceFamilies(page: Page): Promise<void> {
  await page.goto('/settings')
  await visibleCy(page, 'voice-family-settings').click()
  await expect(page).toHaveURL(/\/voice-families$/)
  await cardLoad(page)
}

/** Flip a switch inside `scope` to `on`, leaving it alone when it is already there. */
async function setSwitch(scope: Page | Locator, dataCy: string, on: boolean): Promise<void> {
  const toggle = scope.locator(`[data-cy="${dataCy}"] input`).first()
  if ((await toggle.isChecked()) !== on) await toggle.click()
  await expect(toggle, dataCy).toBeChecked({ checked: on })
}

/** Create a voice family through the list's create panel and return its id. */
export async function createVoiceFamily(page: Page, family: VoiceFamily): Promise<string> {
  await openVoiceFamilies(page)
  await visibleCy(page, 'button-create').click()
  const panel = page.locator('[data-cy="create-panel"]')
  await expect(panel).toBeVisible()

  await panel.locator('[data-cy="voice-family-slug"] input').fill(family.slug)
  await panel.locator('[data-cy="voice-family-display-name"] input').fill(family.displayName)
  if (family.language) await pickOption(page, panel.locator('[data-cy="voice-family-language"]'), family.language)
  if (family.provider) {
    await pickOption(page, panel.locator('[data-cy="voice-family-preferred-provider"]'), family.provider)
  }
  if (family.active !== undefined) await setSwitch(panel, 'voice-family-is-active', family.active)

  return confirmCreate(page, createDialog(page), '/voice-family')
}

/** Rename a voice family and flip its active flag through the edit form. */
export async function updateVoiceFamily(page: Page, id: string, displayName: string, active: boolean): Promise<void> {
  await page.goto(`/voice-families/${id}/edit`)
  const input = page.locator('[data-cy="voice-family-display-name"] input')
  // The form renders before the record is fetched, and the fetched values overwrite anything typed earlier.
  await expect(input).not.toHaveValue('')
  await input.fill(displayName)
  await setSwitch(page, 'voice-family-is-active', active)

  await visibleCy(page, 'button-save').click()
  await alertMessage(page, ALERT_UPDATE)
}

/** Fetch a voice family through the admin API. */
export async function getVoiceFamily(page: Page, id: string): Promise<any> {
  const response = await page.request.get(`${CORE_DAM_API}/voice-family/${id}`)
  expect(response.status(), `GET voice-family ${id}`).toBe(200)
  return response.json()
}

/** Best-effort API delete for the voice family a run created. */
export async function deleteVoiceFamilyViaApi(page: Page, id: string): Promise<void> {
  await page.request.delete(`${CORE_DAM_API}/voice-family/${id}`, { failOnStatusCode: false }).catch(() => {})
}
