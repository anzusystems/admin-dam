import { test, expect, type Page } from '@playwright/test'
import { prepareUser } from '@pages/shared/login'
import { ADMIN_SUITE, RAND_NUM } from '@pages/shared/constants'
import { uniqueFixtureCopy } from '@pages/shared/fixtures'
import { uploadFile, waitForAssetList } from '@pages/shared/upload'
import { cleanupAssets, waitForAssetProcessed } from '@pages/shared/api'
import { openAssetDetail, saveAssetTitle } from '@pages/assets/assetDetailPage'
import {
  assetDistributions,
  closeDistributionDialog,
  distributionBlockedBy,
  distributionField,
  distributionFieldOptions,
  openAddDistribution,
  openDistributionServiceTab,
  openDistributionTab,
  pickDistributionOption,
  pickLongDistributionOption,
  YOUTUBE_SERVICE_NAME,
  youtubeLanguages,
  youtubePlaylists,
} from '@pages/distribution/distributionPage'

/**
 * The YouTube side of "Pridať novú distribúciu": the playlist and language selects, the privacy options and
 * the publish-at field they reveal, the three flags and the terms of use.
 *
 * **Nothing here submits.** `Pridať` would upload the fixture to the shared YouTube channel, which no test
 * can take back — the happy path is already covered by `videoDistribution.spec.ts`. This spec fills the form
 * and cancels, and asserts the selects against the very endpoints they are built from.
 *
 * The `Odhlásiť YouTube kanál` button sits in the same dialog and logs the whole environment out of the
 * channel, so it is deliberately left alone.
 */

let page: Page
let ASSET_ID = ''

const TITLE = `TestYoutubeForm${RAND_NUM}`

