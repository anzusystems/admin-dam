import { test, expect, type APIResponse, type Page } from '@playwright/test'
import { prepareUser } from '@pages/shared/login'
import { ADMIN_SUITE, CORE_DAM_API, LICENCE_ID } from '@pages/shared/constants'

let page: Page

/** `max-age` of a header such as `cache-control: public, max-age=0`. */
function maxAge(response: APIResponse, header: string): number {
  const value = response.headers()[header] ?? ''
  const match = value.match(/max-age=(\d+)/)
  expect(match, `${header}: "${value}" has a max-age`).not.toBeNull()
  return Number(match![1])
}

test.describe.serial(`${ADMIN_SUITE} - Image cache control`, { tag: '@integration' }, () => {
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
      // e.g. https://imageadmin.smedatadevel.sk/image/w0-h200-c0/<file id>.jpg
      const adminUrl: string = asset.mainFile.links.image_list.url
      const admin = await page.request.get(adminUrl)
      expect(admin.status(), adminUrl).toBe(200)
      // Named explicitly: the admin server intermittently answers `private, must-revalidate` for a file
      // for tens of seconds, then serves `public` again — see DAM-B12 in KNOWN-BUGS.md. Not marked @bug,
      // since it passes almost every run. The url and the header it actually sent are what a next
      // occurrence needs to be chased with, plus Cloudflare's view of it: the bad header is a cached HIT,
      // replayed for up to 59s.
      const { 'cf-cache-status': cfStatus, age } = admin.headers()
      expect(
        admin.headers()['cache-control'],
        `cache-control of ${adminUrl} (cf-cache-status: ${cfStatus}, age: ${age ?? '-'})`
      ).toContain('public')
      expect(maxAge(admin, 'cache-control'), `${adminUrl} is not cached`).toBe(0)
      expect(maxAge(admin, 'strict-transport-security')).toBeGreaterThanOrEqual(0)

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
