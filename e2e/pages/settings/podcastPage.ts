import { type Page, expect } from '@playwright/test'
import { cardLoad, filterById } from '@pages/shared/admin'
import {
  closeDetail,
  confirmCreate,
  createDialog,
  openSettingsSection,
  pickNow,
  pickOption,
  saveEdit,
  visibleCy,
} from '@pages/shared/crud'

export interface PodcastData {
  title: string
  description: string
  rssUrl: string
}

export interface EpisodeData {
  title: string
  description: string
  seasonNumber: string
  episodeNumber: string
}

/** Create a non-imported podcast from the settings section and return its id. */
export async function createPodcast(page: Page, data: PodcastData): Promise<string> {
  await openSettingsSection(page, 'podcast-settings', '/podcasts', 'Podcasty')
  await visibleCy(page, 'button-create').click()
  const dialog = createDialog(page, 'Vytvoriť podcast')
  await expect(dialog).toBeVisible()
  await dialog.getByRole('textbox', { name: 'Nadpis' }).fill(data.title)
  await dialog.getByRole('textbox', { name: 'Popis' }).fill(data.description)
  await pickOption(page, dialog.getByRole('combobox', { name: 'Mód' }), 'Neimportovaný')
  await dialog.getByRole('textbox', { name: 'RSS URL' }).fill(data.rssUrl)
  await pickNow(page, dialog, 'Import od')
  await expect(dialog.locator('[data-cy="button-cancel"]')).toBeVisible()
  return confirmCreate(page, dialog, '/podcast')
}

/** Open the podcast detail tab and check it renders the podcast id. */
export async function verifyPodcastDetail(page: Page, podcastId: string, title: string): Promise<void> {
  await page.goto(`/podcasts/${podcastId}`)
  await cardLoad(page)
  await visibleCy(page, 'podcast-list').click()
  await expect(visibleCy(page, 'podcast-id')).toHaveText(podcastId)
  await expect(page.locator('main')).toContainText(title)
  await closeDetail(page, podcastId)
  await expect(page).toHaveURL(/\/podcasts/)
}

/** Edit a podcast found through the list's id filter. */
export async function updatePodcast(page: Page, podcastId: string, data: PodcastData): Promise<void> {
  await page.goto('/podcasts')
  await filterById(page, podcastId)
  await visibleCy(page, 'table-edit').click()
  await expect(page).toHaveURL(/\/edit/)
  await cardLoad(page)
  const form = page.locator('main')
  await form.getByRole('textbox', { name: 'Nadpis' }).fill(data.title)
  await form.getByRole('textbox', { name: 'Popis' }).fill(data.description)
  await form.getByRole('textbox', { name: 'RSS URL' }).fill(data.rssUrl)
  await saveEdit(page)
  await closeDetail(page, '/edit')
}

/** Add an episode to a podcast and return its id. */
export async function createEpisode(page: Page, podcastId: string, data: EpisodeData): Promise<string> {
  await page.goto(`/podcasts/${podcastId}`)
  await visibleCy(page, 'episode-list').click()
  await visibleCy(page, 'button-create').click()
  const dialog = createDialog(page, 'Pridať epizódu')
  await expect(dialog).toBeVisible()
  await dialog.getByRole('textbox', { name: 'Nadpis' }).fill(data.title)
  await dialog.getByRole('textbox', { name: 'Popis' }).fill(data.description)
  await dialog.getByRole('spinbutton', { name: 'Číslo sezóny' }).fill(data.seasonNumber)
  await dialog.getByRole('spinbutton', { name: 'Číslo epizódy' }).fill(data.episodeNumber)
  return confirmCreate(page, dialog, '/podcast-episode')
}

/** Open an episode detail and check it renders the episode id. */
export async function verifyEpisodeDetail(page: Page, podcastId: string, episodeId: string): Promise<void> {
  await page.goto(`/podcasts/${podcastId}/episodes/${episodeId}`)
  await cardLoad(page)
  await expect(visibleCy(page, 'copy-text')).toHaveText(episodeId)
  await closeDetail(page, episodeId)
  await expect(page).toHaveURL(new RegExp(`/podcasts/${podcastId}`))
}

/** Edit an episode found through the episode list's id filter. */
export async function updateEpisode(
  page: Page,
  podcastId: string,
  episodeId: string,
  data: EpisodeData & { extId: string }
): Promise<void> {
  await page.goto(`/podcasts/${podcastId}`)
  await visibleCy(page, 'episode-list').click()
  await filterById(page, episodeId)
  await visibleCy(page, 'table-edit').click()
  await expect(page).toHaveURL(/\/edit/)
  await cardLoad(page)
  const form = page.locator('main')
  await form.getByRole('textbox', { name: 'Nadpis' }).fill(data.title)
  await form.getByRole('textbox', { name: 'Popis' }).fill(data.description)
  await form.getByRole('spinbutton', { name: 'Číslo sezóny' }).fill(data.seasonNumber)
  await form.getByRole('spinbutton', { name: 'Číslo epizódy' }).fill(data.episodeNumber)
  await form.getByRole('textbox', { name: 'Externé ID' }).fill(data.extId)
  await pickNow(page, form, 'Dátum publikácie')
  await saveEdit(page)
  await closeDetail(page, '/edit')
}

/** Delete an episode from its detail view. */
export async function deleteEpisode(page: Page, podcastId: string, episodeId: string): Promise<void> {
  await page.goto(`/podcasts/${podcastId}/episodes/${episodeId}`)
  await cardLoad(page)
  await visibleCy(page, 'button-delete').click()
  await visibleCy(page, 'button-confirm-delete').click()
  await expect(page).not.toHaveURL(new RegExp(episodeId))
  await expect(page).toHaveURL(new RegExp(`/podcasts/${podcastId}`))
}
