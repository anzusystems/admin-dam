import { test, type Page } from '@playwright/test'
import { prepareUser } from '@pages/shared/login'
import { changeLicence } from '@pages/shared/licence'
import { ADMIN_SUITE, LICENCE_ID } from '@pages/shared/constants'
import { DOCUMENT_TYPES, uniqueFixtureCopy } from '@pages/shared/fixtures'
import { cleanupAssets } from '@pages/shared/api'
import { expectDuplicateOnSecondUpload } from '@pages/licence/licenceDuplicatePage'

let page: Page
const assetIds: string[] = []
const FILES = DOCUMENT_TYPES.map((type) => uniqueFixtureCopy(`document/sample.${type}`))

/**
 * Duplicates are detected per licence: the same file is new again in the next licence. Unique copies (made once per
 * run) keep an asset from an earlier run from being matched as the original.
 */
const LICENCES = [LICENCE_ID, '100001']

test.describe.serial(`${ADMIN_SUITE} - Document licence duplicates`, () => {
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext()
    page = await ctx.newPage()
    await prepareUser(page)
  })

  test.afterAll(async () => {
    await cleanupAssets(page, assetIds)
    // The licence is stored per user - put back the one the rest of the suite runs under.
    await changeLicence(page, LICENCE_ID).catch(() => {})
    await page.context().close()
  })

  for (const licenceId of LICENCES) {
    test(`marks a re-uploaded document as a duplicate in licence ${licenceId}`, async () => {
      await changeLicence(page, licenceId)
      for (const file of FILES) {
        assetIds.push(...(await expectDuplicateOnSecondUpload(page, file)))
      }
    })
  }
})
