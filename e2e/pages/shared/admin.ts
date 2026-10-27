import { type Locator, type Page, expect } from '@playwright/test'

/**
 * Waits up to `timeout` for `locator` to become visible and reports whether it did, instead of throwing.
 * `locator.isVisible()` does not retry, so it reports "no" if asked
 * right after a navigation while the page is still rendering.
 */
async function becomesVisible(locator: Locator, timeout: number): Promise<boolean> {
  return locator
    .first()
    .waitFor({ state: 'visible', timeout })
    .then(() => true)
    .catch(() => false)
}

const RELOAD_ATTEMPT_TIMEOUT = 6000

export async function reloadUntilVisible(
  page: Page,
  selector: string,
  options: { retries?: number; timeout?: number } = {}
): Promise<void> {
  const retries = options.retries ?? 5
  const timeout = options.timeout ?? 30000
  for (let i = 0; i <= retries; i++) {
    const el = page.locator(selector)
    // Give each attempt a real polling window instead of one instant check between two fixed 3s sleeps.
    // The overall budget is the same, but it returns as soon as the content appears.
    if (await becomesVisible(el, RELOAD_ATTEMPT_TIMEOUT)) {
      await expect(el.first()).toBeVisible({ timeout })
      return
    }
    if (i === retries) throw new Error(`${selector} did not appear after ${retries} reloads`)
    await page.reload()
  }
}

/**
 * The loader may flash in and out quickly, so only its absence is asserted.
 * The `display:none` wait keeps a CSS transition from intercepting the caller's next click.
 */
export async function cardLoad(page: Page): Promise<void> {
  await expect(page.locator('.a-card-loader'))
    .not.toBeVisible({ timeout: 15000 })
    .catch(() => {})
  await page
    .waitForFunction(
      () =>
        Array.from(document.querySelectorAll('.a-card-loader')).every((el) => getComputedStyle(el).display === 'none'),
      undefined,
      { timeout: 5000 }
    )
    .catch(() => {})
}

/**
 * Leaving an alert up would overlay the caller's next click.
 * Alerts may auto-dismiss before the close button is clicked, so click errors are ignored.
 */
export async function closeAlerts(page: Page): Promise<void> {
  const closeButtons = page.locator('.v-alert__close')
  for (let i = await closeButtons.count(); i > 0; i--) {
    await closeButtons
      .first()
      .click({ timeout: 2000 })
      .catch(() => {})
  }
  // A dismissed alert keeps intercepting pointer events until its
  // leave transition ends, which can swallow the caller's next click.
  // Wait tolerantly: an alert the app re-raises on its own (autosave, collaboration) must not fail an unrelated step.
  await expect(page.locator('.v-alert'))
    .toHaveCount(0, { timeout: 3000 })
    .catch(() => {})
}

/**
 * Click a button that should raise `message` and wait for that alert.
 * A save/create click is often swallowed. An earlier alert or a closing Vuetify
 * menu or tooltip intercepts pointer events, so the press lands on nothing.
 * Only a click that provably did nothing is retried. Every write goes to `/api/adm/`,
 * so a press that fires no such request cannot have saved anything and a retry cannot
 * duplicate a record. Once a request is out, the alert is just awaited.
 */
export async function clickForAlert(page: Page, button: Locator, message: string): Promise<void> {
  // Clear the way first. This removes the usual interceptor before it can swallow the click.
  await closeAlerts(page)

  const deadline = Date.now() + 60000
  for (;;) {
    const started = page
      .waitForRequest((request) => WRITE_METHODS.has(request.method()) && request.url().includes('/api/adm/'), {
        timeout: 5000,
      })
      .then(() => true)
      .catch(() => false)
    await button.click()
    if (await started) break
    // A form that fails client-side validation never calls the API either.
    // That is not a swallowed click, and retrying cannot fix it.
    if (await page.locator('.v-alert').filter({ hasText: ALERT_FORM_INVALID }).first().isVisible()) {
      throw new Error(`"${message}": the form failed validation ("${ALERT_FORM_INVALID}")`)
    }
    if (Date.now() > deadline) {
      throw new Error(`"${message}": the click never reached the API — something is swallowing it`)
    }
    await closeAlerts(page)
  }
  await alertMessage(page, message)
}

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])
const ALERT_FORM_INVALID = 'Vyplňte všetky povinné polia a opravte chyby.'

