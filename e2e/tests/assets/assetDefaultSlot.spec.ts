import { test, expect, type Page } from '@playwright/test'
import { prepareUser } from '@pages/shared/login'
import { ADMIN_SUITE } from '@pages/shared/constants'
import { type AssetType, assetTypeConfig, cleanupAssets, slotFiles, waitForAssetProcessed } from '@pages/shared/api'
import { uploadFile, waitForAssetList } from '@pages/shared/upload'
import { uniqueFixtureCopy } from '@pages/shared/fixtures'
import { visibleCy } from '@pages/shared/crud'
import {
  MAIN_FILE,
  REMOVE_FILE,
  REMOVE_ONLY_DESCRIPTION,
  cancelSlotRemove,
  expectSlot,
  openSlotRemove,
  openSlots,
  slotMenuLabels,
} from '@pages/assets/assetSlotsPage'

/**
 * The `default` slot of the three single-slot asset types. Only audio has several slots; image, video and
 * document each get exactly one, which is why their slots tab had never been exercised.
 *
 * With nowhere to move a file to, the actions menu drops "Spraviť ako hlavný súbor", "Duplikovať do iného
 * slotu" and "Vymeniť s iným slotom", and the remove dialog stops offering to unlink — the whole difference
 * this spec pins down against `assetSlotActions.spec.ts`, which covers the multi-slot audio case.
 */

const SINGLE_SLOT_ACTIONS = ['Kopírovať ID súboru', 'Stiahnuť', 'Odstrániť']

const TYPES: { type: AssetType; file: string; fileName: string; hasFocusTab: boolean }[] = [
  { type: 'image', file: 'image/sample.png', fileName: 'sample.png', hasFocusTab: true },
  { type: 'video', file: 'video/sample.mp4', fileName: 'sample.mp4', hasFocusTab: false },
  { type: 'document', file: 'document/sample.pdf', fileName: 'sample.pdf', hasFocusTab: false },
]

let page: Page
const assetIds: string[] = []

test.describe.serial(`${ADMIN_SUITE} - Asset default slot`, () => {
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext()
    page = await ctx.newPage()
    await prepareUser(page)
  })

  test.afterAll(async () => {
    await cleanupAssets(page, assetIds)
    await page.context().close()
  })

  for (const { type, file, fileName, hasFocusTab } of TYPES) {
    test(`${type}: the default slot holds the main file and offers no slot moves`, async () => {
      const config = await assetTypeConfig(page, type)
      expect(config.slots, `${type} is configured with a single slot`).toEqual(['default'])

      const listLoaded = waitForAssetList(page)
      await page.goto('/assets')
      await listLoaded
      const assetId = await uploadFile(page, uniqueFixtureCopy(file))
      assetIds.push(assetId)
      // Waited for through the API, not through the upload overlay: the overlay only flips to "finished"
      // when the server's notification reaches it, and a lost notification hangs it on a file that is
      // long since stored. An identical file uploaded by another suite lands as a `duplicate`, which
      // fills the slot just the same.
      await waitForAssetProcessed(page, assetId, { done: ['processed', 'duplicate'], timeout: 180000 })

      await openSlots(page, assetId, config.defaultSlotName)
      await expectSlot(page, config.defaultSlotName, [MAIN_FILE, fileName])

      const slots = await slotFiles(page, assetId)
      expect(Object.keys(slots)).toEqual([config.defaultSlotName])
      expect(slots[config.defaultSlotName].main).toBe(true)

      // No duplicate, no switch, no "make main file": all three need a second slot to exist.
      expect(await slotMenuLabels(page, config.defaultSlotName)).toEqual(SINGLE_SLOT_ACTIONS)

      const dialog = await openSlotRemove(page, config.defaultSlotName)
      await expect(dialog).toContainText(REMOVE_ONLY_DESCRIPTION)
      await expect(dialog.locator('[data-cy="button-remove"]')).toHaveText(REMOVE_FILE)
      await expect(dialog.locator('[data-cy="button-unset"]')).toHaveCount(0)
      await cancelSlotRemove(page, dialog)

      // The "Fókus" tab is built around crop previews, so only images have one.
      await expect(visibleCy(page, 'button-focus')).toHaveCount(hasFocusTab ? 1 : 0)
    })
  }
})
