import { test, expect, type Page } from '@playwright/test'
import { prepareUser } from '@pages/shared/login'
import { ADMIN_SUITE, RAND_NUM } from '@pages/shared/constants'
import {
  createPermissionGroup,
  editPermissionGroup,
  openPermissionGroupByTitle,
} from '@pages/settings/permissionGroupPage'
import { closeDetail, deleteViaApi, openSettingsSection, resetFilters, rowWithCell } from '@pages/shared/crud'
import { filterBy } from '@pages/shared/admin'

let page: Page
let GROUP_ID = ''

const TITLE = `TEST-${RAND_NUM}`
const DESCRIPTION = `TEST-${RAND_NUM}`.repeat(2)

test.describe.serial(`${ADMIN_SUITE} - Permission group`, () => {
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext()
    page = await ctx.newPage()
    await prepareUser(page)
  })

  test.afterAll(async () => {
    if (GROUP_ID) await deleteViaApi(page, `permission-group/${GROUP_ID}`)
    await page.context().close()
  })

  test('creates a permission group', async () => {
    await openSettingsSection(page, 'permission-group-settings', '/permission-groups', 'Skupiny oprávnení')
    GROUP_ID = await createPermissionGroup(page, { title: TITLE, description: DESCRIPTION })
    await openPermissionGroupByTitle(page, TITLE, GROUP_ID)
    await closeDetail(page, `/${GROUP_ID}`)
    await expect(page).toHaveURL(/\/permission-groups$/)
  })

  test('edits the permission group', async () => {
    await editPermissionGroup(page, GROUP_ID, { title: `${TITLE}-edit`, description: `${DESCRIPTION}-edit` })
    await resetFilters(page)
    await filterBy(page, 'Nadpis', `${TITLE}-edit`)
    await expect(rowWithCell(page, `${TITLE}-edit`)).toHaveCount(1)
    await resetFilters(page)
  })
})