export async function alertMessage(page: Page, message: string): Promise<void> {
  // One action can raise several warnings at once (e.g. flipping "PR
  // správa" warns about the forum/iText switch-off and auto-narration).
  // Pick the alert that carries `message` instead of assuming it is the first.
  await expect(page.locator('.v-alert').filter({ hasText: message }).first()).toBeVisible({ timeout: 15000 })
  await closeAlerts(page)
}

export function exactTextMatch(text: string): RegExp {
  return new RegExp(`^\\s*${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`)
}

/**
 * Picks `item` from a select whose menu virtualises its options. Only the rendered window
 * is in the DOM, so a plain text-filtered click never finds an option further down.
 * Opens the select by its accessible name, walks the menu declared via
 * `aria-controls` from the top until the option mounts, then clicks it.
 */
export async function pickVirtualizedOption(page: Page, combo: Locator, item: string): Promise<void> {
  await expect(combo).toBeEnabled({ timeout: 15000 })
  await combo.click()
  await expect(page.locator('.v-progress-linear--active'))
    .toHaveCount(0, { timeout: 20000 })
    .catch(() => {})

  const menuId = await combo.getAttribute('aria-controls')
  const menu = menuId ? page.locator(`[id="${menuId}"]`) : page.locator('.v-overlay--active').last()
  const scroller = menu.locator('.v-list').first()
  await expect(scroller).toBeVisible({ timeout: 15000 })
  // Vuetify scrolls a freshly opened menu to its selected option a tick
  // after it mounts, which undoes a scroll issued right after the click.
  // Let that settle before sweeping.
  await page.waitForTimeout(500)

  const option = menu.locator('.v-list-item').filter({ hasText: item }).first()
  await expect(async () => {
    if ((await option.count()) === 0) {
      // Walk the rendered window down and wrap back to the top at the end.
      // The target can sit above the offset Vuetify restored, and a one-way sweep would never reach it.
      await scroller.evaluate((el) => {
        const atEnd = el.scrollTop + el.clientHeight >= el.scrollHeight - 2
        el.scrollTo(0, atEnd ? 0 : el.scrollTop + 250)
      })
    }
    await expect(option).toHaveCount(1, { timeout: 500 })
  }).toPass({ timeout: 30000 })
  await option.click()
  // A single-select closes on pick. Wait for that so the menu cannot swallow the caller's next click.
  await expect(menu)
    .toBeHidden({ timeout: 5000 })
    .catch(() => {})
}

/**
 * Exact match, so "ID" does not also hit "Externé ID".
 */
export function filterInput(page: Page, label: string | RegExp): Locator {
  const text =
    typeof label === 'string'
      ? page.locator('label').getByText(label, { exact: true })
      : page.locator('label').getByText(label)
  return page.locator('[data-cy^="filter-"]').filter({ has: text }).locator('input').first()
}

/**
 * Expands the advanced filters when the field is collapsed. A quick filter
 * or two stay visible without them, so only the target field tells.
 */
export async function filterBy(page: Page, label: string | RegExp, value: string): Promise<void> {
  const input = filterInput(page, label)
  const toggle = page.locator('[data-cy="filter-advanced"]').filter({ visible: true }).first()
  await expect(toggle).toBeVisible()
  if (!(await input.isVisible())) {
    await toggle.click()
    await expect(input).toBeVisible()
  }
  await input.fill(value)
  await input.press('Enter')
  await cardLoad(page)
}

/**
 * The quick text filter is fuzzy and does not match ids.
 */
export async function filterById(page: Page, id: string): Promise<void> {
  await filterBy(page, /^\s*ID\s*$/i, id)
}

/**
 * Waits until the id equals the id at the end of the URL. Containment is not enough:
 * the "0" placeholder shown while the entity loads is contained in most ids.
 */
export async function detailId(page: Page): Promise<string> {
  const copyText = page.locator('[data-cy="copy-text"]').filter({ visible: true }).first()
  let id = ''
  await expect(async () => {
    id = ((await copyText.textContent()) ?? '').trim()
    const urlId = new URL(page.url()).pathname
      .replace(/\/edit$/, '')
      .split('/')
      .pop()
    expect(id, 'rendered detail id').not.toBe('')
    expect(id, 'rendered detail id matches the url').toBe(urlId)
  }).toPass({ timeout: 15000 })
  return id
}
