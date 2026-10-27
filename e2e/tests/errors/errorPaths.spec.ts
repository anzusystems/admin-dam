import { test, expect, type Page } from '@playwright/test'
import { prepareUser } from '@pages/shared/login'
import { ADMIN_SUITE, RAND_NUM } from '@pages/shared/constants'
import { cardLoad, closeAlerts } from '@pages/shared/admin'
import { visibleCy } from '@pages/shared/crud'
import { tableRows, waitForTableLoad } from '@pages/shared/datatable'
import { removeTempFile, tempFile } from '@pages/shared/fixtures'
import { assetTypeConfig, cleanupAssets } from '@pages/shared/api'
import { uploadFile, waitForAssetList } from '@pages/shared/upload'
import { expectNoWrite, expectSystemError, stubResponse, validationErrorBody } from '@pages/shared/errors'

/**
 * Error paths: what the app does when something goes wrong. Other specs assert only success, so regressions
 * like a form posting a refused record, an upload hanging forever, or a spinner with no way out go unnoticed.
 * Two tests stub a response (`stubResponse`), the only mocking besides
 * `stubProviderSearch`. No environment can be made to fail on demand. The stub stands in
 * only for the failure, and each test proves the app recovers once the stub is removed.
 * The three validation tests mock nothing.
 */

let page: Page
const assetIds: string[] = []

const REQUIRED = 'Povinná hodnota.'
const MIN_LENGTH = 'Minimálny počet znakov je 2.'
const FORM_INVALID = 'Vyplňte všetky povinné polia a opravte chyby.'
const WRONG_FORMAT = 'Nesprávny formát alebo veľkosť'
const WRONG_MIME = 'Nesprávny formát súboru'

/**
 * A real 1×1 BMP. `image/bmp` is in no ext-system mime list, so
 * the upload must refuse it, while it is still a genuine image.
 */
const BMP_BASE64 = 'Qk06AAAAAAAAADYAAAAoAAAAAQAAAAEAAAABABgAAAAAAAQAAAATCwAAEwsAAAAAAAAAAAAAAAD/AA=='

/**
 * `page.goto` to the already open url does not reliably re-fetch the list. The app
 * can keep its tiles, and `waitForAssetList` then times out on a healthy page.
 * So the list request is awaited only when this actually navigates.
 */
async function openAssetList(): Promise<void> {
  if (new URL(page.url()).pathname !== '/assets') {
    const listed = waitForAssetList(page)
    await page.goto('/assets')
    await listed
  }
  await expect(page.locator('input[type="file"]').first()).toBeAttached()
}

/**
 * Navigate straight to the list, not through `openSettingsSection`. Clicking a rail item on a
 * freshly loaded `/settings` intermittently times out because the item never becomes stable.
 * The toolbar's create button mounts after the table, so a press right after
 * `waitForTableLoad` can be lost. The press is retried until the panel is open.
 * Check first before re-pressing: once the dialog is up, its scrim covers the button and a blind press
 * times out. Match the panel with `visibleCy`, as for every `data-cy` that exists more than once.
 */
async function openCreatePanel(listUrl: string) {
  await page.goto(listUrl)
  await waitForTableLoad(page)
  const panel = visibleCy(page, 'create-panel')
  await expect(async () => {
    if (!(await panel.isVisible())) await visibleCy(page, 'button-create').click({ timeout: 10000 })
    await expect(panel).toBeVisible({ timeout: 5000 })
  }).toPass({ timeout: 60000 })
  return panel
}

