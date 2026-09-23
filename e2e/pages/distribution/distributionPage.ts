import { type Locator, type Page, expect } from '@playwright/test'
import { cardLoad, closeAlerts, pickVirtualizedOption } from '@pages/shared/admin'
import { CORE_DAM_API } from '@pages/shared/constants'
import { visibleCy } from '@pages/shared/crud'

/** Distribution service tabs of the "Pridať novú distribúciu" dialog, as labelled in the app. */
export type DistributionService = 'JW Player Audio' | 'JW Player Video' | 'YouTube'

export interface DistributionData {
  title: string
  description: string
  /** JW Player only. */
  author?: string
  /** JW Player only — added as a chip. */
  keyword?: string
  /** JW Player only — sets "Publikované o" to now. */
  publishNow?: boolean
}

/** Open an asset detail on its distribution tab. */
export async function openDistributionTab(page: Page, assetId: string): Promise<void> {
  await page.goto(`/assets/${assetId}`)
  await cardLoad(page)
  await visibleCy(page, 'button-distribution').click()
  await expect(page.locator('.sidebar-info').getByText('Zoznam distribúcií:')).toBeVisible()
}

/** Pick the distribution category of the open asset through the pencil next to "Kategória distribúcie". */
export async function setDistributionCategory(page: Page, category: string): Promise<void> {
  await page.locator('.sidebar-info .mdi-pencil').first().click()
  const dialog = page.getByRole('dialog').filter({ hasText: 'Výber distribučnej kategórie' })
  await dialog.getByRole('combobox', { name: 'Kategória distribúcie' }).click()
  await page.getByRole('option', { name: category, exact: true }).click()
  await dialog.getByRole('button', { name: 'Potvrdiť' }).click()
  await expect(dialog).toBeHidden()
  await expect(page.locator('.sidebar-info')).toContainText(category)
}

/** Open the "Pridať novú distribúciu" dialog from the distribution tab. */
export async function openAddDistribution(page: Page): Promise<Locator> {
  await closeAlerts(page)
  await page.locator('.sidebar-info').getByRole('button', { name: 'Pridať novú' }).click()
  const dialog = page.getByRole('dialog').filter({ hasText: 'Pridať novú distribúciu' })
  await expect(dialog).toBeVisible()
  return dialog
}

/**
 * Fill and submit the form of `service` in the open distribution dialog, and wait until the distribution is
 * accepted by the API. The dialog stays open, listing the new distribution with its state.
 */
export async function distribute(
  page: Page,
  dialog: Locator,
  service: DistributionService,
  data: DistributionData
): Promise<void> {
  const tab = dialog.getByRole('tab', { name: service, exact: true })
  const payload = page.waitForResponse((response) => /\/prepare-payload\//.test(response.url()), { timeout: 30000 })
  if ((await tab.getAttribute('aria-selected')) !== 'true') await tab.click()
  // The form prefills itself from the prepared payload of the asset slot; anything typed before it arrives is
  // discarded when the form is re-initialised.
  await payload.catch(() => {})
  await expect(dialog.getByRole('combobox', { name: 'Asset slot' })).not.toHaveValue('')

  const titleLabel = service === 'YouTube' ? 'Nadpis' : 'Názov'
  const title = dialog.getByRole('textbox', { name: titleLabel })
  await title.fill(data.title)
  await dialog.getByRole('textbox', { name: 'Popis' }).fill(data.description)
  if (data.author) await dialog.getByRole('textbox', { name: 'Autor' }).fill(data.author)
  if (data.keyword) {
    const keywords = dialog.getByRole('combobox', { name: 'Kľúčové slová' })
    await keywords.fill(data.keyword)
    await keywords.press('Enter')
    await expect(dialog.locator('.v-chip').filter({ hasText: data.keyword })).toBeVisible()
  }
  if (data.publishNow) {
    await dialog.locator('.mdi-calendar').first().click()
    await page.locator('.a-datetime-picker__bottom-button').filter({ hasText: 'Teraz' }).click()
    await expect(dialog.getByRole('textbox', { name: 'Publikované o' })).not.toHaveValue('')
  }
  // Guard against a late re-initialisation wiping the values before they are submitted.
  await expect(title).toHaveValue(data.title)

  const distributed = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' &&
      response.url().startsWith(`${CORE_DAM_API}/`) &&
      response.url().endsWith('/distribute')
  )
  await dialog.getByRole('button', { name: 'Pridať', exact: true }).click()
  const response = await distributed
  expect(response.ok(), `POST ${response.url()} responds ${response.status()}`).toBeTruthy()
  await expect(dialog.getByText(service, { exact: true }).last()).toBeVisible()
}

