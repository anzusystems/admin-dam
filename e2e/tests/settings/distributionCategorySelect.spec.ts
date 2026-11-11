import { test, type Page } from '@playwright/test'
import { prepareUser } from '@pages/shared/login'
import { ADMIN_SUITE, RAND_NUM } from '@pages/shared/constants'
import {
  addCategorySelectOption,
  expectCategorySelectOption,
  openFirstCategorySelect,
  removeCategorySelectOption,
} from '@pages/settings/distributionCategorySelectPage'

let page: Page
let SELECT_ID = ''
let OPTION_REMOVED = true

const OPTION = { name: `Name+${RAND_NUM}`, value: RAND_NUM }

test.describe.serial(`${ADMIN_SUITE} - Distribution category select`, () => {
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext()
    page = await ctx.newPage()
    await prepareUser(page)
  })

  test.afterAll(async () => {
    // The removal test is the intended teardown; this only catches an option stranded by an earlier failure.
    if (SELECT_ID && !OPTION_REMOVED) await removeCategorySelectOption(page, SELECT_ID, OPTION.name).catch(() => {})
    await page.context().close()
  })

  test('adds an option to a distribution category select', async () => {
    SELECT_ID = await openFirstCategorySelect(page)
    OPTION_REMOVED = false
    await addCategorySelectOption(page, OPTION)
    await expectCategorySelectOption(page, SELECT_ID, OPTION)
  })

  test('removes the option', async () => {
    await removeCategorySelectOption(page, SELECT_ID, OPTION.name)
    OPTION_REMOVED = true
  })
})
