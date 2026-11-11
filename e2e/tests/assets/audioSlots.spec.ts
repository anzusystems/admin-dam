import { test, expect, type Page } from '@playwright/test'
import { prepareUser } from '@pages/shared/login'
import { ADMIN_SUITE } from '@pages/shared/constants'
import { cleanupAssets, getAsset, waitForAssetProcessed } from '@pages/shared/api'
import { uploadFile, waitForAssetList } from '@pages/shared/upload'
import { uniqueFixtureCopy } from '@pages/shared/fixtures'
import {
  addFirstAssetAsTwin,
  expectSlot,
  moveSlotFile,
  openSlotActions,
  openSlots,
  reloadSlots,
  setSlotVisibility,
  twinRow,
  unlinkSlotFile,
  uploadIntoSlot,
} from '@pages/assets/assetSlotsPage'

let page: Page
let ASSET_ID = ''

/** `expectSlot` of the page object, bound to this suite's shared page. */
const expectSlotRow = (slot: string, texts: string[], absent: string[] = []) => expectSlot(page, slot, texts, absent)

test.describe.serial(`${ADMIN_SUITE} - Audio slots`, () => {
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext()
    page = await ctx.newPage()
    await prepareUser(page)
  })

  test.afterAll(async () => {
    await cleanupAssets(page, [ASSET_ID])
    await page.context().close()
  })

  test('uploads the audio test asset', async () => {
    const listLoaded = waitForAssetList(page)
    await page.goto('/assets')
    await listLoaded
    ASSET_ID = await uploadFile(page, uniqueFixtureCopy('audio/sample.mp3'))
    await waitForAssetProcessed(page, ASSET_ID)
  })

  test('makes the main file public and private again', async () => {
    await openSlots(page, ASSET_ID)
    await reloadSlots(page)
    await setSlotVisibility(page, 'free', 'public')
    await page.reload()
    await openSlots(page, ASSET_ID)
    await expectSlotRow('free', ['Súbor je prístupný'])

    await setSlotVisibility(page, 'free', 'private')
    await page.reload()
    await openSlots(page, ASSET_ID)
    await expectSlotRow('free', ['Súbor je neprístupný'])
  })

  test('offers copying the slot file id', async () => {
    await openSlots(page, ASSET_ID)
    const menu = await openSlotActions(page, 'free')
    await expect(menu.locator('[data-cy="button-slot-copy-id"]')).toBeVisible()
    await page.keyboard.press('Escape')
  })

  test('duplicates the free slot file into the premium slot', async () => {
    await openSlots(page, ASSET_ID)
    await moveSlotFile(page, 'button-slot-duplicate', 'free', 'premium', ['premium', 'bonus', 'long', 'trial'])
    await expectSlotRow('free', ['Súbor je neprístupný', 'Hlavný súbor'])
    await expectSlotRow('premium', ['Súbor je neprístupný', 'Hlavný súbor'])

    await reloadSlots(page)
    await expectSlotRow('free', ['Súbor je neprístupný', 'Hlavný súbor'])
    await expectSlotRow('premium', ['Súbor je neprístupný', 'Hlavný súbor'])
  })

  test('removes the file from the free slot only', async () => {
    await openSlots(page, ASSET_ID)
    await unlinkSlotFile(page, 'free')
    await expectSlotRow('free', ['Žiaden súbor'], ['Hlavný súbor'])
    await expectSlotRow('premium', ['Súbor je neprístupný', 'Hlavný súbor'])
  })

  test('uploads a new file into the free slot', async () => {
    await openSlots(page, ASSET_ID)
    await uploadIntoSlot(page, ASSET_ID, 'free', uniqueFixtureCopy('audio/sample2.mp3'))
    await expectSlotRow('free', ['Súbor je neprístupný', 'sample2'], ['Žiaden súbor', 'Hlavný súbor'])
  })

  test('switches the public premium file with the bonus slot', async () => {
    await openSlots(page, ASSET_ID)
    await setSlotVisibility(page, 'premium', 'public')
    await expectSlotRow('premium', ['Súbor je prístupný', 'Hlavný súbor'])

    await moveSlotFile(page, 'button-slot-switch', 'premium', 'bonus', ['free', 'bonus', 'long', 'trial'])
    await expectSlotRow('free', ['Súbor je neprístupný', 'sample2'], ['Žiaden súbor'])
    await expectSlotRow('bonus', ['Hlavný súbor', 'Súbor je prístupný', 'sample'])
  })

  test('links and unlinks a twin asset', async () => {
    await openSlots(page, ASSET_ID)
    const twin = await addFirstAssetAsTwin(page)

    await twinRow(page).locator('.v-chip--link').click()
    await expect(page).toHaveURL(new RegExp(`/assets/${twin.id}$`))
    // The tile shows the display title, which falls back to the file name for an untitled asset.
    expect((await getAsset(page, twin.id)).texts.displayTitle.trim()).toBe(twin.tileTitle)

    await openSlots(page, ASSET_ID)
    await expect(twinRow(page).locator('.v-chip--link')).toBeVisible()
    await twinRow(page).locator('.mdi-trash-can-outline').click()
    await expect(twinRow(page).locator('.v-chip--link')).toHaveCount(0)
  })
})
