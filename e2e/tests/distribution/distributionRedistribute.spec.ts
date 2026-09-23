import { test, expect, type Page } from '@playwright/test'
import { prepareUser } from '@pages/shared/login'
import { ADMIN_SUITE, RAND_NUM } from '@pages/shared/constants'
import { uniqueFixtureCopy } from '@pages/shared/fixtures'
import { uploadFile, waitForAssetList } from '@pages/shared/upload'
import { cleanupAssets, waitForAssetProcessed } from '@pages/shared/api'
import {
  assetDistributions,
  closeAdvancedDistributions,
  closeDistributionDialog,
  createAdvancedDistribution,
  deleteAdvancedDistribution,
  distribute,
  distributionEntry,
  editAdvancedDistribution,
  expectDistributed,
  expectDistributionStatus,
  openAddDistribution,
  openAdvancedDistributions,
  openDistributionTab,
  openRedistribute,
  redistributeButton,
  redistributeStatuses,
  submitRedistribute,
} from '@pages/distribution/distributionPage'

/**
 * The distribution lifecycle past the happy path: the failed state, `Znovu distribuovať`, and the advanced
 * management panel that creates, edits and deletes distribution records directly.
 *
 * **Redistribute is only offered from `failed`.** Both services on devel declare
 * `allowedRedistributeStatuses: ["failed"]`, and nothing in the admin can make a real distribution fail on
 * demand. The advanced panel is the way in: `PATCH /distribution` writes the record as given, status
 * included, without calling the provider — so this spec distributes for real, then flips the stored status
 * to `Chyba` and redistributes from there. That also puts the advanced panel itself under test.
 *
 * **Two distribution UI states are not reachable on devel and are deliberately not covered:**
 *
 * - `DistributionCancelDialog` (`Zastaviť distribúciu`) is rendered for a **custom** distribution service
 *   waiting to go out, and `cancelCustomDistribution` refuses anything else. Devel configures only
 *   `jw_cms` (jwDistribution) and `youtube_cms_main` (youtubeDistribution), so no custom service exists.
 * - `Blokované distribúciou` renders only when a service declares `blockedBy`, and every service on devel
 *   declares `blockedBy: []`. `distributionYoutubeForm.spec.ts` asserts that absence against the config.
 */

let page: Page
let ASSET_ID = ''

const TITLE = `TestDistribution${RAND_NUM}`
const DESCRIPTION = `TestDescription${RAND_NUM}`
const REDISTRIBUTED_TITLE = `TestRedistributed${RAND_NUM}`
const AUTHOR = 'Pavol Demeš'
const SERVICE = 'JW Player Video'
const SOURCE_URL = 'https://example.com/e2e-direct-source.mp4'

