import { type Page, expect } from '@playwright/test'
import { alertMessage, cardLoad, filterBy } from '@pages/shared/admin'
import { ALERT_CREATE, CORE_DAM_API, LICENCE_ID } from '@pages/shared/constants'
import { detailValue } from '@pages/settings/jobPage'
import { visibleCy } from '@pages/shared/crud'
import { metadataTextarea, openAssetDetail, openAssetTab, saveAssetTitle } from '@pages/assets/assetDetailPage'

export interface PodcastEpisodeAsset {
  assetId: string
  podcastId: string
  title: string
}

/**
 * An audio asset the podcast synchronizer imported from an RSS feed. Takes the ninth newest one, as the original suite did, so the
 * pick stays clear of an episode the scheduled synchronizer may be importing right now.
 */
export async function findImportedEpisodeAsset(page: Page): Promise<PodcastEpisodeAsset> {
  const params = new URLSearchParams({
    limit: '10',
    offset: '0',
    'order[createdAt]': 'desc',
    type: 'audio',
    status: 'with_file',
    visible: 'true',
    generatedBySystem: 'false',
    inPodcast: 'true',
    fromRss: 'true',
    licences: LICENCE_ID,
  })
  const response = await page.request.get(`${CORE_DAM_API}/asset/licence/search?${params}`)
  expect(response.ok(), 'podcast asset search').toBeTruthy()
  const { data } = await response.json()
  expect(data.length, 'imported podcast episode assets').toBeGreaterThan(0)
  const asset = data[Math.min(8, data.length - 1)]
  return { assetId: asset.id, podcastId: asset.podcasts[0], title: asset.texts.displayTitle }
}

/** Title of a podcast, from the API. */
export async function podcastTitle(page: Page, podcastId: string): Promise<string> {
  const response = await page.request.get(`${CORE_DAM_API}/podcast/${podcastId}`)
  expect(response.ok(), `GET podcast/${podcastId}`).toBeTruthy()
  return (await response.json()).texts.title
}

/** Remove the asset from its podcast episode through the asset's podcast tab. */
export async function removeAssetFromPodcast(page: Page, assetId: string): Promise<void> {
  await openAssetTab(page, assetId, 'button-podcast')
  await page.locator('.sidebar-info [data-cy="button-delete"]').first().click()
  await visibleCy(page, 'button-confirm-delete').click()
  await expect(page.locator('.sidebar-info [data-cy="button-delete"]')).toHaveCount(0)
}

/** Set the asset title in the detail form and save it. */
export async function setAssetTitle(page: Page, assetId: string, title: string): Promise<void> {
  await openAssetDetail(page, assetId)
  await saveAssetTitle(page, title)
  await expect(metadataTextarea(page, 'title')).toHaveValue(title)
}

/** Add the asset to a new episode of `podcast` (searched by title) through the podcast tab. */
export async function addAssetToNewEpisode(page: Page, assetId: string, podcast: string, title: string): Promise<void> {
  await openAssetTab(page, assetId, 'button-podcast')
  await visibleCy(page, 'button-add-new-podcast-episode').click()
  const dialog = page.getByRole('dialog').filter({ hasText: 'Pridať asset do novej podcastovej epizódy' })
  const podcastInput = dialog.locator('[data-cy="field-choose-podcast"] input')
  await podcastInput.click()
  await podcastInput.fill(podcast)
  await page.locator('.v-menu.v-overlay--active .v-list-item').filter({ hasText: podcast }).first().click()
  await dialog
    .locator('[data-cy="field-title-podcast"] input, [data-cy="field-title-podcast"] textarea')
    .first()
    .fill(title)
  await dialog.locator('[data-cy="button-add"]').click()
  await alertMessage(page, ALERT_CREATE)
  await expect(page.locator('.sidebar-info .v-chip').filter({ hasText: podcast })).toBeVisible()
}

/** Assert the "Povolené na webe" and "Povolené v appke" flags of the podcast episode titled `title`. */
export async function expectEpisodeFlags(page: Page, podcastId: string, title: string, value: 'áno' | 'nie') {
  await page.goto(`/podcasts/${podcastId}`)
  await cardLoad(page)
  await visibleCy(page, 'episode-list').click()
  await cardLoad(page)
  // Episodes list oldest first, so a new one sits on the last page — find it by title instead.
  await filterBy(page, 'Nadpis', title)
  await page
    .locator('tbody tr')
    .filter({ has: page.locator('td').getByText(title, { exact: true }) })
    .first()
    .locator('[data-cy="table-detail"]')
    .click()
  await cardLoad(page)
  await expect(detailValue(page, 'Povolené na webe')).toContainText(value)
  await expect(detailValue(page, 'Povolené v appke')).toContainText(value)
}
