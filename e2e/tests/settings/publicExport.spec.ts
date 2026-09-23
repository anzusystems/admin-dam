import { test, expect, type Page } from '@playwright/test'
import { prepareUser } from '@pages/shared/login'
import { ADMIN_SUITE, ALERT_UPDATE, RAND_NUM } from '@pages/shared/constants'
import {
  createPublicExport,
  deletePublicExport,
  updatePublicExport,
  verifyPublicExport,
} from '@pages/settings/publicExportPage'
import { apiStatus, deleteViaApi } from '@pages/shared/crud'

let page: Page
let PUBLIC_EXPORT_ID = ''
let DELETED = false

// The slug is unique per export - reusing a fixed one fails as soon as a previous run left a record behind.
const SLUG = `cms-e2e-${RAND_NUM}`

test.describe.serial(`${ADMIN_SUITE} - Public export`, () => {
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext()
    page = await ctx.newPage()
    await prepareUser(page)
  })

  test.afterAll(async () => {
    if (PUBLIC_EXPORT_ID && !DELETED) await deleteViaApi(page, `public-export/${PUBLIC_EXPORT_ID}`)
    await page.context().close()
  })

  test('creates a public export', async () => {
    PUBLIC_EXPORT_ID = await createPublicExport(page, { slug: SLUG, licence: 'Sme Family' })
    await verifyPublicExport(page, PUBLIC_EXPORT_ID, { slug: SLUG, licence: 'Sme Family', type: 'Web' })
  })

  test('edits the public export', async () => {
    const updated = { slug: `${SLUG}-edit`, licence: 'Blog system', type: 'Appka' }
    await updatePublicExport(page, PUBLIC_EXPORT_ID, updated)
    await verifyPublicExport(page, PUBLIC_EXPORT_ID, updated)
  })

  test('deletes the public export', async () => {
    // The app confirms a public export deletion with the generic update alert.
    await deletePublicExport(page, PUBLIC_EXPORT_ID, ALERT_UPDATE)
    DELETED = true
    expect(await apiStatus(page, `public-export/${PUBLIC_EXPORT_ID}`)).toBe(404)
  })
})
