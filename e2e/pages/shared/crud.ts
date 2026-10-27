import { type Locator, type Page, type Response, expect } from '@playwright/test'
import { ALERT_CREATE, ALERT_UPDATE, CORE_DAM_API } from '@pages/shared/constants'
import { cardLoad, clickForAlert, detailId } from '@pages/shared/admin'

/**
 * Datatables and the rail/drawer duplicate most `data-cy` elements, so take the first visible one.
 */
export function visibleCy(scope: Page | Locator, dataCy: string): Locator {
  return scope.locator(`[data-cy="${dataCy}"]`).filter({ visible: true }).first()
}

export async function openSettingsSection(page: Page, dataCy: string, url: string, title: string): Promise<void> {
  await page.goto('/settings')
  await visibleCy(page, dataCy).click()
  await expect(page).toHaveURL(new RegExp(url))
  await expect(page.locator('.v-breadcrumbs-item__text').last()).toContainText(title)
  await cardLoad(page)
}

export function createDialog(page: Page, title?: string): Locator {
  const dialog = page.getByRole('dialog')
  return title ? dialog.filter({ hasText: title }) : dialog
}

/**
 * The id is read from the POST response to a path ending in `endpoint` (e.g. `/author`).
 * Lists page and sort differently per section, so the response is the only reliable source.
 */
export async function confirmCreate(page: Page, dialog: Locator, endpoint: string): Promise<string> {
  const created = page.waitForResponse(
    (response: Response) =>
      response.request().method() === 'POST' && new URL(response.url()).pathname.endsWith(endpoint)
  )
  await clickForAlert(page, dialog.locator('[data-cy="button-confirm"]'), ALERT_CREATE)
  const response = await created
  expect(response.ok(), `POST ${endpoint} responds ${response.status()}`).toBeTruthy()
  const id = String((await response.json()).id)
  await expect(dialog).toBeHidden()
  return id
}

export async function saveEdit(page: Page): Promise<void> {
  await clickForAlert(page, visibleCy(page, 'button-save'), ALERT_UPDATE)
}

export async function closeDetail(page: Page, urlPart: string): Promise<void> {
  await visibleCy(page, 'button-close').click()
  await expect(page).not.toHaveURL(new RegExp(urlPart))
}

export async function resetFilters(page: Page): Promise<void> {
  await visibleCy(page, 'filter-reset').click()
  await cardLoad(page)
}

export function rowWithCell(page: Page, text: string): Locator {
  return page.locator('tbody tr').filter({ has: page.locator('td').getByText(text, { exact: true }) })
}

export async function openDetailAndClose(page: Page, rowText: string, listUrl: string): Promise<string> {
  await rowWithCell(page, rowText).first().click()
  await cardLoad(page)
  const id = await detailId(page)
  await visibleCy(page, 'button-close').click()
  await expect(page).toHaveURL(new RegExp(`/${listUrl}$`))
  return id
}

/**
 * Detail views render every field as an `h4` heading followed by its
 * value. `scope` narrows it to one dialog where a page holds several.
 * `.v-row` nests and both the field row and the block row match, so the innermost one is taken. The
 * outer row contains every other field, and asserting on it would pass whatever the field says.
 * The heading is matched inside the CSS, not with `filter({ has })`. A `has` locator built from a
 * scope carries the scope's selector, so it would look for the scope inside the row and never match.
 */
export function detailRow(scope: Page | Locator, title: string): Locator {
  return scope.locator(`.v-row:has(h4:text-is("${title}"))`).last()
}

export async function pickNow(page: Page, scope: Locator, label: string): Promise<void> {
  await scope.locator('.v-input').filter({ hasText: label }).locator('.mdi-calendar').click()
  await page.locator('.a-datetime-picker__bottom-button').filter({ hasText: 'Teraz' }).click()
  await page.keyboard.press('Escape')
}

export async function pickOption(page: Page, combobox: Locator, option: string): Promise<void> {
  await combobox.click()
  await page.getByRole('option', { name: option, exact: true }).click()
}

export async function deleteViaApi(page: Page, path: string): Promise<void> {
  await page.request.delete(`${CORE_DAM_API}/${path}`, { failOnStatusCode: false }).catch(() => {})
}

export async function apiStatus(page: Page, path: string): Promise<number> {
  const response = await page.request.get(`${CORE_DAM_API}/${path}`, { failOnStatusCode: false })
  return response.status()
}

/**
 * A single `apiStatus` is not enough after a delete. An asset delete is accepted, not carried
 * out: `DELETE /asset/{id}` answers 204 and the alert shows while files are still being removed.
 * The record keeps answering 200 for a second or two afterwards.
 */
export async function expectApiStatus(page: Page, path: string, status: number, timeout = 30000): Promise<void> {
  await expect.poll(() => apiStatus(page, path), { message: `status of ${path}`, timeout }).toBe(status)
}