/** Close the distribution dialog. */
export async function closeDistributionDialog(page: Page, dialog: Locator): Promise<void> {
  await dialog.getByRole('button', { name: 'Zrušiť' }).click()
  await expect(dialog).toBeHidden()
}

/** The YouTube distribution service devel configures for video. */
export const YOUTUBE_SERVICE_NAME = 'youtube_cms_main'

/** The languages the YouTube service offers, straight from the API the select is built from. */
export async function youtubeLanguages(page: Page, serviceName = YOUTUBE_SERVICE_NAME): Promise<string[]> {
  const response = await page.request.get(`${CORE_DAM_API}/youtube-distribution/${serviceName}/language`)
  expect(response.status(), 'GET youtube languages').toBe(200)
  return (await response.json()).data.map((language: { title: string }) => language.title)
}

/**
 * The playlists the YouTube service offers. `forceReload` is the flag the select's refresh button sets,
 * which makes the backend ask YouTube again instead of answering from its cache.
 */
export async function youtubePlaylists(
  page: Page,
  { forceReload = false, serviceName = YOUTUBE_SERVICE_NAME } = {}
): Promise<string[]> {
  const response = await page.request.get(
    `${CORE_DAM_API}/youtube-distribution/${serviceName}/playlist/${forceReload ? 1 : 0}`
  )
  expect(response.status(), 'GET youtube playlists').toBe(200)
  return (await response.json()).data.map((playlist: { title: string }) => playlist.title)
}

/** The `blockedBy` services an ext system declares for one distribution service of an asset type. */
export async function distributionBlockedBy(
  page: Page,
  assetType: string,
  serviceName: string,
  extSystemId = 1
): Promise<string[]> {
  const response = await page.request.get(`${CORE_DAM_API}/configuration/ext-system/${extSystemId}`)
  expect(response.status(), 'GET ext system configuration').toBe(200)
  const requirements = (await response.json())[assetType]?.distribution?.distributionRequirements?.[serviceName]
  expect(requirements, `distribution requirements of ${assetType}/${serviceName}`).toBeTruthy()
  return requirements.blockedBy
}

/** The entry of `service` in the distribution list of the asset sidebar. */
export function distributionEntry(page: Page, service: DistributionService): Locator {
  return page
    .locator('.sidebar-info .text-body-medium')
    .filter({ has: page.getByText(service, { exact: true }) })
    .filter({ hasText: 'Stav:' })
    .first()
}

/**
 * Wait until the distribution to `service` reports "Distribuovaný". The sidebar does not refresh the state on
 * its own, so the asset detail is reopened between checks.
 *
 * The budget is generous because the wait is on JW Player, not on DAM: the entry sits in "Vzdialené
 * spracovávanie" for as long as the remote encoder takes, which for a video has been seen to pass three
 * minutes and then finish in well under one on the next attempt. A distribution that is genuinely stuck
 * still fails here — only later.
 */
export async function expectDistributed(
  page: Page,
  assetId: string,
  service: DistributionService,
  timeout = 8 * 60 * 1000
): Promise<void> {
  await expect(async () => {
    await openDistributionTab(page, assetId)
    await expect(distributionEntry(page, service)).toContainText('Distribuovaný', { timeout: 5000 })
  }).toPass({ timeout, intervals: [10000] })
}

// ---------------------------------------------------------------------------------------------------
// Distribution lifecycle: states, redistribute, the advanced management panel
// ---------------------------------------------------------------------------------------------------

/**
 * The status labels the sidebar renders, keyed by the value the API stores.
 *
 * Which of them offers `Znovu distribuovať` is not the app's choice but the environment's: each service
 * declares `allowedRedistributeStatuses` in `GET /configuration`, and on devel both services allow
 * **`failed` only** — so a healthy distribution never offers the button. `redistributeStatuses` reads that
 * configuration rather than assuming it.
 */
