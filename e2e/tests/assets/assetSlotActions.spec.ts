import { test, expect, type Page } from '@playwright/test'
import { prepareUser } from '@pages/shared/login'
import { ADMIN_SUITE } from '@pages/shared/constants'
import { cleanupAssets, expectDownloadedFile, getAsset, slotFiles, waitForAssetProcessed } from '@pages/shared/api'
import { uploadFile, waitForAssetList } from '@pages/shared/upload'
import { uniqueFixtureCopy } from '@pages/shared/fixtures'
import {
  chooseDownloadSlot,
  downloadDialog,
  downloadDialogSlots,
  openAssetDetail,
  openDownloadDialog,
} from '@pages/assets/assetDetailPage'
import {
  MAIN_FILE,
  NO_FILE,
  REMOVE_BOTH_DESCRIPTION,
  REMOVE_FILE,
  REMOVE_ONLY_DESCRIPTION,
  UNSET_SLOT,
  cancelSlotRemove,
  deleteSlotFile,
  expectSlot,
  downloadSlotFile,
  makeSlotMainFile,
  moveSlotFile,
  offersMakeMainFile,
  openSlotRemove,
  openSlots,
  reloadSlots,
  slotRow,
  uploadIntoSlot,
} from '@pages/assets/assetSlotsPage'

/**
 * The slot actions the audio slots spec leaves alone: making another slot's file the main one, downloading
 * a single slot's file, the two distinct answers of the remove dialog, and the sidebar's download dialog —
 * which is a slot picker too.
 *
 * It runs on audio because audio is the only type with more than one slot (image, video and document have
 * a single `default` one — see `assetDefaultSlot.spec.ts`), and it fills a second slot with a *different*
 * file: a file duplicated into another slot carries the main flag into both rows, so a duplicate can never
 * show what "make this the main file" does.
 */

let page: Page
let ASSET_ID = ''

