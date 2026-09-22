import { test, expect, type Page } from '@playwright/test'
import { prepareUser } from '@pages/shared/login'
import { ADMIN_SUITE, RAND_NUM } from '@pages/shared/constants'
import { uniqueFixtureCopy } from '@pages/shared/fixtures'
import { uploadAndDescribe } from '@pages/shared/upload'
import { cleanupAssets, waitForAssetProcessed } from '@pages/shared/api'
import {
  closeDistributionDialog,
  distribute,
  expectDistributed,
  openAddDistribution,
  openDistributionTab,
  setDistributionCategory,
} from '@pages/distribution/distributionPage'
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

const ARTICLE_TITLE = `[E2E] DAM to CMS Video-${RAND_NUM}`
const ASSET_TITLE = `TestAssetTitle${RAND_NUM}`

test.describe.serial(`${ADMIN_SUITE} - DAM to CMS video distribution`, { tag: '@integration' }, () => {
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

  test('uploads the video test asset', async () => {
    // A unique copy, so the main file is processed rather than a duplicate of an earlier upload.
    assetIds.push(await uploadAndDescribe(page, uniqueFixtureCopy('video/sample.mp4'), ASSET_TITLE))
    await waitForAssetProcessed(page, assetIds[0])
  })

  test('creates a CMS article', async () => {
    article = await createCmsArticle(page, ARTICLE_TITLE)
  })

  test('embeds the undistributed video into the article and publishes it', async () => {
    await openCmsArticleEdit(page, article.id)
    await embedDamMedia(page, 'video', assetIds[0])
    await saveCmsArticle(page)
    await setMainMediaFromDam(page, 'video', assetIds[0])
    await saveCmsArticle(page)
    // Neither the embed nor the main media can play before the video is distributed.
    await expect(mediaWarnings(page)).toHaveCount(2)
    await publishCmsArticle(page, article.id)
  })

  test('distributes the video to JW Player in DAM', async () => {
    await page.goto('/assets')
    await openDistributionTab(page, assetIds[0])
    await setDistributionCategory(page, 'Publicistika')
    const dialog = await openAddDistribution(page)
    await distribute(page, dialog, 'JW Player Video', {
      title: ASSET_TITLE,
      description: `TestDescription${RAND_NUM}`,
      author: 'Pavol Demeš',
    })
    await closeDistributionDialog(page, dialog)
    await expectDistributed(page, assetIds[0], 'JW Player Video')
  })

  test('shows the video as playable in the CMS article', async () => {
    await expect(async () => {
      await openCmsArticleDetail(page, article.id, ASSET_TITLE)
      await expect(mediaWarnings(page)).toHaveCount(0, { timeout: 5000 })
    }).toPass({ timeout: 2 * 60 * 1000, intervals: [10000] })
  })

  test('plays the video on the web', async () => {
    // The web rendered the article while the video was not playable yet and keeps that render until purged.
    await purgeCmsArticleCache(page, article.id)
    await expectPlayableOnWeb(page, article)
  })
})