export const DISTRIBUTION_STATUS = {
  waiting: 'Čaká',
  distributing: 'Distribuuje sa',
  remoteProcessing: 'Vzdialené spracovávanie',
  distributed: 'Distribuovaný',
  failed: 'Chyba',
} as const

export type DistributionStatusValue = keyof typeof DISTRIBUTION_STATUS

/** One distribution as the API reports it. */
export interface DistributionRecord {
  id: string
  distributionService: string
  status: string
  failReason: string
  extId: string
  texts?: { title: string; description: string; author?: string; keywords: string[] }
}

/** Every distribution of an asset, newest first, straight from the API. */
export async function assetDistributions(page: Page, assetId: string): Promise<DistributionRecord[]> {
  const response = await page.request.get(`${CORE_DAM_API}/distribution/asset/${assetId}?limit=25&offset=0`)
  expect(response.status(), `GET distributions of asset ${assetId}`).toBe(200)
  return (await response.json()).data
}

/** The statuses `service` may be redistributed from, as the environment configures them. */
export async function redistributeStatuses(page: Page, serviceName: string): Promise<string[]> {
  const response = await page.request.get(`${CORE_DAM_API}/configuration`)
  expect(response.status(), 'GET configuration').toBe(200)
  const service = (await response.json()).distributionServices[serviceName]
  expect(service, `distribution service ${serviceName}`).toBeTruthy()
  return service.allowedRedistributeStatuses
}

/** Assert the sidebar reports `status` for `service`. */
export async function expectDistributionStatus(
  page: Page,
  service: DistributionService,
  status: DistributionStatusValue
): Promise<void> {
  await expect(distributionEntry(page, service)).toContainText(DISTRIBUTION_STATUS[status])
}

/** The `Znovu distribuovať` button of a distribution — rendered only for a redistributable status. */
export function redistributeButton(page: Page, service: DistributionService): Locator {
  return distributionEntry(page, service).getByRole('button', { name: 'Znovu distribuovať' })
}

/**
 * Open the redistribute dialog of `service` and wait until it has loaded the existing distribution.
 *
 * The form is prefilled from the **stored distribution**, not from the asset's prepared payload — the way
 * `Pridať novú` is — so it is ready once the title it holds has arrived. A distribution whose texts are
 * empty therefore never looks "ready"; only records written by a real distribute can be driven here.
 */
export async function openRedistribute(page: Page, service: DistributionService): Promise<Locator> {
  await closeAlerts(page)
  await redistributeButton(page, service).click()
  const dialog = page.getByRole('dialog').filter({ hasText: 'Znovu distribuovať' }).first()
  await expect(dialog).toBeVisible()
  // In redistribute mode the dialog carries neither the service tabs nor the asset-slot picker: it
  // re-sends one existing distribution, so there is nothing to choose.
  await expect(dialog.getByRole('tab')).toHaveCount(0)
  await expect(dialog.getByRole('textbox', { name: 'Názov' })).not.toHaveValue('', { timeout: 30000 })
  return dialog
}

/**
 * Submit the open redistribute dialog, and wait for the `…/redistribute` answer.
 *
 * Returns that response so a caller can assert the status it carries — which is what the DAM-B8 test needs,
 * since a rejected redistribute leaves the dialog open and raises no alert of its own.
 */
export async function submitRedistribute(page: Page, dialog: Locator, data: DistributionData) {
  await dialog.getByRole('textbox', { name: 'Názov' }).fill(data.title)
  await dialog.getByRole('textbox', { name: 'Popis' }).fill(data.description)
  if (data.author) await dialog.getByRole('textbox', { name: 'Autor' }).fill(data.author)
  // Guard against a late re-initialisation wiping the values before they are submitted.
  await expect(dialog.getByRole('textbox', { name: 'Názov' })).toHaveValue(data.title)

  const redistributed = page.waitForResponse(
    (response) => response.request().method() === 'PUT' && response.url().endsWith('/redistribute')
  )
  await dialog.getByRole('button', { name: 'Potvrdiť' }).first().click()
  return redistributed
}

// --- the YouTube form of "Pridať novú distribúciu" -----------------------------------------------------

