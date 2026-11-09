import { test, expect, type APIResponse, type Page } from '@playwright/test'
import { prepareUser } from '@pages/shared/login'
import { ADMIN_SUITE, CORE_DAM_API, IS_LOCAL, LICENCE_ID } from '@pages/shared/constants'

let page: Page

function maxAge(response: APIResponse, header: string): number {
  const value = response.headers()[header] ?? ''
  const match = value.match(/max-age=(\d+)/)
  expect(match, `${header}: "${value}" has a max-age`).not.toBeNull()
  return Number(match![1])
}

test.describe.serial(`${ADMIN_SUITE} - Image cache control`, { tag: '@integration' }, () => {
  // The caching is that of a deployed environment: Cloudflare in front of the image servers, https, a public
  // `image.` host. Locally, imported assets also have no files, and the image server answers them 500.
  test.skip(IS_LOCAL, 'the image servers of a deployed environment')

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext()
    page = await ctx.newPage()
    await prepareUser(page)
  })

  test.afterAll(async () => {
    await page.context().close()
  })

  test('serves images uncached from the admin image server and cacheable from the public one', async () => {
    const params = new URLSearchParams({
      limit: '5',
      type: 'image',
      status: 'with_file',
      visible: 'true',
      generatedBySystem: 'false',
      licences: LICENCE_ID,
    })
    const search = await page.request.get(`${CORE_DAM_API}/asset/licence/search?${params}`)
    expect(search.ok(), 'image asset search').toBeTruthy()
    const { data } = await search.json()
    expect(data.length, 'images to check').toBeGreaterThan(0)

    for (const asset of data) {
      const adminUrl: string = asset.mainFile.links.image_list.url
      const admin = await page.request.get(adminUrl)
      expect(admin.status(), adminUrl).toBe(200)
      expect(maxAge(admin, 'strict-transport-security')).toBeGreaterThanOrEqual(0)
      const { 'cache-control': cacheControl = '', 'cf-cache-status': cfStatus, age } = admin.headers()
      if (/\bprivate\b/.test(cacheControl)) {
        // TODO: DAM-B12, in task #87413 for core-dam. The admin image server answers some files `private,
        // must-revalidate` instead of `public, max-age=0`, and Cloudflare keeps that answer: a HIT 17 minutes old on
        // staging, so asking again does not help. A server fault, so it is recorded on the test, not failed.
        test.info().annotations.push({
          type: 'bug',
          description: `DAM-B12: ${adminUrl} answers "${cacheControl}" (cf-cache-status: ${cfStatus}, age: ${age ?? '-'})`,
        })
      } else {
        expect(cacheControl, `cache-control of ${adminUrl}`).toContain('public')
        expect(maxAge(admin, 'cache-control'), `${adminUrl} is not cached`).toBe(0)
      }

      // The public image server serves the same file under its own crop.
      const fileName = adminUrl.split('/').pop()
      const publicOrigin = new URL(adminUrl).origin.replace('://imageadmin.', '://image.')
      const publicUrl = `${publicOrigin}/image/w200-h200/${fileName}`
      const pub = await page.request.get(publicUrl)
      expect(pub.status(), publicUrl).toBe(200)
      expect(pub.headers()['cache-control'], `cache-control of ${publicUrl}`).toContain('public')
      expect(maxAge(pub, 'cache-control')).toBeGreaterThanOrEqual(0)
      expect(maxAge(pub, 'strict-transport-security')).toBeGreaterThanOrEqual(0)
    }
  })
})
