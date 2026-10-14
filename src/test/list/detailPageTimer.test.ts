import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RouterView } from 'vue-router'

import { createFakeDam } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamAnswer } from '@/test/support/fakeDam'
import { startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/* The two pages of a detail - of an asset, and of the asset of a file - start the first read of their asset a moment
 * after they are drawn, and read by the address of the page the user is on. Left within that moment, the page reads
 * nothing: the read would go by the address of the page after it, which names no asset, and say so there. The real
 * pages as the router draws them; the server is a fake. */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const ASSET = '11111111-2222-4333-8444-555555555555'
const FILE = 'aaaaaaaa-2222-4333-8444-555555555555'
/** The read of an asset, by its id or by the id of a file of it. */
const READ = /^\/adm\/v1\/asset\/(asset-file\/)?[^/]+$/

const ELSEWHERE = '/elsewhere'

/** A page of a detail: what it is, its route, its address, and where it reads its asset. */
type Page = [string, string, string, () => Promise<{ default: unknown }>, string, string]

const pages: Page[] = [
  [
    'the page of an asset',
    '/(coreDam)/assets/[id]',
    '/assets/:id',
    () => import('@/domains/coreDam/asset/components/detail/AssetDetailView.vue'),
    '/assets/' + ASSET,
    '/adm/v1/asset/' + ASSET,
  ],
  [
    'the page of the asset of a file',
    '/(coreDam)/assets/file/[id]',
    '/assets/file/:id',
    () => import('@/domains/coreDam/asset/components/detail/AssetFileDetailView.vue'),
    '/assets/file/' + FILE,
    '/adm/v1/asset/asset-file/' + FILE,
  ],
]

/** The page as the router draws it at its address, just drawn: no time has passed. */
const open = async ([, name, path, load, address]: Page) => {
  const ui = await startUploadUi({ server, grants: ['dam_asset_update'] })
  ui.router.addRoute({ path, name, component: (await load()).default as never })
  ui.router.addRoute({ path: '/assets', name: '/(coreDam)/assets', component: { render: () => null } })
  ui.router.addRoute({ path: ELSEWHERE, component: { render: () => null } })
  await ui.router.push(address)
  await ui.mount(async () => ({ default: RouterView }))

  return ui
}

/** The addresses the server was asked to read an asset at. */
const read = () => server.sent('GET', READ).map((request) => request.url)

beforeEach(() => {
  server = createFakeDam()
  // The read is asked for and never answered: what the page draws of its asset is not the point here.
  server.on('GET', READ, () => new Promise<FakeDamAnswer>(() => undefined))
})

afterEach(() => {
  stopUploadUi()
})

describe.each(pages)('%s', (...page) => {
  // "Incorrect asset ID or rights" was said on the page the user went to.
  it('reads nothing and says nothing when it is left before its first read starts', async () => {
    const ui = await open(page)

    void ui.router.push(ELSEWHERE)
    await vi.advanceTimersByTimeAsync(50)
    expect([ui.router.currentRoute.value.path, read()]).toEqual([ELSEWHERE, []])

    await vi.advanceTimersByTimeAsync(1_000)

    expect([ui.alerts(), read()]).toEqual([[], []])
  })

  // The guard of the case above: the read is only put off, not given up.
  it('reads its asset once, a moment after it is drawn', async () => {
    const ui = await open(page)
    expect(read()).toEqual([])

    await vi.advanceTimersByTimeAsync(1_000)

    expect([ui.alerts(), read()]).toEqual([[], [page[5]]])
  })
})
