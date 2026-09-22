import { test, expect, type Page } from '@playwright/test'
import { prepareUser } from '@pages/shared/login'
import { ADMIN_SUITE, CORE_DAM_API, RAND_NUM } from '@pages/shared/constants'
import { reloadUntilVisible } from '@pages/shared/admin'
import { uniqueFixtureCopy } from '@pages/shared/fixtures'
import { finishUpload, uploadFile, waitForUpload } from '@pages/shared/upload'
import { cleanupAssets, getAsset, waitForAssetProcessed } from '@pages/shared/api'
import { tileSelector } from '@pages/assets/assetBulkEditPage'
import {
  fillMetadataText,
  lightbox,
  lightboxPosition,
  openAssetDetail,
  saveMetadata,
  stepLightbox,
} from '@pages/assets/assetDetailPage'
import {
  activateTile,
  closeInfoCard,
  expectImageGrid,
  fillInfoText,
  infoDrawer,
  infoField,
  infoInput,
  isInfoCardOpen,
  openAssetList,
  openInfoCard,
  openLightboxFromTile,
  revealInfoDetails,
  saveInfoCard,
  setInfoSwitch,
  switchDisplayMode,
} from '@pages/assets/displayModesPage'

/**
 * The info card and the detail lightbox — the two ways the asset list shows an asset without leaving
 * the list.
 *
 * The info card is where the custom fields that no other spec reaches live: `location`,
 * `sourceKeywords` and the four media API fields. The ext system's asset custom form marks the media
 * API four `readonly: true`, so the app renders them disabled on purpose; the test holds them to that
 * rather than trying to type into them.
 */

let page: Page
let ASSET_ID = ''

const TITLE = `InfoCard${RAND_NUM}`
const DESCRIPTION = `InfoCardDesc${RAND_NUM}`
const LOCATION = `InfoCardLoc${RAND_NUM}`
const SOURCE_KEYWORDS = `InfoCardSrc${RAND_NUM}`

/** The custom fields the ext system's form marks read-only, so the info card only displays them. */
const READ_ONLY_FIELDS = ['mediaApiIds', 'mediaApiPaths', 'focusX', 'focusY']

/** The saved custom data of the asset under test. */
async function savedCustomData(): Promise<Record<string, string>> {
  return (await getAsset(page, ASSET_ID)).metadata?.customData ?? {}
}

/** Put the list back in tiles mode with the info card open on the fixture. */
async function activateFixture(): Promise<void> {
  await openAssetList(page)
  await reloadUntilVisible(page, tileSelector(TITLE))
  await openInfoCard(page)
  await activateTile(page, TITLE)
  await expect(infoField(page, 'description')).toBeVisible()
}

