import { test, expect, type Page } from '@playwright/test'
import { prepareUser } from '@pages/shared/login'
import { ADMIN_SUITE, RAND_NUM } from '@pages/shared/constants'
import {
  createAnzuUser,
  fetchUser,
  openUserByEmail,
  openUserEdit,
  saveAndCloseUser,
  toggleUserAccess,
  type UserAccessData,
} from '@pages/settings/userPage'
import { deleteUserDataViaApi } from '@pages/settings/jobPage'
import { closeDetail, openSettingsSection, saveEdit, visibleCy } from '@pages/shared/crud'

let page: Page
let USER_CREATED = false

// Far above the real central user ids, so the created account can never shadow a real one.
const USER_ID = `9${RAND_NUM.slice(-8)}`
const USER_EMAIL = `test.mail+${RAND_NUM}@adam.com`

const ACCESS: UserAccessData = {
  licences: ['Novyny', 'Sme Family'],
  adminToExtSystems: ['cms', 'blog', 'tools'],
  externalProviders: ['Unsplash'],
  distributionServices: ['Youtube', 'JwVideo'],
}

test.describe.serial(`${ADMIN_SUITE} - User`, () => {
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext()
    page = await ctx.newPage()
    await prepareUser(page)
  })

  test.afterAll(async () => {
    // Users cannot be deleted — DELETE /anzu-user/:id answers 500 (DAM-B16, see KNOWN-BUGS.md) —
    // anonymise the account instead.
    if (USER_CREATED) await deleteUserDataViaApi(page, USER_ID)
    await page.context().close()
  })

  test('creates a user', async () => {
    await openSettingsSection(page, 'user-permissions', '/anzu-users', 'Oprávnenia používateľov')
    const id = await createAnzuUser(page, {
      id: USER_ID,
      email: USER_EMAIL,
      role: 'Super Administrátor',
      permissionGroup: 'DAM full',
    })
    USER_CREATED = true
    expect(id).toBe(USER_ID)
    await openUserByEmail(page, '/anzu-users', USER_EMAIL, USER_ID)
    await closeDetail(page, `/${USER_ID}`)
    await expect(page).toHaveURL(/\/anzu-users$/)
  })

  test('grants the user licences, ext systems, providers and distribution services', async () => {
    await openSettingsSection(page, 'user-settings', '/users', 'Používatelia')
    await openUserByEmail(page, '/users', USER_EMAIL, USER_ID)
    await visibleCy(page, 'button-edit').click()
    await expect(page).toHaveURL(/\/edit$/)
    await openUserEdit(page, USER_ID)
    await toggleUserAccess(page, ACCESS)
    await saveAndCloseUser(page)

    const user = await fetchUser(page, USER_ID)
    expect(user.assetLicences).toHaveLength(ACCESS.licences.length)
    expect(user.adminToExtSystems).toHaveLength(ACCESS.adminToExtSystems.length)
    expect(user.allowedAssetExternalProviders).toHaveLength(ACCESS.externalProviders.length)
    expect(user.allowedDistributionServices).toHaveLength(ACCESS.distributionServices.length)
  })

  test('resets the user access', async () => {
    await openUserEdit(page, USER_ID)
    await toggleUserAccess(page, ACCESS)
    await saveEdit(page)

    const user = await fetchUser(page, USER_ID)
    expect(user.assetLicences).toHaveLength(0)
    expect(user.adminToExtSystems).toHaveLength(0)
    expect(user.allowedAssetExternalProviders).toHaveLength(0)
    expect(user.allowedDistributionServices).toHaveLength(0)
  })
})
