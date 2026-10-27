import { test, type Page } from '@playwright/test'
import { prepareUser } from '@pages/shared/login'
import { ADMIN_SUITE } from '@pages/shared/constants'
import { VIDEO_TYPES } from '@pages/shared/fixtures'
import { UPLOAD_MODES, uploadFile, waitForUpload } from '@pages/shared/upload'
import { cleanupAssets, deleteAsset, expectAssetMimeType } from '@pages/shared/api'

let page: Page
const assetIds: string[] = []

test.describe.serial(`${ADMIN_SUITE} - Video upload`, () => {
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext()
    page = await ctx.newPage()
    await prepareUser(page)
  })

  test.afterAll(async () => {
    await cleanupAssets(page, assetIds)
    await page.context().close()
  })

  for (const type of VIDEO_TYPES) {
    for (const mode of UPLOAD_MODES) {
      test(`uploads a ${type.toUpperCase()} video by ${mode}`, async () => {
        const id = await uploadFile(page, `video/sample.${type}`, mode)
        assetIds.push(id)
        await waitForUpload(page)
        await expectAssetMimeType(page, id, 'video', type)
        // The next test uploads the same file again, which DAM would flag as a duplicate of this one.
        await deleteAsset(page, id)
      })
    }
  }
})
