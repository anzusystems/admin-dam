import { type Locator, type Page, expect } from '@playwright/test'
import { cardLoad, closeAlerts } from '@pages/shared/admin'
import { URL_DOMAIN, URL_PROTO } from '@pages/shared/constants'

/** admin-cms, reachable with the session of the DAM force-login (both admins share the sso cookie). */
export const CMS_BASE_URL = `${URL_PROTO}://admin-cms.${URL_DOMAIN}`
const CORE_CMS_API = `${URL_PROTO}://core-cms.${URL_DOMAIN}/api/adm/v1`
const WEB_BASE_URL = `${URL_PROTO}://www.${URL_DOMAIN}`

/** Shown on an embed, or the main media, whose DAM asset cannot be played on the web yet. */
export const MEDIA_NOT_PLAYABLE = 'Mediálny obsah sa zatiaľ neprehrá na webe. Skontrolujte distribúciu.'

export interface CmsArticle {
  /** Numeric article id — what the `/article-kind` endpoints take. */
  id: string
  /** Document UUID — what the web redirect takes. */
  docId: string
}

export type DamMediaKind = 'audio' | 'video'

/**
 * Create a standard article through the admin-cms create dialog, under the "Svet" desk and rubric, and save it
 * once. Returns its ids from the create response.
 */
export async function createCmsArticle(page: Page, title: string): Promise<CmsArticle> {
  await page.goto(`${CMS_BASE_URL}/articles`)
  await cardLoad(page)
  await page.locator('header .v-btn').filter({ hasText: 'Vytvoriť' }).first().click()
  const dialog = page.getByRole('dialog').filter({ has: page.getByRole('combobox', { name: 'Desk/Tím' }) })
  await expect(dialog).toBeVisible()

  await pickAutocomplete(page, dialog.getByRole('combobox', { name: 'Desk/Tím' }), 'Sv', 'Svet')
  await pickAutocomplete(page, dialog.getByRole('combobox', { name: 'Rubrika' }), 'Sv', 'Svet')
  await dialog.getByRole('textbox', { name: 'Titulok' }).fill(title)
  // Every intention category has to be answered.
  for (const intention of ['Zachytenie vývoja', 'Rozhovor', 'Spoj ma']) {
    await dialog.locator('.v-chip').filter({ hasText: intention }).click()
  }

  const created = page.waitForResponse(
    (response) => response.request().method() === 'POST' && response.url() === `${CORE_CMS_API}/article-kind/standard`
  )
  await dialog.getByRole('button', { name: 'Vytvoriť' }).click()
  const response = await created
  expect(response.status(), 'article create').toBe(201)
  const body = await response.json()
  await page.waitForURL(/\/articles\/.+\/edit$/)
  await cardLoad(page)
  await saveCmsArticle(page)
  return { id: String(body.id), docId: String(body.docId) }
}

async function pickAutocomplete(page: Page, combobox: Locator, search: string, option: string): Promise<void> {
  await combobox.fill(search)
  await page.getByRole('option', { name: option, exact: true }).click()
}

/** Open the edit view of an article. */
export async function openCmsArticleEdit(page: Page, articleId: string): Promise<void> {
  await page.goto(`${CMS_BASE_URL}/articles/${articleId}/edit`)
  await cardLoad(page)
  await expect(page.locator('#anzu-actionbar').getByRole('button', { name: 'Uložiť' })).toBeVisible()
}

/**
 * Open an article on its detail view — where a published article lands — and wait until its body and main media
 * both render the DAM asset titled `assetTitle`.
 */
export async function openCmsArticleDetail(page: Page, articleId: string, assetTitle: string): Promise<void> {
  await page.goto(`${CMS_BASE_URL}/articles/${articleId}`)
  await cardLoad(page)
  await expect(page.getByText(`Titulok: ${assetTitle}`, { exact: true })).toHaveCount(2)
}

/** Save the article from the action bar and wait for the update to be stored. */
export async function saveCmsArticle(page: Page): Promise<void> {
  await closeAlerts(page)
  const saved = page.waitForResponse(
    (response) =>
      response.request().method() === 'PUT' && response.url().startsWith(`${CORE_CMS_API}/article-kind/standard/`)
  )
  await page.locator('#anzu-actionbar .v-btn').filter({ hasText: 'Uložiť' }).click()
  expect((await saved).ok(), 'article save').toBeTruthy()
}

function isDamAssetSearch(url: string): boolean {
  return url.startsWith(`${URL_PROTO}://core-dam.${URL_DOMAIN}/api/adm/v1/asset/licence/`) && url.includes('/search?')
}

/**
 * Pick the DAM asset `assetId` in the open DAM asset picker — filtered by its id, so the pick does not depend
 * on list order — and confirm it.
 */
async function pickDamAsset(page: Page, assetId: string): Promise<void> {
  const picker = page.locator('.v-overlay--active').filter({ has: page.locator('.subject-select__actions') })
  const idFilter = picker.getByRole('textbox', { name: 'Id', exact: true })
  const filtered = page.waitForResponse(
    (response) => isDamAssetSearch(response.url()) && response.url().includes(assetId)
  )
  await idFilter.fill(assetId)
  await idFilter.press('Enter')
  await filtered
  const tiles = picker.locator('.asset-list-tiles__item-card')
  await expect(tiles).toHaveCount(1)
  await tiles.first().click()
  await picker.locator('.subject-select__actions .v-btn').filter({ hasText: 'Potvrdiť' }).click()
}

