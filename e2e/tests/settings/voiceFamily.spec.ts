import { test, expect, type Page } from '@playwright/test'
import { prepareUser } from '@pages/shared/login'
import { ADMIN_SUITE, RAND_NUM } from '@pages/shared/constants'
import { filterBy } from '@pages/shared/admin'
import { openDetailAndClose, resetFilters, rowWithCell } from '@pages/shared/crud'
import {
  createVoiceFamily,
  deleteVoiceFamilyViaApi,
  getVoiceFamily,
  openVoiceFamilies,
  updateVoiceFamily,
} from '@pages/settings/voiceFamilyPage'

/**
 * Voice families — the TTS voices an ext system narrates with, and the thing a narration request
 * points at. They are fully editable records, unlike the requests themselves.
 */

let page: Page
let VOICE_FAMILY_ID = ''

const SLUG = `voice-${RAND_NUM}`
const DISPLAY_NAME = `Voice ${RAND_NUM}`

test.describe.serial(`${ADMIN_SUITE} - Voice family`, () => {
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext()
    page = await ctx.newPage()
    await prepareUser(page)
  })

  test.afterAll(async () => {
    if (VOICE_FAMILY_ID) await deleteVoiceFamilyViaApi(page, VOICE_FAMILY_ID)
    await page.context().close()
  })

  test('creates a voice family', async () => {
    VOICE_FAMILY_ID = await createVoiceFamily(page, {
      slug: SLUG,
      displayName: DISPLAY_NAME,
      language: 'Slovenčina',
      provider: 'ElevenLabs',
      active: true,
    })

    // The select labels are display names; the API stores the slugs behind them.
    const saved = await getVoiceFamily(page, VOICE_FAMILY_ID)
    expect(saved.slug).toBe(SLUG)
    expect(saved.displayName).toBe(DISPLAY_NAME)
    expect(saved.language).toBe('sk')
    expect(saved.preferredProvider).toBe('elevenlabs')
    expect(saved.active).toBe(true)
  })

  test('shows the created voice family on its detail', async () => {
    await openVoiceFamilies(page)
    await filterBy(page, 'Zobrazovaný názov', DISPLAY_NAME)
    expect(await openDetailAndClose(page, DISPLAY_NAME, 'voice-families')).toBe(VOICE_FAMILY_ID)
  })

  test('renames it and switches it inactive', async () => {
    await updateVoiceFamily(page, VOICE_FAMILY_ID, `${DISPLAY_NAME}-edit`, false)

    const saved = await getVoiceFamily(page, VOICE_FAMILY_ID)
    expect(saved.displayName).toBe(`${DISPLAY_NAME}-edit`)
    expect(saved.active).toBe(false)
    // The slug is not touched by a rename — it is what the narration requests refer to.
    expect(saved.slug).toBe(SLUG)
  })

  test('finds the renamed voice family in the list', async () => {
    await openVoiceFamilies(page)
    await resetFilters(page)
    await filterBy(page, 'Zobrazovaný názov', `${DISPLAY_NAME}-edit`)
    await expect(rowWithCell(page, `${DISPLAY_NAME}-edit`)).toHaveCount(1)
    await expect(rowWithCell(page, SLUG)).toHaveCount(1)
    await resetFilters(page)
  })
})
