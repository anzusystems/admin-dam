import { test, expect, type Page } from '@playwright/test'
import { prepareUser } from '@pages/shared/login'
import { ADMIN_SUITE } from '@pages/shared/constants'
import { expectNoWrite } from '@pages/shared/errors'
import {
  COLUMN,
  cancelSynthesizeDialog,
  columnValues,
  filterByState,
  filterByVoiceFamilySlug,
  narrationRows,
  openNarrationRequests,
  openSynthesizeDialog,
  resetNarrationFilters,
} from '@pages/settings/ttsNarrationRequestPage'

/**
 * The TTS narration request log.
 *
 * Nothing here creates a request: the only write the section offers is `Syntetizovať`, and confirming
 * it bills a real provider call and leaves an audio asset behind. So the filters are asserted as
 * *properties* of whatever the environment holds — every row a state filter returns carries that
 * state — which holds regardless of which requests exist, and the synthesize form is opened and
 * cancelled with a check that nothing was queued.
 *
 * The one thing this cannot survive is an environment with no narration requests at all; the first
 * test says so plainly rather than letting the rest pass vacuously.
 */

let page: Page

test.describe.serial(`${ADMIN_SUITE} - TTS narration requests`, () => {
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext()
    page = await ctx.newPage()
    await prepareUser(page)
    await openNarrationRequests(page)
  })

  test.afterAll(async () => {
    await page.context().close()
  })

  test('lists the narration requests with their state, voice family and mode', async () => {
    await expect(page.locator('thead th').first()).toBeVisible()
    expect(await page.locator('thead th').allInnerTexts()).toEqual([
      'ID',
      'Stav',
      'Hlasová rodina',
      'Mód',
      'Nadpis',
      'Začaté',
      'Vytvorené',
      '',
    ])

    const rows = await narrationRows(page).count()
    expect(rows, 'this environment holds narration requests to assert against').toBeGreaterThan(0)

    expect((await columnValues(page, COLUMN.voiceFamily))[0].trim(), 'the first row names a voice family').not.toBe('')
    expect((await columnValues(page, COLUMN.mode))[0].trim()).not.toBe('')
  })

  test('filters the requests down to one state', async () => {
    await filterByState(page, 'Hotové')

    const states = await columnValues(page, COLUMN.state)
    expect(states.length, 'the environment has finished requests').toBeGreaterThan(0)
    // Every row that came back carries the filtered state — true whatever the environment holds.
    for (const state of states) expect(state.trim()).toBe('Hotové')
  })

  test('filters the requests by the voice family slug', async () => {
    await resetNarrationFilters(page)
    // Read the slug here rather than carrying it over from another test, so this one stands alone.
    const slug = (await columnValues(page, COLUMN.voiceFamily))[0].trim()
    expect(slug, 'a voice family slug to filter by').not.toBe('')

    await filterByVoiceFamilySlug(page, slug)

    // The UI sends `filter_eq[voiceFamilySlug]`, an exact match, so every row must be that family.
    const families = await columnValues(page, COLUMN.voiceFamily)
    expect(families.length).toBeGreaterThan(0)
    for (const family of families) expect(family.trim()).toBe(slug)
    await resetNarrationFilters(page)
  })

  test('opens the synthesize form and queues nothing when it is cancelled', async () => {
    const dialog = await openSynthesizeDialog(page)
    for (const field of ['synthesize-text', 'synthesize-voice-family', 'synthesize-asset-licence']) {
      await expect(dialog.locator(`[data-cy="${field}"]`), field).toBeVisible()
    }

    // Cancelling must not reach the API.
    await expectNoWrite(page, async () => {
      await cancelSynthesizeDialog(page)
    })
  })
})