test.describe.serial(`${ADMIN_SUITE} - Distribution YouTube form`, () => {
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext()
    page = await ctx.newPage()
    await prepareUser(page)
  })

  test.afterAll(async () => {
    await cleanupAssets(page, [ASSET_ID])
    await page.context().close()
  })

  test('uploads the video test asset', async () => {
    const listLoaded = waitForAssetList(page)
    await page.goto('/assets')
    await listLoaded
    // A unique copy, so the main file is processed rather than matched as a duplicate of an earlier upload.
    // Waited through the API rather than the upload overlay, which can sit on "Nahrávanie 1/1" for ever
    // when the server's notification is lost.
    ASSET_ID = await uploadFile(page, uniqueFixtureCopy('video/sample.mp4'))
    await waitForAssetProcessed(page, ASSET_ID)

    // The title is set from the detail rather than the upload dialog: the prepared payload of a YouTube
    // distribution takes its "Nadpis" from it, which is what the next test asserts.
    await openAssetDetail(page, ASSET_ID)
    await saveAssetTitle(page, TITLE)
  })

  test('the YouTube tab prefills its form from the prepared payload', async () => {
    await openDistributionTab(page, ASSET_ID)
    const dialog = await openAddDistribution(page)
    await openDistributionServiceTab(page, dialog, 'YouTube')

    // YouTube labels its title "Nadpis", where JW Player calls it "Názov".
    await expect(dialog.getByRole('textbox', { name: 'Nadpis' })).toHaveValue(TITLE)
    await expect(dialog.getByRole('textbox', { name: 'Popis' })).toBeVisible()
    await closeDistributionDialog(page, dialog)
  })

  test('the language select is built from the service languages', async () => {
    await openDistributionTab(page, ASSET_ID)
    const dialog = await openAddDistribution(page)
    await openDistributionServiceTab(page, dialog, 'YouTube')

    const languages = await youtubeLanguages(page)
    expect(languages).toContain('Slovak')
    // The prepared payload picks the channel's own language, and the select shows it.
    await expect(distributionField(dialog, 'Jazyk')).toContainText('Slovak')

    // 83 languages: the menu renders only a window of them, so the option has to be scrolled to.
    await pickLongDistributionOption(page, dialog, 'Jazyk', 'Czech')
    await closeDistributionDialog(page, dialog)
  })

  test('the playlist select is built from the service playlists and can be reloaded', async () => {
    await openDistributionTab(page, ASSET_ID)
    const dialog = await openAddDistribution(page)
    await openDistributionServiceTab(page, dialog, 'YouTube')

    const playlists = await youtubePlaylists(page)
    expect(playlists.length, 'the channel offers playlists to pick from').toBeGreaterThan(0)
    const offered = await distributionFieldOptions(page, dialog, 'Zoznam videí')
    // Titles are not unique on this channel, so the two lists are compared as multisets.
    expect(offered.slice().sort()).toEqual(playlists.slice().sort())

    // No playlist is preselected — the prepared payload leaves it empty.
    await expect(distributionField(dialog, 'Zoznam videí')).not.toContainText(playlists[0])
    await pickDistributionOption(page, dialog, 'Zoznam videí', playlists[0])

    // The refresh button asks YouTube again instead of answering from the backend's cache.
    // The list fetch appends its own pagination query, so the flag is not at the end of the url.
    const reloaded = page.waitForResponse((response) => /\/playlist\/1(\?|$)/.test(response.url()))
    await distributionField(dialog, 'Zoznam videí').locator('.mdi-refresh').click()
    expect((await reloaded).ok(), 'the playlist refresh responds').toBeTruthy()

    await closeDistributionDialog(page, dialog)
  })

  test('privacy offers the four options, and "Naplánované" reveals a publish-at picker', async () => {
    await openDistributionTab(page, ASSET_ID)
    const dialog = await openAddDistribution(page)
    await openDistributionServiceTab(page, dialog, 'YouTube')

    const privacy = 'Uložiť alebo zverejniť ako'
    expect(await distributionFieldOptions(page, dialog, privacy)).toEqual([
      'Súkromné',
      'Verejné',
      'Nezaradené',
      'Naplánované',
    ])
    // A new distribution defaults to private, so nothing is published by an unfinished form.
    await expect(distributionField(dialog, privacy)).toContainText('Súkromné')

    // Only the scheduled option needs a time, and only then is the picker rendered.
    await expect(dialog.locator('.v-input:has(.mdi-calendar)')).toHaveCount(0)
    await pickDistributionOption(page, dialog, privacy, 'Naplánované')
    await expect(dialog.locator('.v-input:has(.mdi-calendar)')).toHaveCount(1)

    await closeDistributionDialog(page, dialog)
  })

  test('the publish-at picker of "Naplánované" is labelled @bug', async () => {
    test.fail() // DAM-B9: the YouTube form renders it with an empty label — see KNOWN-BUGS.md
    test.info().annotations.push({ type: 'bug', description: 'DAM-B9' })

    await openDistributionTab(page, ASSET_ID)
    const dialog = await openAddDistribution(page)
    await openDistributionServiceTab(page, dialog, 'YouTube')
    await pickDistributionOption(page, dialog, 'Uložiť alebo zverejniť ako', 'Naplánované')

    // The same field on the JW Player tab is labelled "Publikované o", and the locale defines it.
    await expect(dialog.getByRole('textbox', { name: 'Publikované o' })).toHaveCount(1)
  })

  test('the three YouTube flags are switches that toggle', async () => {
    await openDistributionTab(page, ASSET_ID)
    const dialog = await openAddDistribution(page)
    await openDistributionServiceTab(page, dialog, 'YouTube')

    for (const flag of ['Povoliť vkladanie', 'Pre deti', 'Notifikovať odberateľov']) {
      const toggle = dialog.locator('.v-switch').filter({ hasText: flag }).getByRole('checkbox')
      await expect(toggle, flag).toBeVisible()
      const before = await toggle.isChecked()
      await toggle.click()
      expect(await toggle.isChecked(), `${flag} toggled`).toBe(!before)
    }

    await closeDistributionDialog(page, dialog)
  })

  test('the form carries the YouTube terms of use', async () => {
    await openDistributionTab(page, ASSET_ID)
    const dialog = await openAddDistribution(page)
    await openDistributionServiceTab(page, dialog, 'YouTube')

    // Google requires these to be shown wherever the API is used; they are plain links, always rendered.
    await expect(dialog.getByRole('link', { name: 'Zmluvné podmienky služieb YouTube API' })).toHaveAttribute(
      'href',
      'https://developers.google.com/youtube/terms/api-services-terms-of-service'
    )
    await expect(
      dialog.getByRole('link', { name: 'Zásady ochrany osobných údajov spoločnosti Google' })
    ).toHaveAttribute('href', 'https://policies.google.com/privacy')

    await closeDistributionDialog(page, dialog)
  })

  test('no "Blokované distribúciou" select, because the ext system blocks nothing', async () => {
    // The select is rendered only for a service that declares what it waits for, and this one declares
    // nothing — so its absence is the configuration showing through, not a missing field.
    expect(await distributionBlockedBy(page, 'video', YOUTUBE_SERVICE_NAME)).toEqual([])

    await openDistributionTab(page, ASSET_ID)
    const dialog = await openAddDistribution(page)
    await openDistributionServiceTab(page, dialog, 'YouTube')
    await expect(dialog.getByText('Blokované distribúciou')).toHaveCount(0)

    await closeDistributionDialog(page, dialog)
  })

  test('cancelling the filled form distributes nothing', async () => {
    await openDistributionTab(page, ASSET_ID)
    const dialog = await openAddDistribution(page)
    await openDistributionServiceTab(page, dialog, 'YouTube')

    const distributeCalls: string[] = []
    const watch = (request: { method(): string; url(): string }) => {
      if (request.method() === 'POST' && request.url().endsWith('/distribute')) distributeCalls.push(request.url())
    }
    page.on('request', watch)
    try {
      await dialog.getByRole('textbox', { name: 'Nadpis' }).fill(`${TITLE} cancelled`)
      await closeDistributionDialog(page, dialog)
    } finally {
      page.off('request', watch)
    }

    expect(distributeCalls, 'cancelling fires no distribute').toEqual([])
    expect(await assetDistributions(page, ASSET_ID)).toHaveLength(0)
  })
})
