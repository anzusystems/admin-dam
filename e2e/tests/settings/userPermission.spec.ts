import { test, expect, type Page } from '@playwright/test'
import { prepareUser } from '@pages/shared/login'
import { ADMIN_SUITE, RAND_NUM } from '@pages/shared/constants'
import { cardLoad } from '@pages/shared/admin'
import {
  createAnzuUser,
  expectUserEnabledInList,
  openAnzuUserEdit,
  openUserByEmail,
  saveAndCloseUser,
  toggleUserEnabled,
  typeUserNames,
} from '@pages/settings/userPage'
import {
  JOB_DELETE,
  JOB_SYNC,
  createUserDataDeleteJob,
  deleteUserDataViaApi,
  detailValue,
  jobTypeOptions,
} from '@pages/settings/jobPage'
import { closeDetail, openSettingsSection, resetFilters } from '@pages/shared/crud'

let page: Page
let JOB_CREATED = false

// Far above the real central user ids, so the created account can never shadow a real one.
const USER_ID = `8${RAND_NUM.slice(-8)}`
const USER_EMAIL = `test.permission+${RAND_NUM}@adam.com`

test.describe.serial(`${ADMIN_SUITE} - User permission`, () => {
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext()
    page = await ctx.newPage()
    await prepareUser(page)
  })

  test.afterAll(async () => {
    // The last test deletes the user's data through a job; this only catches a user stranded by an earlier failure.
    if (!JOB_CREATED) await deleteUserDataViaApi(page, USER_ID)
    await page.context().close()
  })

  test('creates a user', async () => {
    await openSettingsSection(page, 'user-permissions', '/anzu-users', 'Oprávnenia používateľov')
    const id = await createAnzuUser(page, { id: USER_ID, email: USER_EMAIL, role: 'Super Administrátor' })
    expect(id).toBe(USER_ID)
    await openUserByEmail(page, '/anzu-users', USER_EMAIL, USER_ID)
    await closeDetail(page, `/${USER_ID}`)
    await expect(page).toHaveURL(/\/anzu-users$/)
  })

  test('enables the user with a name', async () => {
    await openAnzuUserEdit(page, USER_EMAIL)
    await typeUserNames(page, 'test', 'test')
    await toggleUserEnabled(page)
    await saveAndCloseUser(page)
    await expectUserEnabledInList(page, USER_EMAIL, 'áno')
    await resetFilters(page)
  })

  test('disables the user', async () => {
    await openAnzuUserEdit(page, USER_EMAIL)
    await toggleUserEnabled(page)
    await saveAndCloseUser(page)
    await expectUserEnabledInList(page, USER_EMAIL, 'nie')
    await resetFilters(page)
  })

  test('deletes the user data with a system job', async () => {
    await openSettingsSection(page, 'job-settings', '/jobs', 'Systémové úlohy')
    const types = await jobTypeOptions(page)
    expect(types).toContain(JOB_SYNC)
    expect(types).toContain(JOB_DELETE)

    const jobId = await createUserDataDeleteJob(page, USER_ID)
    JOB_CREATED = true
    await resetFilters(page)
    await page
      .locator('tbody tr')
      .filter({ hasText: jobId })
      .first()
      .locator('td')
      .filter({ hasText: JOB_DELETE })
      .click()
    await cardLoad(page)
    await expect(page).toHaveURL(new RegExp(`/jobs/${jobId}$`))
    await expect(detailValue(page, 'Cieľový používateľ')).toContainText(USER_ID)
    await closeDetail(page, `/${jobId}`)
  })
})