/** Insert an audio or video embed of the DAM asset `assetId` into the article body through the editor toolbar. */
export async function embedDamMedia(page: Page, kind: DamMediaKind, assetId: string): Promise<void> {
  await page
    .locator(`.anzutap .${kind === 'audio' ? 'mdi-headphones' : 'mdi-video'}`)
    .first()
    .click()
  const dialog = page
    .getByRole('dialog')
    .filter({ hasText: kind === 'audio' ? 'Audio' : 'Video' })
    .last()
  await dialog.getByRole('button', { name: kind === 'audio' ? 'Vybrať audio' : 'Vybrať video' }).click()
  await pickDamAsset(page, assetId)
  // The dialog now previews the picked asset; its confirm inserts the embed.
  const confirm = dialog.getByRole('button', { name: 'Potvrdiť' })
  await expect(dialog.getByText(assetId)).toBeVisible()
  await expect(async () => {
    if (await confirm.isVisible()) await confirm.click()
    await expect(page.locator(`.anzutap-embed-${kind}`)).toHaveCount(1, { timeout: 3000 })
  }).toPass({ timeout: 20000 })
  await expect(dialog).toBeHidden()
}

/** Set the article's main media ("Hlavný mediálny obsah") to the DAM asset `assetId`. */
export async function setMainMediaFromDam(page: Page, kind: DamMediaKind, assetId: string): Promise<void> {
  const widget = page.locator('.article-layout__top-right .a-image-widget').first()
  await widget.hover()
  await widget.locator('.mdi-dots-horizontal').first().click()
  await page.locator('.v-overlay--active .v-list-item').filter({ hasText: 'Pridať z DAM' }).click()
  // The picker opens on images; podcast episodes and videos have their own type buttons.
  const typeIcon = kind === 'audio' ? '.mdi-podcast' : '.mdi-video'
  // The type switch reloads the list; filtering before that reload lands lets it overwrite the filtered result.
  const typeLoaded = page.waitForResponse(
    (response) => isDamAssetSearch(response.url()) && response.url().includes(`type=${kind}`)
  )
  await page.locator(`.v-overlay--active .v-btn:has(${typeIcon})`).first().click()
  await typeLoaded
  await pickDamAsset(page, assetId)
  const mediaDialog = page.getByRole('dialog').filter({ hasText: 'Upraviť médium' })
  await mediaDialog.getByRole('button', { name: 'Potvrdiť' }).click()
  await expect(mediaDialog).toBeHidden()
}

/** The "not playable yet" warnings of the body embed and of the main media. */
export function mediaWarnings(page: Page): Locator {
  return page.locator('.text-warning').filter({ hasText: MEDIA_NOT_PLAYABLE })
}

/** Publish the article from the action bar and wait until the API reports it published. */
export async function publishCmsArticle(page: Page, articleId: string): Promise<void> {
  await closeAlerts(page)
  await page.locator('.a-button-split__main').filter({ hasText: 'Publikovať' }).click()
  await expect
    .poll(async () => (await (await page.request.get(`${CORE_CMS_API}/article-kind/${articleId}`)).json()).status, {
      timeout: 120000,
      intervals: [3000],
    })
    .toBe('published')
}

/**
 * Purge the web cache of an article from its detail view. The web renders an article once and does not re-render
 * it when an embedded DAM asset becomes playable later, so the players only appear after a purge.
 */
export async function purgeCmsArticleCache(page: Page, articleId: string): Promise<void> {
  await page.goto(`${CMS_BASE_URL}/articles/${articleId}`)
  await cardLoad(page)
  const purged = page.waitForResponse(
    (response) => response.url() === `${CORE_CMS_API}/article-kind/standard/${articleId}/cache-purge`
  )
  await page.locator('.article-topbar .mdi-delete-sweep').click()
  await page.locator('.v-overlay--active .v-btn').filter({ hasText: 'Áno, potvrdiť' }).click()
  expect((await purged).status(), 'article cache purge').toBe(204)
}

/**
 * Open the article on the public web and wait until it renders two media players — the body embed and the main
 * media. Reloads between checks, as the web keeps serving a cached render for a while.
 */
export async function expectPlayableOnWeb(page: Page, article: CmsArticle): Promise<void> {
  await expect(async () => {
    await page.goto(`${WEB_BASE_URL}/_c/redirect/${article.docId}`)
    await expect(page.locator('.js-media-playback')).toHaveCount(2, { timeout: 10000 })
  }).toPass({ timeout: 3 * 60 * 1000, intervals: [15000] })
}

/**
 * Delete every article titled `title`, published ones included: a published article has to go back to draft
 * before it can be deleted, and publishing leaves more than one `article-kind` record for the same document.
 * Best effort — cleanup only.
 */
export async function deleteCmsArticlesViaApi(page: Page, title: string): Promise<void> {
  const search = `${CORE_CMS_API}/article-kind/search?limit=50&offset=0&order[score_date]=desc&text=${encodeURIComponent(title)}`
  const response = await page.request.get(search).catch(() => null)
  if (!response?.ok()) return
  const rows = ((await response.json()).data ?? []) as { id: number; texts?: { headline?: string } }[]
  for (const row of rows.filter((candidate) => candidate.texts?.headline === title)) {
    await page.request.patch(`${CORE_CMS_API}/article-kind/${row.id}/status/draft`).catch(() => {})
    await page.request.delete(`${CORE_CMS_API}/article-kind/${row.id}`).catch(() => {})
  }
}