test.describe.serial(`${ADMIN_SUITE} - Asset slot actions`, () => {
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext()
    page = await ctx.newPage()
    await prepareUser(page)
  })

  test.afterAll(async () => {
    await cleanupAssets(page, [ASSET_ID])
    await page.context().close()
  })

  test('uploads an audio asset and fills a second slot with another file', async () => {
    const listLoaded = waitForAssetList(page)
    await page.goto('/assets')
    await listLoaded
    ASSET_ID = await uploadFile(page, uniqueFixtureCopy('audio/sample.mp3'))
    // Single audio uploads regularly exceed the default 90s on devel, and the upload overlay is not what
    // this spec works with — the API is the one that knows when the file is really there.
    await waitForAssetProcessed(page, ASSET_ID, { timeout: 180000 })

    await openSlots(page, ASSET_ID)
    await uploadIntoSlot(page, ASSET_ID, 'premium', uniqueFixtureCopy('audio/sample2.mp3'))
    await reloadSlots(page)

    await expectSlot(page, 'free', [MAIN_FILE, 'sample.mp3'])
    await expectSlot(page, 'premium', ['sample2.mp3'], [MAIN_FILE])
  })

  test('"Spraviť ako hlavný súbor" moves the main file to another slot', async () => {
    await openSlots(page, ASSET_ID)
    // The slot that already holds the main file has nothing to offer here.
    expect(await offersMakeMainFile(page, 'free'), 'the main slot offers making its file the main one').toBe(false)
    expect(await offersMakeMainFile(page, 'premium')).toBe(true)

    await makeSlotMainFile(page, 'premium')
    await expect(slotRow(page, 'free')).not.toContainText(MAIN_FILE)

    // The flag has to come back from the API, not just from the row the click updated.
    await reloadSlots(page)
    await expect(slotRow(page, 'premium')).toContainText(MAIN_FILE)
    await expect(slotRow(page, 'free')).not.toContainText(MAIN_FILE)

    const slots = await slotFiles(page, ASSET_ID)
    expect(slots.premium.main).toBe(true)
    expect(slots.free.main).toBe(false)
    expect((await getAsset(page, ASSET_ID)).mainFile.id).toBe(slots.premium.fileId)
  })

  test('"Stiahnuť" of a slot serves that slot\'s own file', async () => {
    await openSlots(page, ASSET_ID)
    const slots = await slotFiles(page, ASSET_ID)

    const downloaded = await downloadSlotFile(page, 'free')
    // The main file sits in `premium` by now, so a slot that just downloaded the main file would prove nothing.
    expect(downloaded.id, 'the link is for the file of the chosen slot').toBe(slots.free.fileId)
    await expectDownloadedFile(page, downloaded.link, {
      mimeType: slots.free.mimeType,
      size: slots.free.size,
    })
  })

  test('the download dialog offers every filled slot and serves the chosen one', async () => {
    // Opened on a freshly loaded detail: the dialog starts from the asset as the detail store holds it, so
    // one that has been open across a main-file switch would offer the file the asset no longer points at.
    await openAssetDetail(page, ASSET_ID)
    const slots = await slotFiles(page, ASSET_ID)

    const { file: offered } = await openDownloadDialog(page)
    expect(offered.id, 'the dialog starts at the main file').toBe(slots.premium.fileId)

    // Empty slots are not offered — there would be nothing to download.
    expect((await downloadDialogSlots(page)).sort()).toEqual(['free', 'premium'])

    const chosen = await chooseDownloadSlot(page, 'free')
    expect(chosen.id).toBe(slots.free.fileId)
    expect(chosen.link, 'switching the slot switches the link').not.toBe(offered.link)
    await expectDownloadedFile(page, chosen.link, { mimeType: slots.free.mimeType, size: slots.free.size })

    await downloadDialog(page).locator('[data-cy="button-cancel"]').click()
  })

  test('the remove dialog of a file used in one slot offers only the permanent delete', async () => {
    await openSlots(page, ASSET_ID)
    const dialog = await openSlotRemove(page, 'premium')

    await expect(dialog).toContainText(REMOVE_ONLY_DESCRIPTION)
    await expect(dialog.locator('[data-cy="button-remove"]')).toHaveText(REMOVE_FILE)
    await expect(dialog.locator('[data-cy="button-unset"]'), 'nothing to unlink from a single slot').toHaveCount(0)
    await expect(dialog.locator('[data-cy="button-cancel"]')).toBeVisible()

    await cancelSlotRemove(page, dialog)
    await expect(slotRow(page, 'premium')).toContainText('sample2.mp3')
  })

  test('the remove dialog of a file used in two slots offers unlinking as well', async () => {
    await openSlots(page, ASSET_ID)
    await moveSlotFile(page, 'button-slot-duplicate', 'free', 'bonus', ['bonus', 'long', 'trial'])
    await reloadSlots(page)

    const dialog = await openSlotRemove(page, 'bonus')
    await expect(dialog).toContainText(REMOVE_BOTH_DESCRIPTION)
    await expect(dialog.locator('[data-cy="button-unset"]')).toHaveText(UNSET_SLOT)
    await expect(dialog.locator('[data-cy="button-remove"]')).toHaveText(REMOVE_FILE)
    await cancelSlotRemove(page, dialog)
  })

  test('the remove dialog is titled in Slovak @bug', async () => {
    test.fail() // DAM-B7: the title renders the raw i18n key — see KNOWN-BUGS.md
    test.info().annotations.push({ type: 'bug', description: 'DAM-B7' })

    await openSlots(page, ASSET_ID)
    const dialog = await openSlotRemove(page, 'bonus')
    await expect(dialog.locator('.v-toolbar-title')).toHaveText('Odstrániť?')
    await cancelSlotRemove(page, dialog)
  })

  test('"Odstrániť súbor natrvalo" deletes the file out of every slot holding it', async () => {
    await openSlots(page, ASSET_ID)
    const before = await slotFiles(page, ASSET_ID)
    expect(before.bonus.fileId, 'the duplicate shares the file with the free slot').toBe(before.free.fileId)

    await deleteSlotFile(page, 'free')

    // The second slot holding the same file is emptied too, which is what makes this different from unlinking.
    await reloadSlots(page)
    await expect(slotRow(page, 'bonus')).toContainText(NO_FILE)

    const after = await slotFiles(page, ASSET_ID)
    expect(Object.keys(after)).toEqual(['premium'])
    expect((await getAsset(page, ASSET_ID)).mainFile.id, 'the main file was in another slot').toBe(
      before.premium.fileId
    )
  })
})