test.describe.serial(`${ADMIN_SUITE} - Distribution redistribute`, () => {
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext()
    page = await ctx.newPage()
    await prepareUser(page)
  })

  test.afterAll(async () => {
    await cleanupAssets(page, [ASSET_ID])
    await page.context().close()
  })

  test('uploads the video test asset', async () => {
    const listLoaded = waitForAssetList(page)
    await page.goto('/assets')
    await listLoaded
    // A unique copy, so the main file is processed rather than matched as a duplicate of an earlier upload.
    // Waited through the API rather than the upload overlay, which can sit on "Nahrávanie 1/1" for ever
    // when the server's notification is lost — nothing here needs the overlay itself.
    ASSET_ID = await uploadFile(page, uniqueFixtureCopy('video/sample.mp4'))
    await waitForAssetProcessed(page, ASSET_ID)
  })

  test('distributes the video to JW Player', async () => {
    await openDistributionTab(page, ASSET_ID)
    const dialog = await openAddDistribution(page)
    await distribute(page, dialog, SERVICE, { title: TITLE, description: DESCRIPTION, author: AUTHOR })
    await closeDistributionDialog(page, dialog)
    await expectDistributed(page, ASSET_ID, SERVICE)
  })

  test('a distributed distribution offers no "Znovu distribuovať"', async () => {
    // Not a hardcoded expectation: the environment says which statuses may be redistributed, and it says
    // only "failed" — so the button belongs to the failed state alone.
    expect(await redistributeStatuses(page, 'jw_cms')).toEqual(['failed'])

    await openDistributionTab(page, ASSET_ID)
    await expectDistributionStatus(page, SERVICE, 'distributed')
    await expect(redistributeButton(page, SERVICE)).toHaveCount(0)
  })

  test('"Pridať novú" offers no form for a service the asset is already distributed to', async () => {
    const dialog = await openAddDistribution(page)
    await dialog.getByRole('tab', { name: SERVICE, exact: true }).click()

    // The tab shows the existing distribution instead of an empty form, and drops the submit button with it.
    await expect(dialog.getByText('Distribuovaný')).toBeVisible()
    await expect(dialog.getByRole('button', { name: 'Pridať', exact: true })).toHaveCount(0)
    await closeDistributionDialog(page, dialog)
  })

  test('the advanced management panel opens and closes', async () => {
    await openDistributionTab(page, ASSET_ID)
    // It is collapsed on every load — the toggle is the only way to the manage list.
    await expect(page.locator('[data-cy="button-add-distribution"]')).toHaveCount(0)

    await openAdvancedDistributions(page)
    const distributions = await assetDistributions(page, ASSET_ID)
    expect(distributions).toHaveLength(1)
    // The row is captioned with the service title and the external id the provider assigned.
    await expect(page.locator('.sidebar-info')).toContainText(distributions[0].extId)

    await closeAdvancedDistributions(page)
  })

  test('the advanced editor flips the distribution to "Chyba"', async () => {
    await openDistributionTab(page, ASSET_ID)
    await openAdvancedDistributions(page)
    // The JW sub-form marks the direct source url required, so even a status-only edit has to fill it.
    await editAdvancedDistribution(page, { status: 'failed', directSourceUrl: SOURCE_URL })

    const [distribution] = await assetDistributions(page, ASSET_ID)
    expect(distribution.status).toBe('failed')
    // The edit writes the record as given and leaves the distributed texts alone.
    expect(distribution.texts?.title).toBe(TITLE)

    await expectDistributionStatus(page, SERVICE, 'failed')
    // A failed distribution names its reason and offers the way back.
    await expect(distributionEntry(page, SERVICE)).toContainText('Dôvod zlyhania:')
    await expect(redistributeButton(page, SERVICE)).toBeVisible()
  })

  test('the redistribute dialog is prefilled from the stored distribution and re-sends it', async () => {
    await openDistributionTab(page, ASSET_ID)
    const dialog = await openRedistribute(page, SERVICE)

    // Prefilled from the distribution being re-sent, not from the asset's prepared payload.
    await expect(dialog.getByRole('textbox', { name: 'Názov' })).toHaveValue(TITLE)
    await expect(dialog.getByRole('textbox', { name: 'Popis' })).toHaveValue(DESCRIPTION)
    await expect(dialog.getByRole('textbox', { name: 'Autor' })).toHaveValue(AUTHOR)

    const response = await submitRedistribute(page, dialog, {
      title: REDISTRIBUTED_TITLE,
      description: DESCRIPTION,
      author: AUTHOR,
    })
    expect(response.status(), `PUT ${response.url()}`).toBe(200)

    await expect(async () => {
      const [distribution] = await assetDistributions(page, ASSET_ID)
      expect(distribution.texts?.title, 'the redistributed title is stored').toBe(REDISTRIBUTED_TITLE)
      expect(distribution.status, 'the distribution left the failed state').not.toBe('failed')
    }).toPass({ timeout: 30000 })
  })

  test('the advanced panel deletes the distribution', async () => {
    await openDistributionTab(page, ASSET_ID)
    await openAdvancedDistributions(page)
    await deleteAdvancedDistribution(page)

    expect(await assetDistributions(page, ASSET_ID)).toHaveLength(0)
    await expect(page.locator('.sidebar-info')).toContainText('Nie je čo zobraziť')
  })

  test('redistributes a distribution created in the advanced panel @bug', async () => {
    test.fail() // DAM-B8: answers 422 "error_field_empty" for fields the request filled — see KNOWN-BUGS.md
    test.info().annotations.push({ type: 'bug', description: 'DAM-B8' })

    await openDistributionTab(page, ASSET_ID)
    await openAdvancedDistributions(page)
    // The create form has no text fields at all, so the record it writes starts with empty texts.
    await createAdvancedDistribution(page, {
      service: 'JwVideo',
      extId: `E2E${RAND_NUM}`,
      status: 'failed',
      directSourceUrl: SOURCE_URL,
    })

    await redistributeButton(page, SERVICE).click()
    const dialog = page.getByRole('dialog').filter({ hasText: 'Znovu distribuovať' }).first()
    await expect(dialog).toBeVisible()

    // Filling every required field must be enough to re-send it.
    const response = await submitRedistribute(page, dialog, {
      title: TITLE,
      description: DESCRIPTION,
      author: AUTHOR,
    })
    expect(response.status(), `PUT ${response.url()}`).toBe(200)
  })
})
