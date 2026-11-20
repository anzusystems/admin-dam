import { type Locator, type Page, type Response, expect } from '@playwright/test'
import { ALERT_UPDATE, CORE_DAM_API } from '@pages/shared/constants'
import { cardLoad, clickForAlert } from '@pages/shared/admin'
import { pickOption, visibleCy } from '@pages/shared/crud'
import { downloadLink } from '@pages/shared/api'

export interface AssetTexts {
  title: string
  description: string
}

/** Keywords and authors the metadata form created on the fly, so a spec can delete them afterwards. */
export interface CreatedMetadataRecords {
  keywordIds: string[]
  authorIds: string[]
}

/**
 * The asset detail sidebar. Metadata fields are scoped to it: when a detail is opened from the list, the list keeps
 * its own metadata form mounted underneath, and typing into that one leaves the detail unsaved.
 */
export function detailSidebar(page: Page): Locator {
  return page.locator('.dam-image-detail__sidebar')
}

/** The visible content of the detail sidebar (the current tab). */
export function sidebarContent(page: Page): Locator {
  return page.locator('.sidebar-info__content').filter({ visible: true }).first()
}

/**
 * Open an asset detail and wait until the asset is fetched and rendered — the metadata form renders before that,
 * and the fetched values overwrite anything typed earlier.
 */
export async function openAssetDetail(page: Page, assetId: string): Promise<void> {
  const loaded = page.waitForResponse(
    (response: Response) =>
      response.request().method() === 'GET' && response.url() === `${CORE_DAM_API}/asset/${assetId}`
  )
  await page.goto(`/assets/${assetId}`)
  await loaded
  await cardLoad(page)
  await expect(detailSidebar(page)).toBeVisible()
  await expect(visibleCy(page, 'copy-text')).toHaveText(assetId)
  await expect(metadataField(page, 'description')).toBeVisible()
}

/** Open a sidebar tab (button-meta, button-slots, button-podcast, ...) of the shown detail and wait for it to load. */
export async function openSidebarTab(page: Page, tab: string): Promise<void> {
  await visibleCy(page, tab).click()
  await expect(page.locator('.sidebar-info .v-progress-circular')).toHaveCount(0, { timeout: 15000 })
}

/** Open an asset detail on the given sidebar tab. */
export async function openAssetTab(page: Page, assetId: string, tab: string): Promise<void> {
  await openAssetDetail(page, assetId)
  await openSidebarTab(page, tab)
}

/** The wrapper of a custom metadata field of the detail, e.g. `title`, `description`, `keywords`, `authors`. */
export function metadataField(page: Page, name: string): Locator {
  return detailSidebar(page).locator(`[data-cy="custom-field-${name}"]`).filter({ visible: true }).first()
}

/** The editable textarea of a text metadata field (a second one is Vuetify's hidden autosize sizer). */
export function metadataTextarea(page: Page, name: string): Locator {
  return metadataField(page, name).locator('textarea').first()
}

/**
 * Make a metadata field visible. Image details collapse the less used fields (title, location, ...) behind
 * "Zobraziť viac detailov"; other types show them right away, and then this does nothing.
 */
export async function revealMetadataField(page: Page, name: string): Promise<void> {
  const field = detailSidebar(page).locator(`[data-cy="custom-field-${name}"]`)
  if (!(await field.first().isVisible())) {
    await detailSidebar(page)
      .getByRole('button', { name: /^Zobraziť viac/ })
      .first()
      .click()
  }
  await expect(metadataField(page, name)).toBeVisible()
}

/** Expand the collapsed image metadata ("Zobraziť viac detailov"). */
export async function showMoreDetails(page: Page): Promise<void> {
  await revealMetadataField(page, 'title')
}

/** Replace the text of a textarea metadata field; an empty `value` clears it. */
export async function fillMetadataText(page: Page, name: string, value: string): Promise<void> {
  await revealMetadataField(page, name)
  await metadataTextarea(page, name).fill(value)
}

/** Fill the title and description of the metadata form. */
export async function fillTexts(page: Page, data: AssetTexts): Promise<void> {
  await fillMetadataText(page, 'title', data.title)
  await fillMetadataText(page, 'description', data.description)
}

