import { test, expect, type Page } from '@playwright/test'
import { prepareUser } from '@pages/shared/login'
import { ADMIN_SUITE, ALERT_UPLOAD } from '@pages/shared/constants'
import { uniqueFixtureCopy } from '@pages/shared/fixtures'
import { uploadFile, waitForUpload } from '@pages/shared/upload'
import { cleanupAssets, waitForAssetProcessed } from '@pages/shared/api'

/**
 * What the upload overlay does when the realtime notification it waits for never arrives.
 *
 * A notification only brings the news sooner: the upload queue asks the server itself about every row whose
 * file the server still works on, and settles the row from what it reads. This spec is the only place that is
 * exercised with the notifications silent — with the websocket healthy the notification gets there first.
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

  // Was DAM-B11 (the overlay hung for good: the per-row fallback was never armed). The queue polls now,
  // whatever the config says.
  test('the overlay still finishes when the notification never arrives', async () => {
    // Standing in for the notification server and staying silent is exactly what a dropped
    // notification looks like to the app — the connection is up, the message simply never comes.
    await page.routeWebSocket(/notification-server/, () => {})
    await page.goto('/assets')

    const id = await uploadFile(page, uniqueFixtureCopy('image/sample.png'))
    assetIds.push(id)

    // The asset itself is unaffected — it is the overlay that is left behind, so the wait below is on
    // the app catching up with a file it has already stored.
    await waitForAssetProcessed(page, id)

    // With the socket open the queue first asks 10s after the upload finishes, then at 30s and 60s and
    // every minute after; without a socket at 5s and more often. The asset is processed by now, so the
    // next of those reads settles the row: at most a minute away, inside the default budget of 90s.
    await waitForUpload(page)
    expect(await page.locator('[data-cy="upload-overlay-title"]').innerText()).toContain(ALERT_UPLOAD)
  })
})
