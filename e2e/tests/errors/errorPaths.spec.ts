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
 * Error paths — what the app does when something goes wrong.
 *
 * Every other spec in the suite asserts a success. That leaves a whole class of regression invisible:
 * a form that posts a record it should have refused, an upload that hangs for ever on a file the
 * server rejected, a failed request that leaves a spinner turning and no way out. Those are what this
 * spec pins down.
 *
 * **Two of these tests stub a response** (`stubResponse`) — the only mocking in the suite besides
 * `stubProviderSearch`. No environment can be made to fail on demand: nothing in the admin turns a
 * healthy endpoint into a 500. The stub always stands in for the *failure* only, and each test proves
 * the app recovers once it is taken back off, so a stub that stopped matching cannot pass silently.
 *
 * The three validation tests do not mock anything.
 */

let page: Page
const assetIds: string[] = []

const REQUIRED = 'Povinná hodnota.'
/** Both `name` fields are `minLength(2)` — see `useAuthorValidation` / `useKeywordValidation`. */
const MIN_LENGTH = 'Minimálny počet znakov je 2.'
/** Raised by the shared submit path when a form is sent with a field it refuses. */
const FORM_INVALID = 'Vyplňte všetky povinné polia a opravte chyby.'
/** `system.upload.incorrectFormatSize` — the client-side refusal, before anything is uploaded. */
const WRONG_FORMAT = 'Nesprávny formát alebo veľkosť'
/** `system.uploadErrors.mimeType` — what the app makes of the API's own `mimeType` rejection. */
const WRONG_MIME = 'Nesprávny formát súboru'

/**
 * A real 1×1 BMP. `image/bmp` is in no ext-system mime list on any environment
 * (`configuration/ext-system/<id>` allows jpeg/png/webp/gif/avif for images), so this is a file the
 * upload has to refuse — while still being a genuine image rather than random bytes.
 */
const BMP_BASE64 = 'Qk06AAAAAAAAADYAAAAoAAAAAQAAAAEAAAABABgAAAAAAAQAAAATCwAAEwsAAAAAAAAAAAAAAAD/AA=='

/**
 * The asset list, ready to be uploaded into.
 *
 * **`page.goto` to the url that is already open does not reliably re-fetch the list** — the app can
 * keep the tiles it has, and then nothing ever answers `waitForAssetList`, which times out on a page
 * that is in perfect order. So the list request is only awaited when this actually navigates; when the
 * list is already open the dropzone is mounted already and there is nothing to wait for.
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
 * Open the create panel of a settings list and return it.
 *
 * Navigates straight to the list rather than through `openSettingsSection`: clicking a rail item on a
 * freshly loaded `/settings` intermittently waits out its own timeout — the item is visible and enabled
 * but never reports itself *stable*. `changeLicence` has the same still-booting fragility.
 *
 * Going straight to the list is not enough on its own, though. **The toolbar's create button mounts
 * after the table does**, so a press issued the moment `waitForTableLoad` returns can find nothing
 * visible yet, and one that lands while the toolbar is still settling is swallowed like every other
 * lost click in this suite. So the press is retried until the panel is open.
 *
 * The retry has to check first, though: **once the dialog is up its scrim covers the create button**,
 * so a blind re-press spends its whole timeout being intercepted and the loop never recovers. And the
 * panel is matched with `visibleCy`, like every other `data-cy` in this app that exists more than once.
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

    // The panel stays open on the rejected values, rather than closing as a successful create does.
    await expect(panel).toBeVisible()
    await closeAlerts(page)
    await panel.locator('[data-cy="button-cancel"]').click()
    await expect(panel).toBeHidden()
  })

  test('refuses an author name shorter than the minimum', async () => {
    const panel = await openCreatePanel('/authors')
    // A filled field that is still invalid — a different validator from the one above, and the one a
    // "required fields only" test would miss.
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
      // The warning names the file it refused, which is what makes it useful in a batch.
      await expect(warning).toContainText(`e2e-refused-${RAND_NUM}.bmp`)
    })

    // And nothing is queued. The upload overlay itself is always mounted in the footer — it is only
    // hidden — so its absence cannot be asserted; the queue it holds is what stays empty.
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
    // Size and format are refused with the *same* alert, so the format has to be ruled out explicitly:
    // the extension is what Playwright derives the mime type from, and that type is an accepted one.
    // Without this the test would still pass if jpeg were dropped from the configuration — for the
    // wrong reason.
    expect(imageConfig.mimeTypes, 'jpeg is accepted, so only the size can be refused').toContain('image/jpeg')
    const tooBig = tempFile(`e2e-oversize-${RAND_NUM}.jpeg`, Buffer.alloc(limit + 1))

    // Nothing is uploaded: the size is checked in the browser, so not one byte leaves it.
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

    // The upload starts for real — the asset record is created — and then the file transfer is refused
    // the way the API refuses a file it will not store.
    const stub = await stubResponse(page, '**/image/*/chunk', {
      status: 422,
      body: validationErrorBody({ mimeType: ['invalid'] }),
    })
    try {
      const id = await uploadFile(page, 'image/sample.jpeg')
      assetIds.push(id)

      // The overlay has to settle. A failed item counts as processed (`recalculateQueueCounts`), so the
      // title flips to "done"; the bug this guards against is it sitting on "Nahrávanie 1/1" for ever.
      await expect(page.locator('[data-cy="upload-overlay-title"]')).toContainText('Nahrávanie ukončené', {
        timeout: 60000,
      })
      expect(stub.hits(), 'the chunk upload was refused').toBeGreaterThan(0)

      // The queue marks the item as failed rather than as uploaded. A duplicate is flagged with the
      // same `mdi-alert` icon (in warning colour, and carrying `icon-duplicate`), so that one is
      // excluded — otherwise an upload merely detected as a duplicate would pass this.
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

      // Not left stuck: the loader clears and the table settles on "no data" rather than spinning.
      await cardLoad(page)
      await expect(page.locator('.v-progress-circular')).toHaveCount(0)
      await expect(page.locator('tbody').getByText('Žiadne dostupné dáta')).toBeVisible()
    } finally {
      await stub.stop()
    }

    // The same view works the moment the API does — which also proves the stub was what broke it.
    await page.goto('/authors')
    await waitForTableLoad(page)
    expect(await tableRows(page).count()).toBeGreaterThan(0)
    await expect(page.locator('.v-alert')).toHaveCount(0)
  })
})
