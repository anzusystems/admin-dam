import { test, expect, type Page } from '@playwright/test'
import { prepareUser } from '@pages/shared/login'
import { ADMIN_SUITE, ALERT_UPLOAD } from '@pages/shared/constants'
import { uniqueFixtureCopy } from '@pages/shared/fixtures'
import { uploadFile, waitForUpload } from '@pages/shared/upload'
import { cleanupAssets, waitForAssetProcessed } from '@pages/shared/api'

/**
 * What the upload overlay does when the realtime notification it waits for never arrives.
 *
 * The queue marks an item done from a websocket notification, and the app carries a fallback for the
 * case where that notification is lost — `notificationFallbackCallback` re-reads the asset a few times
 * and resolves the item from its stored status. This spec is the only place that fallback is exercised,
 * because with the websocket healthy it never runs.
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

  test('the overlay still finishes when the notification never arrives', { tag: '@bug' }, async () => {
    test.fail() // DAM-B11: the fallback is never armed, so the overlay hangs for good — see KNOWN-BUGS.md
    test.info().annotations.push({ type: 'bug', description: 'DAM-B11' })

    // Standing in for the notification server and staying silent is exactly what a dropped
    // notification looks like to the app — the connection is up, the message simply never comes.
    await page.routeWebSocket(/notification-server/, () => {})
    await page.goto('/assets')

    const id = await uploadFile(page, uniqueFixtureCopy('image/sample.png'))
    assetIds.push(id)

    // The asset itself is unaffected — it is the overlay that is left behind, so the wait below is on
    // the app catching up with a file it has already stored.
    await waitForAssetProcessed(page, id)

    // The fallback's first check is ~10s after the upload finishes, by which time the asset has long
    // been processed, so the default budget is already generous — no need to sit out all three checks.
    await waitForUpload(page)
    expect(await page.locator('[data-cy="upload-overlay-title"]').innerText()).toContain(ALERT_UPLOAD)
  })
})
