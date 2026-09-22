import { test, expect, type Page } from '@playwright/test'
import { prepareUser } from '@pages/shared/login'
import { ADMIN_SUITE, RAND_NUM } from '@pages/shared/constants'
import { createAuthor, deleteAuthorViaApi, updateAuthor } from '@pages/settings/authorPage'
import { openDetailAndClose, resetFilters, rowWithCell } from '@pages/shared/crud'
import { filterBy } from '@pages/shared/admin'

let page: Page
let AUTHOR_ID = ''

const NAME = `First${RAND_NUM}`

test.describe.serial(`${ADMIN_SUITE} - Author`, () => {
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext()
    page = await ctx.newPage()
    await prepareUser(page)
  })

  test.afterAll(async () => {
    if (AUTHOR_ID) await deleteAuthorViaApi(page, AUTHOR_ID)
    await page.context().close()
  })

  test('creates an author', async () => {
    AUTHOR_ID = await createAuthor(page, { name: NAME, identifier: RAND_NUM, type: 'Interný' })
  })

  test('shows the created author on its detail', async () => {
    await resetFilters(page)
    await filterBy(page, 'Text', NAME)
    expect(await openDetailAndClose(page, NAME, 'authors')).toBe(AUTHOR_ID)
  })

  test('updates the author', async () => {
    await updateAuthor(page, AUTHOR_ID, { name: `${NAME}-edit`, identifier: `${RAND_NUM}-edit`, type: 'Externý' })
    await resetFilters(page)
    await filterBy(page, 'Identifikátor', `${RAND_NUM}-edit`)
    await expect(rowWithCell(page, `${NAME}-edit`)).toHaveCount(1)
    await resetFilters(page)
  })
})
