import { test, expect, type Page } from '@playwright/test'
import { prepareUser } from '@pages/shared/login'
import { ADMIN_SUITE } from '@pages/shared/constants'
import { openExtSystemBySlug, renameExtSystem } from '@pages/settings/extSystemPage'
import { resetFilters } from '@pages/shared/crud'

let page: Page

/** A shared, pre-existing ext system: the test saves it under the name it already has. */
const EXT_SYSTEM = { slug: 'cms', name: 'CMS system' }

test.describe.serial(`${ADMIN_SUITE} - Ext system`, () => {
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext()
    page = await ctx.newPage()
    await prepareUser(page)
  })

  test.afterAll(async () => {
    await page.context().close()
  })

  test('edits an ext system', async () => {
    const id = await openExtSystemBySlug(page, EXT_SYSTEM.slug)
    await expect(page).toHaveURL(new RegExp(`/ext-systems/${id}$`))
    await renameExtSystem(page, EXT_SYSTEM.name)
    await expect(page).toHaveURL(/\/ext-systems/)
    await page.goto('/ext-systems')
    await resetFilters(page)
  })
})