/**
 * Open the tab of `service` in the add dialog and wait for the form it prepares.
 *
 * The form is filled from `…/prepare-payload/<service>`, and anything typed before that answer lands is
 * discarded when the form re-initialises — the same trap `distribute` documents.
 */
export async function openDistributionServiceTab(
  page: Page,
  dialog: Locator,
  service: DistributionService
): Promise<void> {
  const tab = dialog.getByRole('tab', { name: service, exact: true })
  const payload = page.waitForResponse((response) => /\/prepare-payload\//.test(response.url()), { timeout: 30000 })
  if ((await tab.getAttribute('aria-selected')) !== 'true') await tab.click()
  await payload.catch(() => {})
  await expect(dialog.getByRole('combobox', { name: 'Asset slot' })).not.toHaveValue('')
}

/**
 * A field of the distribution dialog, found by the label its wrapper carries.
 *
 * Vuetify renders a select's value and its label into the same `.v-input`, so this matches on the
 * wrapper's text rather than on a `<label>` element — the labels are distinctive inside one dialog.
 */
export function distributionField(dialog: Locator, label: string): Locator {
  return dialog.locator('.v-input').filter({ hasText: label }).first()
}

/** Vuetify's stand-in for a select with nothing to offer — rendered as an option in its own right. */
const NO_OPTIONS = 'Žiadne dostupné dáta'

/**
 * The options a select of the dialog offers, with the menu left closed again.
 *
 * A select whose options are still on their way renders Vuetify's "no data" placeholder as its single
 * item — and that placeholder is a `.v-list-item` like any other, so opening the menu the moment the
 * dialog is up reads back `["Žiadne dostupné dáta"]` instead of the playlists. Reopening until the
 * placeholder is gone is what waits that fetch out.
 */
export async function distributionFieldOptions(page: Page, dialog: Locator, label: string): Promise<string[]> {
  let titles: string[] = []
  await expect(async () => {
    await distributionField(dialog, label).click()
    const options = page.locator('.v-overlay--active .v-list-item')
    await expect(options.first()).toBeVisible()
    titles = (await options.allInnerTexts()).map((title) => title.trim())
    await page.keyboard.press('Escape')
    await expect(options).toHaveCount(0)
    expect(titles, `options of "${label}"`).not.toEqual([NO_OPTIONS])
  }).toPass({ timeout: 30000 })
  return titles
}

/** Pick `option` in a select of the distribution dialog. */
export async function pickDistributionOption(
  page: Page,
  dialog: Locator,
  label: string,
  option: string
): Promise<void> {
  await distributionField(dialog, label).click()
  const item = page.locator('.v-overlay--active .v-list-item').filter({ hasText: option }).first()
  await expect(item).toBeVisible()
  await item.click()
  await expect(distributionField(dialog, label)).toContainText(option)
}

/**
 * Pick `option` in a select whose menu only renders a window of its items — the language select offers 83,
 * so an option further down never exists in the DOM for a plain text-filtered click to find.
 */
export async function pickLongDistributionOption(
  page: Page,
  dialog: Locator,
  label: string,
  option: string
): Promise<void> {
  await pickVirtualizedOption(page, distributionField(dialog, label).getByRole('combobox').first(), option)
  await expect(distributionField(dialog, label)).toContainText(option)
}

// --- advanced management ------------------------------------------------------------------------------

const SHOW_ADVANCED = 'Zobraziť pokročilú správu distribúcií'
const HIDE_ADVANCED = 'Skryť pokročilú správu distribúcií'

/** The advanced management toggle under the distribution list. */
export function advancedToggle(page: Page, shown = false): Locator {
  return page.locator('.sidebar-info').getByRole('button', { name: shown ? HIDE_ADVANCED : SHOW_ADVANCED })
}

/** Open the advanced distribution management panel, which is collapsed on every load. */
export async function openAdvancedDistributions(page: Page): Promise<void> {
  await closeAlerts(page)
  await advancedToggle(page).click()
  await expect(advancedToggle(page, true)).toBeVisible()
  await expect(visibleCy(page, 'button-add-distribution')).toBeVisible()
}

/** Collapse the advanced distribution management panel. */
export async function closeAdvancedDistributions(page: Page): Promise<void> {
  await advancedToggle(page, true).click()
  await expect(advancedToggle(page)).toBeVisible()
  await expect(page.locator('[data-cy="button-add-distribution"]')).toHaveCount(0)
}

export interface AdvancedDistributionData {
  /** The service as the JW/YouTube sub-form names it, e.g. `JwVideo` — the *global* config title. */
  service?: string
  extId?: string
  status?: DistributionStatusValue
  /** Required by the JW sub-form, including when only the status is being changed. */
  directSourceUrl?: string
}

/**
 * Fill the open create/edit dialog of the advanced panel and confirm it, waiting for the upsert.
 *
 * `PATCH /distribution` writes the record as given — status included — without calling the provider, which
 * is what makes a `failed` distribution reproducible in a test. It is also the only writer of `extId`.
 */
async function submitAdvancedDialog(
  page: Page,
  dialog: Locator,
  data: AdvancedDistributionData,
  confirm: string
): Promise<void> {
  if (data.service) await pickDistributionOption(page, dialog, 'Názov distribučnej služby', data.service)
  if (data.extId) await distributionField(dialog, 'Externé ID').locator('input').first().fill(data.extId)
  if (data.status) await pickDistributionOption(page, dialog, 'Stav', DISTRIBUTION_STATUS[data.status])
  // The JW sub-form marks this required, so an edit that only flips the status still has to fill it — a
  // distribution created by a real distribute carries no direct source url.
  if (data.directSourceUrl) {
    await distributionField(dialog, 'Priama linka na video').locator('input').first().fill(data.directSourceUrl)
  }

  const upserted = page.waitForResponse(
    (response) => response.request().method() === 'PATCH' && response.url().endsWith('/distribution')
  )
  await dialog.getByRole('button', { name: confirm, exact: true }).click()
  const response = await upserted
  expect(response.ok(), `PATCH /distribution responds ${response.status()}`).toBeTruthy()
  await expect(dialog).toBeHidden()
}

/** Create a distribution through the advanced panel's "Vytvoriť distribúciu". */
export async function createAdvancedDistribution(page: Page, data: AdvancedDistributionData): Promise<void> {
  await visibleCy(page, 'button-add-distribution').click()
  const dialog = page.getByRole('dialog').filter({ hasText: 'Vytvoriť distribúciu' }).first()
  await expect(dialog).toBeVisible()
  await submitAdvancedDialog(page, dialog, data, 'Vytvoriť')
}

/** Edit the first distribution of the advanced panel through its pencil. */
export async function editAdvancedDistribution(page: Page, data: AdvancedDistributionData): Promise<void> {
  await page.locator('.sidebar-info .mdi-pencil-outline').first().click()
  const dialog = page.getByRole('dialog').filter({ hasText: 'Upraviť distribúciu' }).first()
  await expect(dialog).toBeVisible()
  // The resource type cannot be changed on an existing record, so the editor drops that select.
  await expect(dialog.getByText('Vytvoriť distribúciu')).toHaveCount(0)
  await submitAdvancedDialog(page, dialog, data, 'Potvrdiť')
}

/**
 * Delete the first distribution of the advanced panel through its trash button.
 *
 * The confirm is the shared list-editor dialog — `Zmazať položku?` with a `Zmazať` button, **not** the
 * `Potvrdiť` every other dialog here uses — and it blocks the page until it is answered.
 */
export async function deleteAdvancedDistribution(page: Page): Promise<void> {
  await page.locator('.sidebar-info .mdi-trash-can-outline').first().click()
  const confirm = page.getByRole('dialog').filter({ hasText: 'Zmazať položku?' }).first()
  await expect(confirm).toBeVisible()

  const deleted = page.waitForResponse(
    (response) => response.request().method() === 'DELETE' && /\/distribution\/[^/]+$/.test(response.url())
  )
  await confirm.getByRole('button', { name: 'Zmazať', exact: true }).click()
  const response = await deleted
  expect(response.status(), `DELETE ${response.url()}`).toBe(204)
}

/**
 * Open the coreDam app logs. The system is a route segment, not a select: `/logs` on its own no
 * longer resolves, and the table is there on arrival rather than after picking a system.
 */
export async function showCoreDamLogs(page: Page): Promise<void> {
  await page.goto('/logs/dam/app')
  await cardLoad(page)
  await expect(page.locator('main .v-table').first()).toBeVisible()
}
