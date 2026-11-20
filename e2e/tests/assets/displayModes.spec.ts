import { test, expect, type Page } from '@playwright/test'
import { prepareUser } from '@pages/shared/login'
import { ADMIN_SUITE } from '@pages/shared/constants'
import { alertMessage } from '@pages/shared/admin'
import { getAsset } from '@pages/shared/api'
import { expectImageGrid, listRows, openAssetList, switchDisplayMode } from '@pages/assets/displayModesPage'

let page: Page

test.describe.serial(`${ADMIN_SUITE} - Asset list display modes`, () => {
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext()
    page = await ctx.newPage()
    await prepareUser(page)
    await openAssetList(page)
  })

  test.afterAll(async () => {
    await page.context().close()
  })

  test('shows a masonry layout in tile mode', async () => {
    await switchDisplayMode(page, 'tiles')
    await expectImageGrid(page, 'masonry')
  })

  test('shows a thumbnail grid in grid mode', async () => {
    await switchDisplayMode(page, 'grid')
    await expectImageGrid(page, 'thumbnail')
  })

  test('shows a table in list mode', async () => {
    await switchDisplayMode(page, 'list')
    await expect(page.locator('.dam-image-grid')).toHaveCount(0)
    await expect(page.locator('.v-table')).toBeVisible()
    await expect(listRows(page).first()).toBeVisible()
  })

  test('copies an asset id to the clipboard from the list', async () => {
    const row = listRows(page).first()
    await row.locator('td').nth(2).click()
    await expect(row).toHaveClass(/a-table__row--active/)
    await row.locator('[data-cy="table-copy"]').click()
    await alertMessage(page, 'ID bolo skopírované do schránky')

    // The copied id has to belong to the clicked row: the asset it names carries that row's title.
    const copiedId = (await page.evaluate(() => navigator.clipboard.readText())).trim()
    expect(copiedId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
    const asset = await getAsset(page, copiedId)
    await expect(row.locator('td').nth(2)).toHaveText(asset.texts.displayTitle || 'žiadny nadpis', { ignoreCase: true })
  })
})
