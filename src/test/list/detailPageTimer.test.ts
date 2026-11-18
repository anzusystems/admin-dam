import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RouterView } from 'vue-router'

import { createFakeDam } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamAnswer } from '@/test/support/fakeDam'
import { startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/*
 * The two detail pages start the first read of their asset a
 * moment after being drawn, using the address of the current page.
 * If the user leaves within that moment, the read would use the next
 * page's address, which names no asset, and report an error there.
 */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const ASSET = '11111111-2222-4333-8444-555555555555'
const FILE = 'aaaaaaaa-2222-4333-8444-555555555555'
const READ = /^\/adm\/v1\/asset\/(asset-file\/)?[^/]+$/

const ELSEWHERE = '/elsewhere'

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

const open = async ([, name, path, load, address]: Page) => {
  const ui = await startUploadUi({ server, grants: ['dam_asset_update'] })
  ui.router.addRoute({ path, name, component: (await load()).default as never })
  ui.router.addRoute({ path: '/assets', name: '/(coreDam)/assets', component: { render: () => null } })
  ui.router.addRoute({ path: ELSEWHERE, component: { render: () => null } })
  await ui.router.push(address)
  await ui.mount(async () => ({ default: RouterView }))

  return ui
}

const read = () => server.sent('GET', READ).map((request) => request.url)

beforeEach(() => {
  server = createFakeDam()
  server.on('GET', READ, () => new Promise<FakeDamAnswer>(() => undefined))
})

afterEach(() => {
  stopUploadUi()
})

describe.each(pages)('%s', (...page) => {
  // "Incorrect asset ID or rights" would be shown on the page the user went to.
  it('reads nothing and says nothing when it is left before its first read starts', async () => {
    const ui = await open(page)

    void ui.router.push(ELSEWHERE)
    await vi.advanceTimersByTimeAsync(50)
    expect([ui.router.currentRoute.value.path, read()]).toEqual([ELSEWHERE, []])

    await vi.advanceTimersByTimeAsync(1_000)

    expect([ui.alerts(), read()]).toEqual([[], []])
  })

  it('reads its asset once, a moment after it is drawn', async () => {
    const ui = await open(page)
    expect(read()).toEqual([])

    await vi.advanceTimersByTimeAsync(1_000)

    expect([ui.alerts(), read()]).toEqual([[], [page[5]]])
  })
})
