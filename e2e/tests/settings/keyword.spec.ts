import { test, expect, type Page } from '@playwright/test'
import { prepareUser } from '@pages/shared/login'
import { ADMIN_SUITE, RAND_NUM } from '@pages/shared/constants'
import { createKeyword, deleteKeywordViaApi, updateKeyword } from '@pages/settings/keywordPage'
import { openDetailAndClose, resetFilters, rowWithCell } from '@pages/shared/crud'
import { filterBy } from '@pages/shared/admin'

let page: Page
let KEYWORD_ID = ''

const NAME = `Keyword${RAND_NUM}`

test.describe.serial(`${ADMIN_SUITE} - Keyword`, () => {
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext()
    page = await ctx.newPage()
    await prepareUser(page)
  })

  test.afterAll(async () => {
    if (KEYWORD_ID) await deleteKeywordViaApi(page, KEYWORD_ID)
    await page.context().close()
  })

  test('creates a keyword', async () => {
    KEYWORD_ID = await createKeyword(page, NAME)
  })

  test('shows the created keyword on its detail', async () => {
    // The list is ordered by createdAt ascending, so the new keyword is not on the first page.
    await filterBy(page, 'Text', NAME)
    expect(await openDetailAndClose(page, NAME, 'keywords')).toBe(KEYWORD_ID)
  })

  test('updates the keyword', async () => {
    await updateKeyword(page, KEYWORD_ID, `${NAME}-edit`)
    await resetFilters(page)
    await filterBy(page, 'Text', `${NAME}-edit`)
    await expect(rowWithCell(page, `${NAME}-edit`)).toHaveCount(1)
    await resetFilters(page)
  })
})
