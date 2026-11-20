import { test, expect, type Page } from '@playwright/test'
import { prepareUser } from '@pages/shared/login'
import { ADMIN_SUITE } from '@pages/shared/constants'
import { IMAGE_TYPES } from '@pages/shared/fixtures'
import { UPLOAD_MODES, uploadFile, waitForAssetList, waitForUpload } from '@pages/shared/upload'
import { cleanupAssets, deleteAsset, expectAssetMimeType, getAsset } from '@pages/shared/api'
import { cardLoad } from '@pages/shared/admin'

let page: Page
const assetIds: string[] = []

test.describe.serial(`${ADMIN_SUITE} - Image upload`, () => {
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext()
    page = await ctx.newPage()
    await prepareUser(page)
  })

  test.afterAll(async () => {
    await cleanupAssets(page, assetIds)
    await page.context().close()
  })

  for (const type of IMAGE_TYPES) {
    for (const mode of UPLOAD_MODES) {
      test(`uploads a ${type.toUpperCase()} image by ${mode}`, async () => {
        const id = await uploadFile(page, `image/sample.${type}`, mode)
        assetIds.push(id)
        await waitForUpload(page)
        await expectAssetMimeType(page, id, 'image', type)
        // The next test uploads the same file again, which DAM would flag as a duplicate of this one.
        await deleteAsset(page, id)
      })
    }
  }

  for (const mode of UPLOAD_MODES) {
    test(`uploads an animated GIF by ${mode}`, async () => {
      const id = await uploadFile(page, 'image/animation.gif', mode)
      assetIds.push(id)
      await waitForUpload(page)
      // The animated flag is only set once the image finished processing, after the upload itself is done.
      await expect
        .poll(async () => (await getAsset(page, id)).mainFile?.imageAttributes?.animated, { timeout: 60000 })
        .toBe(true)
      await page.goto(`/assets/${id}`)
      await cardLoad(page)
      await expect(page.locator('.v-row').filter({ hasText: 'Animované' }).last()).toContainText('áno')
      await deleteAsset(page, id)
      const listLoaded = waitForAssetList(page)
      await page.goto('/assets')
      await listLoaded
    })
  }
})
