import { type Page, expect } from '@playwright/test'
import { cardLoad, filterById } from '@pages/shared/admin'
import { closeDetail, confirmCreate, createDialog, openSettingsSection, saveEdit, visibleCy } from '@pages/shared/crud'

/** Create a video show from the settings section and return its id. */
export async function createVideoShow(page: Page, title: string): Promise<string> {
  await openSettingsSection(page, 'video-show-settings', '/video-shows', 'Video relácie')
  await visibleCy(page, 'button-create').click()
  const dialog = createDialog(page, 'Vytvoriť video reláciu')
  await expect(dialog).toBeVisible()
  await dialog.getByRole('textbox', { name: 'Nadpis' }).fill(title)
  await expect(dialog.locator('[data-cy="button-cancel"]')).toBeVisible()
  return confirmCreate(page, dialog, '/video-show')
}

/** Open the video show detail tab and check it renders the show id and title. */
export async function verifyVideoShowDetail(page: Page, videoShowId: string, title: string): Promise<void> {
  await page.goto(`/video-shows/${videoShowId}`)
  await cardLoad(page)
  await visibleCy(page, 'videoShow-list').click()
  await expect(visibleCy(page, 'video-show-id')).toHaveText(videoShowId)
  await expect(page.locator('main')).toContainText(title)
  await closeDetail(page, videoShowId)
  await expect(page).toHaveURL(/\/video-shows/)
}

/** Rename a video show found through the list's id filter. */
export async function updateVideoShow(page: Page, videoShowId: string, title: string): Promise<void> {
  await page.goto('/video-shows')
  await filterById(page, videoShowId)
  await visibleCy(page, 'table-edit').click()
  await expect(page).toHaveURL(/\/edit/)
  await cardLoad(page)
  await page.locator('main').getByRole('textbox', { name: 'Nadpis' }).fill(title)
  await saveEdit(page)
  await closeDetail(page, '/edit')
}

/** Add an episode to a video show and return its id. */
export async function createVideoShowEpisode(page: Page, videoShowId: string, title: string): Promise<string> {
  await page.goto(`/video-shows/${videoShowId}`)
  await visibleCy(page, 'episode-list').click()
  await visibleCy(page, 'button-create').click()
  const dialog = page.getByRole('dialog').filter({ has: page.locator('[data-cy="episode-title"]') })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('textbox', { name: 'Nadpis' }).fill(title)
  await expect(dialog.locator('[data-cy="button-cancel"]')).toBeVisible()
  return confirmCreate(page, dialog, '/video-show-episode')
}

/** Open a video show episode detail and check it renders the episode id. */
export async function verifyVideoShowEpisodeDetail(page: Page, videoShowId: string, episodeId: string): Promise<void> {
  await page.goto(`/video-shows/${videoShowId}/episodes/${episodeId}`)
  await cardLoad(page)
  await expect(visibleCy(page, 'copy-text')).toHaveText(episodeId)
  await closeDetail(page, episodeId)
  await expect(page).toHaveURL(new RegExp(`/video-shows/${videoShowId}`))
}

/** Rename a video show episode found through the episode list's id filter. */
export async function updateVideoShowEpisode(
  page: Page,
  videoShowId: string,
  episodeId: string,
  title: string
): Promise<void> {
  await page.goto(`/video-shows/${videoShowId}`)
  await visibleCy(page, 'episode-list').click()
  await filterById(page, episodeId)
  await visibleCy(page, 'table-edit').click()
  await cardLoad(page)
  await page.locator('main').getByRole('textbox', { name: 'Nadpis' }).fill(title)
  await saveEdit(page)
  await expect(page).toHaveURL(new RegExp(`/episodes/${episodeId}`))
  await closeDetail(page, `/episodes/${episodeId}`)
  await expect(page).toHaveURL(new RegExp(`/video-shows/${videoShowId}`))
}
