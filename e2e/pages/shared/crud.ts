import { type Locator, type Page, type Response, expect } from '@playwright/test'
import { ALERT_CREATE, ALERT_UPDATE, CORE_DAM_API } from '@pages/shared/constants'
import { cardLoad, clickForAlert, detailId } from '@pages/shared/admin'

/** First visible element carrying `dataCy` — datatables and the rail/drawer duplicate most of them. */
export function visibleCy(scope: Page | Locator, dataCy: string): Locator {
  return scope.locator(`[data-cy="${dataCy}"]`).filter({ visible: true }).first()
}

/** Open a settings section from the settings navigation and check its URL and breadcrumb. */
export async function openSettingsSection(page: Page, dataCy: string, url: string, title: string): Promise<void> {
  await page.goto('/settings')
  await visibleCy(page, dataCy).click()
  await expect(page).toHaveURL(new RegExp(url))
  await expect(page.locator('.v-breadcrumbs-item__text').last()).toContainText(title)
  await cardLoad(page)
}

/** The create dialog opened by a list's "create" button, identified by its title (any dialog when omitted). */
export function createDialog(page: Page, title?: string): Locator {
  const dialog = page.getByRole('dialog')
  return title ? dialog.filter({ hasText: title }) : dialog
}

/**
 * Confirm a create dialog and return the id of the created record, read from the POST response to a path
 * ending in `endpoint` (e.g. `/author`) — lists page and sort differently per section, so the response is the
 * only reliable source.
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

/** Save an edit form with the action-bar save button and wait for the update alert. */
export async function saveEdit(page: Page): Promise<void> {
  await clickForAlert(page, visibleCy(page, 'button-save'), ALERT_UPDATE)
}

/** Close a detail/edit view with the action-bar close button and wait until the URL no longer has `urlPart`. */
export async function closeDetail(page: Page, urlPart: string): Promise<void> {
  await visibleCy(page, 'button-close').click()
  await expect(page).not.toHaveURL(new RegExp(urlPart))
}

/** Reset the datatable filters. */
export async function resetFilters(page: Page): Promise<void> {
  await visibleCy(page, 'filter-reset').click()
  await cardLoad(page)
}

/** The body rows having a cell whose text is exactly `text`. */
export function rowWithCell(page: Page, text: string): Locator {
  return page.locator('tbody tr').filter({ has: page.locator('td').getByText(text, { exact: true }) })
}

/** Open the detail of the row with the cell `rowText`, read its id, then close it back to `listUrl`. */
export async function openDetailAndClose(page: Page, rowText: string, listUrl: string): Promise<string> {
  await rowWithCell(page, rowText).first().click()
  await cardLoad(page)
  const id = await detailId(page)
  await visibleCy(page, 'button-close').click()
  await expect(page).toHaveURL(new RegExp(`/${listUrl}$`))
  return id
}

/**
 * The row of a detail view carrying the heading `title`, e.g. `Názov` or `Licencie`. Detail views render
 * every field as an `h4` heading followed by its value, so this is how a value is read back by meaning.
 * `scope` narrows it to one dialog where a page holds several.
 *
 * `.v-row` nests — the row holding one field sits inside the row holding the whole block, and both match
 * — so the **innermost** one is taken. The outer one contains every other field too, and asserting on it
 * would pass whatever the field itself says.
 *
 * The heading is matched inside the CSS rather than with `filter({ has })`: a `has` locator built from a
 * scope carries that scope's own selector, and re-rooting it at each candidate row then looks for the
 * scope *inside* the row, which never matches.
 */
export function detailRow(scope: Page | Locator, title: string): Locator {
  return scope.locator(`.v-row:has(h4:text-is("${title}"))`).last()
}

/** Pick the "Teraz" (now) value in the date-time picker whose field is labelled `label`. */
export async function pickNow(page: Page, scope: Locator, label: string): Promise<void> {
  await scope.locator('.v-input').filter({ hasText: label }).locator('.mdi-calendar').click()
  await page.locator('.a-datetime-picker__bottom-button').filter({ hasText: 'Teraz' }).click()
  await page.keyboard.press('Escape')
}

/** Pick an exact option in a Vuetify select/combobox. */
export async function pickOption(page: Page, combobox: Locator, option: string): Promise<void> {
  await combobox.click()
  await page.getByRole('option', { name: option, exact: true }).click()
}

/** Delete a record through the API, tolerating one that is already gone. Swallows errors — cleanup only. */
export async function deleteViaApi(page: Page, path: string): Promise<void> {
  await page.request.delete(`${CORE_DAM_API}/${path}`, { failOnStatusCode: false }).catch(() => {})
}

/** Fetch a record through the API and return the HTTP status. */
export async function apiStatus(page: Page, path: string): Promise<number> {
  const response = await page.request.get(`${CORE_DAM_API}/${path}`, { failOnStatusCode: false })
  return response.status()
}

/**
 * Poll a record through the API until it answers `status`.
 *
 * For a delete this is what a single `apiStatus` cannot do: an asset delete is *accepted* rather than
 * carried out — `DELETE /asset/{id}` answers 204 and the alert is up while the asset and its files are
 * still being removed — so the record keeps answering 200 for a second or two afterwards.
 */
export async function expectApiStatus(page: Page, path: string, status: number, timeout = 30000): Promise<void> {
  await expect.poll(() => apiStatus(page, path), { message: `status of ${path}`, timeout }).toBe(status)
}
