import { type Locator, type Page, expect } from '@playwright/test'
import { ALERT_UPDATE, CORE_DAM_API } from '@pages/shared/constants'
import { alertMessage, cardLoad } from '@pages/shared/admin'
import { confirmCreate, createDialog, pickOption, visibleCy } from '@pages/shared/crud'

export interface VoiceFamily {
  slug: string
  displayName: string
  language?: string
  provider?: string
  active?: boolean
}

/**
 * Not `openSettingsSection`: this section renders no breadcrumb, which that helper asserts on.
 */
export async function openVoiceFamilies(page: Page): Promise<void> {
  await page.goto('/settings')
  await visibleCy(page, 'voice-family-settings').click()
  await expect(page).toHaveURL(/\/voice-families$/)
  await cardLoad(page)
}

async function setSwitch(scope: Page | Locator, dataCy: string, on: boolean): Promise<void> {
  const toggle = scope.locator(`[data-cy="${dataCy}"] input`).first()
  if ((await toggle.isChecked()) !== on) await toggle.click()
  await expect(toggle, dataCy).toBeChecked({ checked: on })
}

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

export async function getVoiceFamily(page: Page, id: string): Promise<any> {
  const response = await page.request.get(`${CORE_DAM_API}/voice-family/${id}`)
  expect(response.status(), `GET voice-family ${id}`).toBe(200)
  return response.json()
}

export async function deleteVoiceFamilyViaApi(page: Page, id: string): Promise<void> {
  await page.request.delete(`${CORE_DAM_API}/voice-family/${id}`, { failOnStatusCode: false }).catch(() => {})
}