/** Reopen the asset and assert the saved title and description. */
export async function expectSavedTexts(page: Page, assetId: string, data: AssetTexts): Promise<void> {
  await openAssetDetail(page, assetId)
  await revealMetadataField(page, 'title')
  await expect(metadataTextarea(page, 'title')).toHaveValue(data.title)
  await expect(metadataTextarea(page, 'description')).toHaveValue(data.description)
}

/** Save the metadata form from the detail sidebar actions and wait for the update alert. */
export async function saveMetadata(page: Page): Promise<void> {
  await clickForAlert(page, visibleCy(page.locator('#anzu-asset-detail-sidebar-actions'), 'button-save'), ALERT_UPDATE)
}

/** Fill the title of the shown asset and save it. */
export async function saveAssetTitle(page: Page, title: string): Promise<void> {
  await fillMetadataText(page, 'title', title)
  await saveMetadata(page)
}

/**
 * Id of the record the next POST to `/<resource>` creates — the metadata form creates keywords and
 * authors inline, and so does the bulk editor's mass operations form.
 */
export function createdId(page: Page, resource: string): Promise<string> {
  return page
    .waitForResponse(
      (response: Response) => response.request().method() === 'POST' && response.url() === `${CORE_DAM_API}/${resource}`
    )
    .then(async (response) => {
      expect(response.ok(), `POST ${resource} responds ${response.status()}`).toBeTruthy()
      return String((await response.json()).id)
    })
}

/** Type a new keyword into the keywords field and create it from the suggestion's "add" button. Returns its id. */
export async function addNewKeyword(page: Page, name: string): Promise<string> {
  await metadataField(page, 'keywords').locator('input').fill(name)
  const created = createdId(page, 'keyword')
  await page.getByRole('option', { name }).getByRole('button', { name }).click()
  const id = await created
  await expect(metadataField(page, 'keywords').locator('.v-chip')).toContainText([name])
  await page.keyboard.press('Escape')
  return id
}

/** Create an author through the "+" next to the authors field; the app attaches it right away. Returns its id. */
export async function addNewAuthor(page: Page, name: string): Promise<string> {
  await visibleCy(page, 'add-author').click()
  const dialog = page.getByRole('dialog').filter({ has: page.locator('[data-cy="author-name"]') })
  await dialog.locator('[data-cy="author-name"] input').fill(name)
  const created = createdId(page, 'author')
  await dialog.locator('[data-cy="button-confirm"]').click()
  const id = await created
  await expect(dialog).toBeHidden()
  await expect(metadataField(page, 'authors').locator('.v-chip')).toContainText([name])
  return id
}

/** Remove every chip of a keywords/authors field with its clear icon. */
export async function clearChips(page: Page, name: string): Promise<void> {
  await metadataField(page, name).locator('.mdi-close-circle').first().click()
  await expect(metadataField(page, name).locator('.v-chip')).toHaveCount(0)
}

/** Empty the title and description and clear the keywords and authors fields. */
export async function clearMetadata(page: Page): Promise<void> {
  await fillTexts(page, { title: '', description: '' })
  await clearChips(page, 'keywords')
  await clearChips(page, 'authors')
}

/** Best-effort API cleanup of the keywords and authors the metadata form created. */
export async function cleanupMetadataRecords(page: Page, created: CreatedMetadataRecords): Promise<void> {
  for (const id of created.keywordIds) {
    await page.request.delete(`${CORE_DAM_API}/keyword/${id}`).catch(() => {})
  }
  for (const id of created.authorIds) {
    await page.request.delete(`${CORE_DAM_API}/author/${id}`).catch(() => {})
  }
}

/** Open the delete confirmation from the sidebar actions, check it and cancel it without deleting. */
export async function openAndCancelDelete(page: Page): Promise<void> {
  await visibleCy(page, 'button-delete').click()
  const dialog = page.getByRole('dialog').filter({ has: page.locator('[data-cy="button-confirm-delete"]') })
  await expect(dialog.locator('[data-cy="button-confirm-delete"]')).toBeVisible()
  await expect(dialog.locator('[data-cy="button-close"]')).toBeVisible()
  await dialog.locator('[data-cy="button-cancel"]').click()
  await expect(dialog).toBeHidden()
}

/** Open the download dialog from the sidebar actions, check it offers the original file and close it. */
export async function openAndCancelDownload(page: Page): Promise<void> {
  await visibleCy(page, 'button-download').click()
  const dialog = page.getByRole('dialog').filter({ has: page.locator('[data-cy="button-download-file"]') })
  await expect(dialog.locator('[data-cy="button-download-file"]')).toBeVisible()
  await expect(dialog.locator('[data-cy="button-close"]')).toBeVisible()
  await dialog.locator('[data-cy="button-cancel"]').click()
  await expect(dialog).toBeHidden()
}

