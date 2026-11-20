import { test, expect, type Page } from '@playwright/test'
import { prepareUser } from '@pages/shared/login'
import { ADMIN_SUITE, RAND_NUM } from '@pages/shared/constants'
import { uniqueFixtureCopy } from '@pages/shared/fixtures'
import { uploadAndDescribe } from '@pages/shared/upload'
import { cleanupAssets, waitForAssetProcessed } from '@pages/shared/api'
import { deleteEpisode } from '@pages/settings/podcastPage'
import { addAssetToNewEpisode } from '@pages/settings/podcastSyncPage'
import { switchMainFileToSlot } from '@pages/assets/assetSlotsPage'
import {
  deleteAssetFromDetail,
  newestImportedEpisode,
  podcastIdByTitle,
  runFullPodcastSync,
  type ImportedEpisode,
} from '@pages/integration/podcastEpisodeSwapPage'
import {
  createCmsArticle,
  deleteCmsArticlesViaApi,
  embedDamMedia,
  expectPlayableOnWeb,
  mediaWarnings,
  openCmsArticleDetail,
  openCmsArticleEdit,
  publishCmsArticle,
  purgeCmsArticleCache,
  saveCmsArticle,
  setMainMediaFromDam,
  type CmsArticle,
} from '@pages/integration/cmsArticlePage'

let page: Page
const assetIds: string[] = []
let article: CmsArticle
let PODCAST_ID = ''
let episode: ImportedEpisode

const PODCAST = 'Dobré ráno'
const ARTICLE_TITLE = `[E2E] DAM to CMS Audio-${RAND_NUM}`

// Destructive: the newest RSS-imported episode of "Dobré ráno" and its asset are deleted, so the podcast
// synchronizer re-imports the feed audio into the test asset that takes the episode over. That asset is deleted
// at the end, taking the re-imported audio with it until the next synchronization.
test.describe.serial(
  `${ADMIN_SUITE} - DAM to CMS audio distribution`,
  { tag: ['@integration', '@destructive'] },
  () => {
    test.beforeAll(async ({ browser }) => {
      const ctx = await browser.newContext()
      page = await ctx.newPage()
      await prepareUser(page)
    })

    test.afterAll(async () => {
      // The article embeds the asset, so it goes first.
      await deleteCmsArticlesViaApi(page, ARTICLE_TITLE)
      await cleanupAssets(page, assetIds)
      await page.context().close()
    })

    test('creates a CMS article', async () => {
      article = await createCmsArticle(page, ARTICLE_TITLE)
    })

    test('deletes the newest imported podcast episode and remembers its title', async () => {
      PODCAST_ID = await podcastIdByTitle(page, PODCAST)
      episode = await newestImportedEpisode(page, PODCAST_ID)
      await deleteAssetFromDetail(page, episode.assetId)
      await deleteEpisode(page, PODCAST_ID, episode.episodeId)
    })

    test('uploads the audio under the episode title and moves its file to the premium slot', async () => {
      await page.goto('/assets')
      // A unique copy, so the main file is processed rather than a duplicate of an earlier upload.
      assetIds.push(await uploadAndDescribe(page, uniqueFixtureCopy('audio/sample.mp3'), episode.title))
      await waitForAssetProcessed(page, assetIds[0])
      await addAssetToNewEpisode(page, assetIds[0], PODCAST, episode.title)
      // With the free slot empty, the episode cannot be played on the web until the synchronizer fills it.
      await switchMainFileToSlot(page, 'premium')
    })

    test('embeds the audio into the article and publishes it', async () => {
      await openCmsArticleEdit(page, article.id)
      await embedDamMedia(page, 'audio', assetIds[0])
      await saveCmsArticle(page)
      await setMainMediaFromDam(page, 'audio', assetIds[0])
      await saveCmsArticle(page)
      await expect(mediaWarnings(page)).toHaveCount(2)
      await publishCmsArticle(page, article.id)
    })

    test('synchronizes the podcast', async () => {
      await runFullPodcastSync(page, PODCAST_ID)
    })

    test('shows the audio as playable in the CMS article', async () => {
      await expect(async () => {
        await openCmsArticleDetail(page, article.id, episode.title)
        await expect(mediaWarnings(page)).toHaveCount(0, { timeout: 5000 })
      }).toPass({ timeout: 3 * 60 * 1000, intervals: [15000] })
    })

    test('plays the audio on the web', async () => {
      // The web rendered the article while the audio was not playable yet and keeps that render until purged.
      await purgeCmsArticleCache(page, article.id)
      await expectPlayableOnWeb(page, article)
    })
  }
)
