import { test, expect, type Page } from '@playwright/test'
import { prepareUser } from '@pages/shared/login'
import { ADMIN_SUITE, ALERT_UPLOAD } from '@pages/shared/constants'
import { uniqueFixtureCopy } from '@pages/shared/fixtures'
import { uploadFile, waitForUpload } from '@pages/shared/upload'
import { cleanupAssets, waitForAssetProcessed } from '@pages/shared/api'

/**
 * The upload overlay when the realtime notification never arrives.
 * A notification only speeds things up. The upload queue asks the server about every
 * row whose file is still being processed and settles the row from the answer.
 * This is the only spec that runs with silent notifications. With a healthy websocket the notification arrives first.
 */

let page: Page
const assetIds: string[] = []

test.describe.serial(`${ADMIN_SUITE} - Upload notification fallback`, () => {
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext()
    page = await ctx.newPage()
    await prepareUser(page)
  })

  test.afterAll(async () => {
    await cleanupAssets(page, assetIds)
    await page.context().close()
  })

  test('the overlay still finishes when the notification never arrives', async () => {
    // Staying silent looks to the app like a dropped notification: the connection is up, the message never comes.
    await page.routeWebSocket(/notification-server/, () => {})
    await page.goto('/assets')

    const id = await uploadFile(page, uniqueFixtureCopy('image/sample.png'))
    assetIds.push(id)

    await waitForAssetProcessed(page, id)

    // With the socket open, the queue first asks 10s after the upload finishes, then at
    // 30s, 60s and every minute after. Without a socket it asks at 5s and more often.
    // The asset is already processed, so the next read settles the
    // row, at most a minute away and within the default 90s budget.
    await waitForUpload(page)
    expect(await page.locator('[data-cy="upload-overlay-title"]').innerText()).toContain(ALERT_UPLOAD)
  })
})
