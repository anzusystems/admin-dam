import { type Page, type Response, expect } from '@playwright/test'
import { ALERT_CREATE, CORE_DAM_API } from '@pages/shared/constants'
import { clickForAlert } from '@pages/shared/admin'
import { visibleCy } from '@pages/shared/crud'

export interface PodcastEpisodeData {
  title: string
  description: string
  seasonNumber: string
  episodeNumber: string
}

/** Id of the record created by a POST to `/<resource>`. */
async function createdId(page: Page, resource: string, action: () => Promise<void>): Promise<string> {
  const created = page.waitForResponse(
    (response: Response) => response.request().method() === 'POST' && response.url() === `${CORE_DAM_API}/${resource}`
  )
  await action()
  const response = await created
  expect(response.ok(), `POST ${resource} responds ${response.status()}`).toBeTruthy()
  return String((await response.json()).id)
}

/** Pick an option of the combobox inside a dialog — the first one when `option` is omitted. */
async function pickFromCombobox(page: Page, dataCy: string, option?: string): Promise<string> {
  await page.locator(`.v-overlay--active [data-cy="${dataCy}"]`).click()
  const options = page.getByRole('option')
  const target = option ? options.filter({ hasText: option }).first() : options.first()
  await expect(target).toBeVisible()
  const name = ((await target.textContent()) ?? '').trim()
  await target.click()
  return name
}

/**
 * From the podcast tab of an audio asset, add the asset to a new episode of the first podcast offered.
 * Returns the created episode id.
 */
export async function addAssetToNewPodcastEpisode(page: Page, data: PodcastEpisodeData): Promise<string> {
  await visibleCy(page, 'button-podcast').click()
  await visibleCy(page, 'button-add-new-podcast-episode').click()
  const dialog = page.getByRole('dialog').filter({ has: page.locator('[data-cy="field-choose-podcast"]') })
  await expect(dialog).toBeVisible()
  // Podcasts cannot be deleted, so the episode goes to an existing one and is removed again by the spec.
  await pickFromCombobox(page, 'field-choose-podcast')
  await dialog.getByRole('textbox', { name: 'Nadpis' }).fill(data.title)
  await dialog.getByRole('textbox', { name: 'Popis' }).fill(data.description)
  await dialog.getByRole('spinbutton', { name: 'Číslo sezóny' }).fill(data.seasonNumber)
  await dialog.getByRole('spinbutton', { name: 'Číslo epizódy' }).fill(data.episodeNumber)
  const id = await createdId(page, 'podcast-episode', () =>
    clickForAlert(page, dialog.locator('[data-cy="button-add"]'), ALERT_CREATE)
  )
  await expect(dialog).toBeHidden()
  return id
}

/** The podcast tab lists the episode with `title`. */
export async function expectPodcastEpisodeListed(page: Page, title: string): Promise<void> {
  await visibleCy(page, 'button-podcast').click()
  await expect(page.getByText(title, { exact: true })).toBeVisible()
}

/** Remove the asset's only podcast episode from the podcast tab, checking the confirmation dialog buttons. */
export async function deletePodcastEpisodeFromTab(page: Page): Promise<void> {
  await visibleCy(page, 'button-podcast').click()
  await visibleCy(page, 'button-delete').click()
  const dialog = page.getByRole('dialog').filter({ has: page.locator('[data-cy="button-confirm-delete"]') })
  await expect(dialog.locator('[data-cy="button-cancel"]')).toBeVisible()
  await expect(dialog.locator('[data-cy="button-close"]')).toBeVisible()
  await dialog.locator('[data-cy="button-confirm-delete"]').click()
  await expect(dialog).toBeHidden()
  await expectNothingInTab(page)
}

/** The active sidebar tab shows the empty state. */
export async function expectNothingInTab(page: Page): Promise<void> {
  await expect(page.getByText('Nie je čo zobraziť').filter({ visible: true })).toBeVisible()
}

/**
 * From the video show tab of a video asset, add the asset to a new episode of the video show `videoShowTitle`.
 * Returns the created episode id.
 */
export async function addAssetToNewVideoShowEpisode(
  page: Page,
  videoShowTitle: string,
  title: string
): Promise<string> {
  await visibleCy(page, 'button-video-show').click()
  await visibleCy(page, 'button-add-new-vs-episode').click()
  const dialog = page.getByRole('dialog').filter({ has: page.locator('[data-cy="field-choose-video-show"]') })
  await expect(dialog).toBeVisible()
  await page.locator('.v-overlay--active [data-cy="field-choose-video-show"] input').fill(videoShowTitle)
  await pickFromCombobox(page, 'field-choose-video-show', videoShowTitle)
  await dialog.locator('[data-cy="field-title-episode"] textarea').first().fill(title)
  const id = await createdId(page, 'video-show-episode', () =>
    clickForAlert(page, dialog.locator('[data-cy="button-add"]'), ALERT_CREATE)
  )
  await expect(dialog).toBeHidden()
  return id
}

/** The video show tab lists the episode with `title`. */
export async function expectVideoShowEpisodeListed(page: Page, title: string): Promise<void> {
  await visibleCy(page, 'button-video-show').click()
  await expect(page.getByText(title, { exact: true })).toBeVisible()
}