/** Assert the detail sidebar offers these tabs (by data-cy). */
export async function expectDetailTabs(page: Page, tabs: string[]): Promise<void> {
  for (const tab of tabs) {
    await expect(visibleCy(page, tab)).toBeVisible()
  }
}

/**
 * Open the download dialog from the detail sidebar actions and wait for the first signed link to land.
 *
 * The dialog offers the file of whichever slot its picker shows, starting at the asset's main file, and the
 * `…/download-link` answer is the only place the id of that file is visible.
 */
export async function openDownloadDialog(page: Page): Promise<{ dialog: Locator; file: { id: string; link: string } }> {
  const linked = downloadLink(page)
  await visibleCy(page, 'button-download').click()
  const file = await linked
  const dialog = downloadDialog(page)
  await expect(dialog.locator('[data-cy="button-download-file"]')).toHaveAttribute('href', file.link)
  return { dialog, file }
}

/**
 * The download dialog, pinned by the download button it holds. That button is not rendered while the signed
 * link is still being fetched, so the filter resolves only once the link has landed — which is exactly when
 * a caller has something to assert.
 */
export function downloadDialog(page: Page): Locator {
  return page.getByRole('dialog').filter({ has: page.locator('[data-cy="button-download-file"]') })
}

/** The slots the download dialog's picker offers. Only slots that actually hold a file are listed. */
export async function downloadDialogSlots(page: Page): Promise<string[]> {
  await downloadDialog(page).getByRole('combobox').first().click()
  // `allInnerTexts` reads once, and the menu opens a beat after the click — read too early, it is empty.
  const options = page.getByRole('option')
  await expect(options.first()).toBeVisible()
  const slots = (await options.allInnerTexts()).map((slot) => slot.trim())
  await page.keyboard.press('Escape')
  return slots
}

/** Switch the download dialog to `slot` and return the file it then offers. */
export async function chooseDownloadSlot(page: Page, slot: string): Promise<{ id: string; link: string }> {
  const dialog = downloadDialog(page)
  const linked = downloadLink(page)
  await pickOption(page, dialog.getByRole('combobox').first(), slot)
  const file = await linked
  await expect(dialog.locator('[data-cy="button-download-file"]')).toHaveAttribute('href', file.link)
  return file
}

// "Fókus" tab (region of interest)

/** The crop previews of the "Fókus" tab — one per configured ratio, each titled with that ratio. */
function roiPreviews(page: Page): Locator {
  return detailSidebar(page).locator('.crop-preview > div')
}

/** The ratio titles of the crop previews, e.g. `["3:2", "1:1"]`. */
export async function roiPreviewTitles(page: Page): Promise<string[]> {
  await expect(roiPreviews(page).first()).toBeVisible()
  return (await roiPreviews(page).locator('.text-label-large').allInnerTexts()).map((title) => title.trim())
}

/** The `src` of every crop preview image, in the order they are shown. */
export function roiPreviewSources(page: Page): Promise<(string | null)[]> {
  return roiPreviews(page)
    .locator('img')
    .evaluateAll((images) => images.map((image) => image.getAttribute('src')))
}

/**
 * Assert every crop preview decoded, i.e. the image server answered each one with a picture rather than an
 * error. A broken `img` still occupies the DOM, so only `naturalWidth` tells the two apart.
 */
export async function expectRoiPreviewsLoaded(page: Page): Promise<void> {
  await expect
    .poll(
      () =>
        roiPreviews(page)
          .locator('img')
          .evaluateAll((images) => images.every((image) => (image as HTMLImageElement).naturalWidth > 0)),
      { timeout: 30000, message: 'every crop preview loads' }
    )
    .toBe(true)
}

/** Press "Znovu načítať náhľady" in the sidebar actions of the "Fókus" tab. */
export async function refreshRoiPreviews(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Znovu načítať náhľady' }).click()
}

/** Rotate the image on the "Fókus" tab, clockwise (`right`) or back (`left`). */
export async function rotateImage(page: Page, direction: 'right' | 'left'): Promise<void> {
  await clickForAlert(page, visibleCy(page, `button-rotate-${direction}`), ALERT_UPDATE)
}