test.describe.serial(`${ADMIN_SUITE} - Error paths`, () => {
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext()
    page = await ctx.newPage()
    await prepareUser(page)
  })

  test.afterAll(async () => {
    await cleanupAssets(page, assetIds)
    await page.context().close()
  })

  test('refuses to create an author with no name, and posts nothing', async () => {
    const panel = await openCreatePanel('/authors')

    await expectNoWrite(page, async () => {
      await panel.locator('[data-cy="button-confirm"]').click()
      await expect(panel.getByText(REQUIRED)).toHaveCount(1)
      await expect(page.locator('.v-alert').filter({ hasText: FORM_INVALID })).toBeVisible()
    })

    await expect(panel).toBeVisible()
    await closeAlerts(page)
    await panel.locator('[data-cy="button-cancel"]').click()
    await expect(panel).toBeHidden()
  })

  test('refuses an author name shorter than the minimum', async () => {
    const panel = await openCreatePanel('/authors')
    await panel.locator('[data-cy="author-name"] input').fill('a')

    await expectNoWrite(page, async () => {
      await panel.locator('[data-cy="button-confirm"]').click()
      await expect(panel.getByText(MIN_LENGTH)).toBeVisible()
    })

    await closeAlerts(page)
    await panel.locator('[data-cy="button-cancel"]').click()
    await expect(panel).toBeHidden()
  })

  test('refuses to create a keyword with no name, and posts nothing', async () => {
    const panel = await openCreatePanel('/keywords')

    await expectNoWrite(page, async () => {
      await panel.locator('[data-cy="button-confirm"]').click()
      await expect(panel.getByText(REQUIRED)).toHaveCount(1)
    })

    await closeAlerts(page)
    await panel.locator('[data-cy="button-cancel"]').click()
    await expect(panel).toBeHidden()
  })

  test('refuses a file of a type the ext system does not accept', async () => {
    await openAssetList()

    const refused = tempFile(`e2e-refused-${RAND_NUM}.bmp`, Buffer.from(BMP_BASE64, 'base64'))

    // Nothing may reach the API: the check runs in the browser, before the upload is even started.
    await expectNoWrite(page, async () => {
      await page.locator('input[type="file"]').first().setInputFiles(refused)
      const warning = page.locator('.v-alert').filter({ hasText: WRONG_FORMAT })
      await expect(warning).toBeVisible()
      await expect(warning).toContainText(`e2e-refused-${RAND_NUM}.bmp`)
    })

    // The upload overlay is always mounted in the footer and only hidden, so
    // its absence cannot be asserted. Assert that its queue is empty instead.
    await expect(page.locator('.dam-upload-queue__item')).toHaveCount(0)
    await closeAlerts(page)
    removeTempFile(refused)
  })

  test('refuses a file over the ext system size limit', async () => {
    await openAssetList()

    // The limit is per mime type (`uploadSizes` maps each accepted type to its `sizeLimit`), and the
    // image one is the lowest of the four — so this is the cheapest oversize file the app will refuse.
    const imageConfig = await assetTypeConfig(page, 'image')
    const limit = imageConfig.sizeLimit
    expect(limit, 'the image size limit is configured').toBeGreaterThan(0)
    // Size and format are refused with the same alert, so the format must be ruled out explicitly.
    // Playwright derives the mime type from the extension. Without this check the test
    // would still pass if jpeg were dropped from the configuration, for the wrong reason.
    expect(imageConfig.mimeTypes, 'jpeg is accepted, so only the size can be refused').toContain('image/jpeg')
    const tooBig = tempFile(`e2e-oversize-${RAND_NUM}.jpeg`, Buffer.alloc(limit + 1))

    await expectNoWrite(page, async () => {
      await page.locator('input[type="file"]').first().setInputFiles(tooBig)
      await expect(page.locator('.v-alert').filter({ hasText: WRONG_FORMAT })).toContainText(
        `e2e-oversize-${RAND_NUM}.jpeg`
      )
    })

    await expect(page.locator('.dam-upload-queue__item')).toHaveCount(0)
    await closeAlerts(page)
    removeTempFile(tooBig)
  })

  test('marks an upload failed when the API rejects its chunk, instead of hanging', async () => {
    await openAssetList()

    const stub = await stubResponse(page, '**/image/*/chunk', {
      status: 422,
      body: validationErrorBody({ mimeType: ['invalid'] }),
    })
    try {
      const id = await uploadFile(page, 'image/sample.jpeg')
      assetIds.push(id)

      // The overlay has to settle. A failed item counts as processed (`recalculateQueueCounts`), so the
      // title flips to "done". The bug guarded here is the overlay staying on "Nahrávanie 1/1" forever.
      await expect(page.locator('[data-cy="upload-overlay-title"]')).toContainText('Nahrávanie ukončené', {
        timeout: 60000,
      })
      expect(stub.hits(), 'the chunk upload was refused').toBeGreaterThan(0)

      // A duplicate is flagged with the same `mdi-alert` icon (carrying `icon-duplicate`),
      // so it is excluded. Otherwise a detected duplicate would pass as a failed upload.
      await expect(page.locator('.dam-upload-queue__item .mdi-alert:not([data-cy="icon-duplicate"])')).toHaveCount(1)

      // And the reason is readable — the editable queue is the only place that renders the message.
      await page.locator('[data-cy="button-add-description"]').click()
      await expect(page.locator('.v-overlay--active').getByText(WRONG_MIME)).toBeVisible()
      await page.locator('.v-overlay--active [data-cy="button-close"]').first().click()
    } finally {
      await stub.stop()
    }
  })

  test('reports a failed list request and recovers once it works again', async () => {
    const stub = await stubResponse(page, '**/author/ext-system/**', { status: 500, body: '{}' })
    try {
      await page.goto('/authors')

      await expectSystemError(page)
      expect(stub.hits(), 'the list request was refused').toBeGreaterThan(0)

      await cardLoad(page)
      await expect(page.locator('.v-progress-circular')).toHaveCount(0)
      await expect(page.locator('tbody').getByText('Žiadne dostupné dáta')).toBeVisible()
    } finally {
      await stub.stop()
    }

    await page.goto('/authors')
    await waitForTableLoad(page)
    expect(await tableRows(page).count()).toBeGreaterThan(0)
    await expect(page.locator('.v-alert')).toHaveCount(0)
  })
})