test.describe.serial(`${ADMIN_SUITE} - Asset info card and detail lightbox`, () => {
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext()
    page = await ctx.newPage()
    await prepareUser(page)
  })

  test.afterAll(async () => {
    if (ASSET_ID) await cleanupAssets(page, [ASSET_ID])
    await page.context().close()
  })

  test('uploads an image and titles it', async () => {
    // A unique copy: an identical re-upload is stored as a duplicate, which leaves the asset a draft.
    ASSET_ID = await uploadFile(page, uniqueFixtureCopy('image/sample.png'))
    await waitForUpload(page)
    await finishUpload(page)
    await waitForAssetProcessed(page, ASSET_ID)

    await openAssetDetail(page, ASSET_ID)
    await fillMetadataText(page, 'title', TITLE)
    await saveMetadata(page)
  })

  test('opens the info card and keeps it open in every display mode', async () => {
    await openAssetList(page)
    await expect(infoDrawer(page)).not.toHaveClass(/v-navigation-drawer--active/)

    await openInfoCard(page)
    // It shares the toolbar group with the three display modes but is not a fourth one: the grid keeps
    // whatever layout it had, and the card rides along through all three.
    await expectImageGrid(page, 'masonry')
    for (const mode of ['grid', 'list', 'tiles'] as const) {
      await switchDisplayMode(page, mode)
      expect(await isInfoCardOpen(page), `info card still open in ${mode} mode`).toBe(true)
    }
    await expectImageGrid(page, 'masonry')

    await closeInfoCard(page)
    await openInfoCard(page)
  })

  test('edits the description of the active asset', async () => {
    await activateFixture()
    await fillInfoText(page, 'description', DESCRIPTION)
    await saveInfoCard(page)

    expect((await savedCustomData()).description).toBe(DESCRIPTION)
  })

  test('writes the location and source keywords that only the info card exposes', async () => {
    await activateFixture()
    await revealInfoDetails(page)

    await fillInfoText(page, 'location', LOCATION)
    await fillInfoText(page, 'sourceKeywords', SOURCE_KEYWORDS)
    await saveInfoCard(page)

    const saved = await savedCustomData()
    expect(saved.location).toBe(LOCATION)
    expect(saved.sourceKeywords).toBe(SOURCE_KEYWORDS)
    // The earlier edit is still there, so saving the revealed fields does not drop the collapsed ones.
    expect(saved.description).toBe(DESCRIPTION)
  })

  test('shows the media API custom fields as read-only', async () => {
    await activateFixture()
    await revealInfoDetails(page)

    for (const name of READ_ONLY_FIELDS) {
      await expect(infoField(page, name), `field ${name} is rendered`).toBeVisible()
      await expect(infoInput(page, name), `field ${name} cannot be edited`).not.toBeEditable()
    }

    // The app is following the ext system's form definition rather than deciding this itself.
    const response = await page.request.get(
      `${CORE_DAM_API}/asset-custom-form/ext-system/1/type/image/element?order[position]=asc&limit=100`
    )
    expect(response.status()).toBe(200)
    const body = await response.json()
    // The endpoint pages its elements like every other list, so they arrive wrapped in `data`.
    const elements: Array<{ property: string; attributes?: { readonly?: boolean } }> = body.data ?? body
    for (const name of READ_ONLY_FIELDS) {
      const element = elements.find((item) => item.property === name)
      expect(element?.attributes?.readonly, `custom form marks ${name} read-only`).toBe(true)
    }
  })

  test('turns the single use licence flag on from the info card', async () => {
    await activateFixture()
    expect((await getAsset(page, ASSET_ID)).mainFileSingleUse, 'the fixture starts without it').toBe(false)

    await setInfoSwitch(page, 'Jednorazová licencia', true)
    await saveInfoCard(page)

    expect((await getAsset(page, ASSET_ID)).mainFileSingleUse).toBe(true)
  })

  test('opens an asset as a lightbox showing its place in the list', async () => {
    await openAssetList(page)
    await reloadUntilVisible(page, tileSelector(TITLE))
    await openLightboxFromTile(page, TITLE)

    await expect(lightbox(page)).toBeVisible()
    expect(page.url()).toContain(ASSET_ID)

    const position = await lightboxPosition(page)
    expect(position.index).toBeGreaterThanOrEqual(1)
    expect(position.total).toBeGreaterThanOrEqual(position.index)
  })

  test('steps through the list with the arrow buttons and the arrow keys', async () => {
    const start = await lightboxPosition(page)
    const startUrl = page.url()

    // Each step asserts the position it lands on, so a chevron or a key that does nothing fails there.
    expect(await stepLightbox(page, 'next'), 'the chevron moves one asset on').toBe(start.index + 1)
    expect(page.url(), 'the URL follows the lightbox').not.toBe(startUrl)
    expect(await stepLightbox(page, 'next', 'key'), 'ArrowRight does the same').toBe(start.index + 2)

    // Exactly as far back as it came, so this never reaches the first asset, where "previous" stops.
    await stepLightbox(page, 'previous', 'key')
    expect(await stepLightbox(page, 'previous')).toBe(start.index)
    expect(page.url(), 'and lands back on the asset it opened').toBe(startUrl)
  })
})
