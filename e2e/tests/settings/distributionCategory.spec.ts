import { test, type Page } from '@playwright/test'
import { prepareUser } from '@pages/shared/login'
import { ADMIN_SUITE, RAND_NUM } from '@pages/shared/constants'
import {
  createDistributionCategory,
  expectDistributionCategoryListed,
  updateDistributionCategory,
  verifyDistributionCategoryDetail,
} from '@pages/settings/distributionCategoryPage'

let page: Page
let CATEGORY_ID = ''

const CATEGORY_NAME = `First${RAND_NUM}`

test.describe.serial(`${ADMIN_SUITE} - Distribution category`, () => {
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext()
    page = await ctx.newPage()
    await prepareUser(page)
  })

  test.afterAll(async () => {
    // Distribution categories can't be deleted — no admin action, and DELETE /distribution/category/:id
    // answers 500 (DAM-B14, see KNOWN-BUGS.md) — so the test one is renamed to "-do-not-use" instead.
    await page.context().close()
  })

  test('creates an audio distribution category', async () => {
    CATEGORY_ID = await createDistributionCategory(page, 'Audio', CATEGORY_NAME)
    await verifyDistributionCategoryDetail(page, CATEGORY_ID, CATEGORY_NAME)
  })

  test('renames the distribution category', async () => {
    await updateDistributionCategory(page, 'Audio', CATEGORY_NAME, `${CATEGORY_NAME}-do-not-use`)
    await expectDistributionCategoryListed(page, 'Audio', `${CATEGORY_NAME}-do-not-use`)
  })
})
