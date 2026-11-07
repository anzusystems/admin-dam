import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RouterView } from 'vue-router'

import { createFakeDam } from '@/test/support/fakeDam'
import type { FakeDam } from '@/test/support/fakeDam'
import { eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/*
 * The arrow keys of the external provider list walked it under an open
 * menu or dialog, as the DAM list keys did with its detail closed.
 */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const PROVIDER = 'provider-1'
const PROVIDER_LIST = /^\/adm\/v1\/asset-external-provider\/provider-1\/search$/
const PROVIDER_ASSET = /^\/adm\/v1\/asset-external-provider\/provider-1\/(provided-\d)$/

const settled = () => vi.advanceTimersByTimeAsync(100)

const right = async () => {
  document.body.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowRight', bubbles: true }))
  await settled()
}

const provided = (id: string) => ({
  id,
  texts: { displayTitle: id },
  attributes: { assetType: 'image' },
  url: 'https://provider.test/' + id + '.jpg',
  metadata: {},
})

const LISTED = ['provided-1', 'provided-2', 'provided-3']

const asked = () => server.sent('GET', PROVIDER_ASSET).map((request) => request.url.split('/').pop())

const menu = () => document.body.querySelector('.v-menu.v-overlay--active')

const openProviderList = async () => {
  const ui = await startUploadUi({
    server,
    grants: ['dam_asset_create', 'dam_asset_update', 'dam_assetExternalProvider_access'],
  })
  const config = ui.library.useDamConfigStore()
  const extSystem = config.damConfigExtSystem.get(1) as unknown as Record<string, unknown>
  extSystem.assetExternalProviders = { [PROVIDER]: { title: 'Provider' } }
  const { useAuth } = await import('@/domains/system/auth/auth')
  const { currentUser, setCurrentUser } = useAuth().useCurrentUser('dam')
  setCurrentUser({
    ...currentUser.value,
    email: 'user@dam.test',
    person: { firstName: 'Test', lastName: 'User', fullName: 'Test User' },
    avatar: { color: '', text: 'TU' },
    allowedAssetExternalProviders: [PROVIDER],
  } as never)
  vi.stubGlobal('fetch', async () => ({
    ok: true,
    headers: { get: () => 'application/json' },
    json: async () => ({ appVersion: '' }),
  }))
  const Provided = (await import('@/domains/coreDam/externalProvider/components/ExternalProviderAssetListView.vue'))
    .default
  ui.router.addRoute({ path: '/assets', name: '/(coreDam)/assets', component: { render: () => null } })
  ui.router.addRoute({ path: '/not-found', component: { render: () => null } })
  ui.router.addRoute({
    path: '/external-providers/:provider',
    name: '/(coreDam)/external-providers/[provider]',
    component: Provided,
  })
  await ui.router.push('/external-providers/' + PROVIDER)
  const page = await ui.mount(async () => ({ default: RouterView }))
  const tiles = await eventually(() => {
    const found = Array.from(page.querySelectorAll<HTMLElement>('.dam-image-grid__item'))
    expect(found).toHaveLength(LISTED.length)

    return found
  })

  return {
    ...ui,
    page,
    active: () => tiles.map((tile) => tile.classList.contains('dam-image-grid__item--active')),
    pick: async (index: number) => {
      tiles[index].click()
      await settled()
    },
  }
}

beforeEach(() => {
  server = createFakeDam()
  server.on('GET', /^\/adm\/v1\/asset-licence\/1$/, () => ({ status: 200, data: { id: 1, name: 'Licence' } }))
  server.on('GET', /^\/adm\/v1\/ext-system\/1$/, () => ({ status: 200, data: { id: 1, name: 'Ext system' } }))
  server.on('GET', PROVIDER_ASSET, (_request, match) => ({ status: 200, data: provided(match[1]) }))
  server.on('GET', PROVIDER_LIST, () => ({ status: 200, data: { data: LISTED.map(provided), hasNextPage: false } }))
})

afterEach(() => {
  stopUploadUi()
})

describe('the arrow keys of the list of an external provider', () => {
  it('walk nothing under an open menu of the page, and the list once it is closed', async () => {
    const list = await openProviderList()
    await list.pick(0)
    list.page.querySelector<HTMLButtonElement>('[data-cy="button-main"]')!.click()
    await eventually(() => expect(menu()).not.toBeNull())

    await right()
    expect([list.active(), asked()]).toEqual([[true, false, false], ['provided-1']])

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await eventually(() => expect(menu()).toBeNull())
    await right()
    expect([list.active(), asked()]).toEqual([
      [false, true, false],
      ['provided-1', 'provided-2'],
    ])
  })
})