/**
 * Assign the first image of the licence as the video thumbnail through the "Miniatúra" tab, then unassign it.
 * Both actions save the asset on their own.
 */
export async function assignAndUnassignThumbnail(page: Page): Promise<void> {
  await visibleCy(page, 'button-image-preview').click()
  const unassign = page.getByRole('button', { name: 'Zrušiť priradenie obrázka' })
  await expect(unassign).toBeVisible()
  await page.getByRole('button', { name: 'Vybrať obrázok' }).click()
  const picker = page.getByRole('dialog').filter({ hasText: 'Vyberte asset' })
  await picker.locator('.asset-list-tiles__item').first().click()
  await clickForAlert(page, picker.getByRole('button', { name: 'Potvrdiť' }), ALERT_UPDATE)
  await expect(picker).toBeHidden()
  await clickForAlert(page, unassign, ALERT_UPDATE)
}

// Detail lightbox

/**
 * The asset detail as the list opens it: a full-screen lightbox over the list, not a page of its own.
 * Its toolbar carries the asset's place in the list and the buttons that walk to its neighbours, and
 * the URL follows along — stepping to the next asset navigates to `/assets/<its id>`.
 */
export function lightbox(page: Page): Locator {
  return page.locator('.dam-image-detail')
}

/**
 * The "3 / 25+" position counter of the lightbox toolbar. It is pinned to the toolbar because the
 * sidebar below it is full of Vuetify's own `x / y` character counters, which read the same way.
 */
export function lightboxCounter(page: Page): Locator {
  return lightbox(page)
    .locator('header.v-toolbar .text-label-large > div')
    .filter({ hasText: /^\s*\d+\s*\/\s*\d+\+?\s*$/ })
    .first()
}

/**
 * The asset's place in the list and how many the list has loaded. The total is followed by a `+` while
 * more pages are still to come, so it is returned as the raw text too.
 */
export async function lightboxPosition(page: Page): Promise<{ index: number; total: number; text: string }> {
  const text = ((await lightboxCounter(page).textContent()) ?? '').trim()
  const match = text.match(/^(\d+)\s*\/\s*(\d+)\+?$/)
  expect(match, `lightbox counter "${text}"`).toBeTruthy()
  return { index: Number(match?.[1]), total: Number(match?.[2]), text }
}

/**
 * Step to the neighbouring asset, either with the toolbar's chevron or with the arrow key, and return
 * the position landed on. The key is pressed on the page rather than on the button, which is what a
 * user does — the lightbox listens for it globally.
 *
 * Both the counter *and* the URL are waited on. The counter trails the URL by a moment, so reading it
 * straight after the navigation returns the position of the asset just left, and a caller counting
 * steps would then be off by one without anything failing.
 *
 * At the first asset "previous" is a no-op — the chevron stays enabled and simply does nothing — so a
 * step that goes nowhere fails here rather than silently leaving the caller where it started.
 */
export async function stepLightbox(
  page: Page,
  direction: 'next' | 'previous',
  via: 'button' | 'key' = 'button'
): Promise<number> {
  const fromUrl = page.url()
  const fromIndex = (await lightboxPosition(page)).index
  const expected = direction === 'next' ? fromIndex + 1 : fromIndex - 1

  const move = async () => {
    if (via === 'button') {
      const icon = direction === 'next' ? 'mdi-chevron-right' : 'mdi-chevron-left'
      await lightbox(page).locator(`button:has(.${icon})`).first().click()
    } else {
      await page.keyboard.press(direction === 'next' ? 'ArrowRight' : 'ArrowLeft')
    }
  }

  // A step issued while the previous one is still settling is swallowed whole — the counter does not
  // move, the URL does not change and nothing is reported — so the step is repeated until the counter
  // reads the neighbour rather than issued once and waited on. Each attempt is given long enough for a
  // step that did register to show up, and only the one position counts as arriving: a swallowed step
  // and a step that overshot both fail here.
  await expect(async () => {
    if ((await lightboxPosition(page)).index === expected) return
    await move()
    await expect.poll(async () => (await lightboxPosition(page)).index, { timeout: 5000 }).toBe(expected)
  }).toPass({ timeout: 20000, intervals: [500] })

  await expect.poll(() => page.url(), { timeout: 15000 }).not.toBe(fromUrl)
  await cardLoad(page)
  return expected
}
