import { test, expect, type Page } from '@playwright/test'
import { prepareUser } from '@pages/shared/login'
import { ADMIN_SUITE, ALERT_UPLOAD, RAND_NUM } from '@pages/shared/constants'
import { reloadUntilVisible } from '@pages/shared/admin'
import { uniqueFixtureCopy } from '@pages/shared/fixtures'
import { finishUpload, uploadFile, waitForUpload } from '@pages/shared/upload'
import { cleanupAssets, getAsset, waitForAssetProcessed } from '@pages/shared/api'
import { fillMetadataText, openAssetDetail, saveMetadata } from '@pages/assets/assetDetailPage'
import { tileSelector, tileWithCaption } from '@pages/assets/assetBulkEditPage'
import {
  chooseFilterOption,
  fillFilter,
  openFilterDrawer,
  resetFilter,
  submitFilter,
  submitFilterForTiles,
} from '@pages/assets/assetListFilterPage'
import { TTS_FILTER_LABEL, setTtsAudio, ttsTileBadge } from '@pages/assets/assetTtsPage'

/**
 * The `TTS audio` flag where the asset list meets it: the switch on an audio asset's detail, the
 * `Syntetické (TTS)` filter and the badge the flag puts on a tile.
 *
 * All three read the same flag, so the spec owns one audio asset and flips it, rather than leaning on
 * whichever synthesised assets the environment happens to hold.
 */

let page: Page
let ASSET_ID = ''

const TITLE = `TtsAudio${RAND_NUM}`

/** Filter the list to this spec's asset and a value of the `Syntetické (TTS)` tri-state. */
async function filterSynthetic(filterPage: Page, value: 'áno' | 'nie'): Promise<URLSearchParams> {
  await resetFilter(filterPage)
  await fillFilter(filterPage, 'Text', TITLE)
  await chooseFilterOption(filterPage, TTS_FILTER_LABEL, value)
  return submitFilter(filterPage)
}

test.describe.serial(`${ADMIN_SUITE} - Asset TTS audio flag`, () => {
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext()
    page = await ctx.newPage()
    await prepareUser(page)
  })

  test.afterAll(async () => {
    if (ASSET_ID) await cleanupAssets(page, [ASSET_ID])
    await page.context().close()
  })

  test('uploads an audio asset and titles it', async () => {
    // A unique copy: an identical re-upload is stored as a duplicate, which leaves the asset a draft.
    ASSET_ID = await uploadFile(page, uniqueFixtureCopy('audio/sample.mp3'))
    // Audio regularly takes devel past the default 90s window.
    await waitForUpload(page, ALERT_UPLOAD, 180000)
    await finishUpload(page)
    await waitForAssetProcessed(page, ASSET_ID)

    await openAssetDetail(page, ASSET_ID)
    await fillMetadataText(page, 'title', TITLE)
    await saveMetadata(page)

    expect((await getAsset(page, ASSET_ID)).flags.ttsAudio, 'an upload is not synthetic').toBe(false)
  })

  test('marks the audio asset as TTS audio', async () => {
    await openAssetDetail(page, ASSET_ID)
    await setTtsAudio(page, true)
    await saveMetadata(page)

    expect((await getAsset(page, ASSET_ID)).flags.ttsAudio).toBe(true)
  })

  test('finds it with the "Syntetické (TTS)" filter and badges its tile', async () => {
    await page.goto('/assets')
    await reloadUntilVisible(page, tileSelector(TITLE))
    await openFilterDrawer(page)

    expect((await filterSynthetic(page, 'áno')).get('ttsAudio')).toBe('true')
    await submitFilterForTiles(page, [TITLE])

    // The badge is drawn from the same flag the filter matched on.
    const tile = await tileWithCaption(page, TITLE)
    await expect(ttsTileBadge(tile), 'the TTS badge on the tile').toHaveCount(1)
  })

  test('drops out of the filter when the flag is cleared', async () => {
    await openAssetDetail(page, ASSET_ID)
    await setTtsAudio(page, false)
    await saveMetadata(page)
    expect((await getAsset(page, ASSET_ID)).flags.ttsAudio).toBe(false)

    await page.goto('/assets')
    await reloadUntilVisible(page, tileSelector(TITLE))
    await openFilterDrawer(page)

    expect((await filterSynthetic(page, 'áno')).get('ttsAudio')).toBe('true')
    await submitFilterForTiles(page, [])

    // And the other side of the tri-state now holds it, badge-free.
    expect((await filterSynthetic(page, 'nie')).get('ttsAudio')).toBe('false')
    await submitFilterForTiles(page, [TITLE])
    await expect(ttsTileBadge(await tileWithCaption(page, TITLE))).toHaveCount(0)
  })
})
