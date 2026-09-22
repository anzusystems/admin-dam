import { test, expect, type Page } from '@playwright/test'
import { prepareUser } from '@pages/shared/login'
import { ADMIN_SUITE, RAND_NUM } from '@pages/shared/constants'
import { createAssetLicence, updateAssetLicence, type AssetLicenceData } from '@pages/settings/assetLicencePage'
import { openDetailAndClose, resetFilters, rowWithCell } from '@pages/shared/crud'
import { filterBy } from '@pages/shared/admin'

let page: Page
let LICENCE_ID = ''

const CREATE_DATA: AssetLicenceData = { name: `cms${RAND_NUM}`, extId: RAND_NUM, extSystem: 'cms' }
const UPDATE_DATA: AssetLicenceData = { name: `cms${RAND_NUM}-edit`, extId: `${RAND_NUM}-edit`, extSystem: 'blog' }

test.describe.serial(`${ADMIN_SUITE} - Asset licences`, () => {
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext()
    page = await ctx.newPage()
    await prepareUser(page)
  })

  // Asset licences cannot be deleted — DELETE /asset-licence/:id answers 500 (DAM-B13, see KNOWN-BUGS.md) —
  // so each run leaves one behind.
  test.afterAll(async () => {
    await page.context().close()
  })

  test('creates an asset licence', async () => {
    LICENCE_ID = await createAssetLicence(page, CREATE_DATA)
  })

  test('shows the created licence on its detail', async () => {
    await filterBy(page, 'Externé ID', CREATE_DATA.extId)
    expect(await openDetailAndClose(page, CREATE_DATA.name, 'asset-licences')).toBe(LICENCE_ID)
  })

  test('updates the asset licence', async () => {
    await updateAssetLicence(page, LICENCE_ID, UPDATE_DATA)
    await resetFilters(page)
    await filterBy(page, 'Externé ID', UPDATE_DATA.extId)
    await expect(rowWithCell(page, UPDATE_DATA.name)).toHaveCount(1)
    await resetFilters(page)
  })
})
