import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RouterView } from 'vue-router'

import { assetDetail, assetFile, createFakeDam } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamAnswer } from '@/test/support/fakeDam'
import { customField, eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/*
 * The detail of an external provider asset shows its picture, and nothing can be changed there.
 * The detail of a DAM asset has tabs, one of them the region of
 * interest of an image, whose frame is drawn in place of the picture.
 * The tab open last is remembered for the next detail.
 * Real pages and details; fake server and fake new-version address.
 */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const SEARCH = /^\/adm\/v1\/asset\/licence\/1(\/search)?$/
const PROVIDER = 'provider-1'
const PROVIDER_LIST = /^\/adm\/v1\/asset-external-provider\/provider-1\/search$/
const PROVIDER_ASSET = /^\/adm\/v1\/asset-external-provider\/provider-1\/([^/]+)$/
const ROI = /^\/adm\/v1\/roi\/roi-1$/

const settled = () => vi.advanceTimersByTimeAsync(100)

const image = (id: string) => ({
  ...assetDetail(id, {
    mainFile: {
      ...assetFile('file-1', 'processed', { asset: id }),
      _resourceName: 'imageFile',
      imageAttributes: { width: 800, height: 450, mostDominantColor: '#cccccc' },
    },
  }),
  keywords: [],
  authors: [],
})

const provided = (id: string) => ({
  id,
  texts: { displayTitle: id },
  attributes: { assetType: 'image' },
  url: 'https://provider.test/' + id + '.jpg',
  metadata: {},
})

const detail = () => document.body.querySelector<HTMLElement>('.v-dialog.v-overlay--active .dam-image-detail')

const drawn = () => {
  const place = detail()?.querySelector('.dam-image-detail__left')

  return { picture: !!place?.querySelector('.asset-image'), frame: !!place?.querySelector('.a-cropper') }
}

let providedIds: string[] = []

const shown = () =>
  Array.from(detail()?.querySelectorAll('.v-toolbar .text-label-large > div') ?? [])
    .map((part) => part.textContent?.trim())
    .join(' ')

const openLists = async () => {
  const ui = await startUploadUi({
    server,
    grants: ['dam_asset_update', 'dam_regionOfInterest_update', 'dam_assetExternalProvider_access'],
    customForm: { image: [customField('title')] },
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
  // The one request of the page that does not go through the client: the version the application is served in.
  vi.stubGlobal('fetch', async () => ({
    ok: true,
    headers: { get: () => 'application/json' },
    json: async () => ({ appVersion: '' }),
  }))
  const Assets = (await import('@/domains/coreDam/asset/components/list/AssetListView.vue')).default
  const Provided = (await import('@/domains/coreDam/externalProvider/components/ExternalProviderAssetListView.vue'))
    .default
  ui.router.addRoute({ path: '/assets', name: '/(coreDam)/assets', component: Assets })
  ui.router.addRoute({ path: '/settings', component: { render: () => null } })
  ui.router.addRoute({ path: '/not-found', component: { render: () => null } })
  ui.router.addRoute({
    path: '/external-providers/:provider',
    name: '/(coreDam)/external-providers/[provider]',
    component: Provided,
  })
  await ui.router.push('/assets')

  const page = await ui.mount(async () => ({ default: RouterView }))
  const tiles = () => Array.from(page.querySelectorAll<HTMLElement>('.dam-image-grid__item'))
  const goTo = async (list: 'assets' | 'provider', ...titles: string[]) => {
    // Not awaited before the clock moves: an open Vuetify dialog or menu holds every navigation back by a timer.
    void ui.router.push(list === 'assets' ? '/assets' : '/external-providers/' + PROVIDER)
    await settled()
    await eventually(() =>
      expect(tiles().map((tile) => tile.querySelector('.text-truncate')?.textContent?.trim())).toEqual(titles)
    )
  }
  await eventually(() => expect(tiles()).toHaveLength(1))

  return {
    ...ui,
    goTo,
    tiles,
    openDetail: async (title: string) => {
      tiles()[0].querySelectorAll<HTMLButtonElement>('.detail-icon')[1].click()
      await eventually(() => expect(shown()).toBe('1 / 1 ' + title))
    },
    closeDetail: async () => {
      detail()!.querySelector('.v-toolbar .mdi-close')!.closest('button')!.click()
      await eventually(() => expect(detail()).toBeNull())
    },
  }
}

beforeEach(() => {
  server = createFakeDam()
  providedIds = ['provided-1']
  server.asset(image('asset-1'))
  const empty = (): FakeDamAnswer => ({ status: 200, data: { data: [] } })
  server.on('GET', SEARCH, () => ({ status: 200, data: { data: [image('asset-1')], hasNextPage: false } }))
  server.on('GET', /^\/adm\/v1\/asset-licence\/1$/, () => ({ status: 200, data: { id: 1, name: 'Licence' } }))
  server.on('GET', /^\/adm\/v1\/ext-system\/1$/, () => ({ status: 200, data: { id: 1, name: 'Ext system' } }))
  server.on('GET', /^\/adm\/v1\/distribution\/asset(-file)?\/[^/]+$/, empty)
  server.on('GET', /^\/adm\/v1\/(keyword|author)\/ext-system\/1\/search$/, empty)
  server.on('GET', /^\/adm\/v1\/image\/file-1\/roi$/, () => ({ status: 200, data: { data: [{ id: 'roi-1' }] } }))
  server.on('GET', ROI, () => ({
    status: 200,
    data: {
      id: 'roi-1',
      image: 'file-1',
      pointX: 0,
      pointY: 0,
      percentageWidth: 1,
      percentageHeight: 1,
      links: { image_roi_example: [] },
    },
  }))
  server.on('GET', PROVIDER_ASSET, (_request, match) => ({ status: 200, data: provided(match[1]) }))
  server.on('GET', PROVIDER_LIST, () => ({
    status: 200,
    data: { data: providedIds.map(provided), hasNextPage: false },
  }))
})

afterEach(() => {
  stopUploadUi()
})

describe('the detail of an asset of an external provider', () => {
  it('shows the picture of its asset', async () => {
    const lists = await openLists()
    await lists.goTo('provider', 'provided-1')

    await lists.openDetail('provided-1')

    expect(drawn()).toEqual({ picture: true, frame: false })
  })

  /*
   * The provider detail has no tabs to leave the region of interest by.
   * The frame drawn there was the one of the DAM image, and moving it saved the region of that image.
   */
  it('shows the picture of its asset after the detail of an image of DAM was left on its region of interest', async () => {
    const lists = await openLists()
    await lists.openDetail('asset-1')
    document.body.querySelector<HTMLElement>('[data-cy="button-focus"]')!.click()
    await eventually(() => expect(drawn()).toEqual({ picture: false, frame: true }))
    await lists.closeDetail()
    await lists.goTo('provider', 'provided-1')

    await lists.openDetail('provided-1')

    expect(drawn()).toEqual({ picture: true, frame: false })
    expect(server.sent('PUT', ROI)).toHaveLength(0)

    // The remembered tab is still the one the DAM detail was left on, so that detail opens on it again.
    await lists.closeDetail()
    await lists.goTo('assets', 'asset-1')
    await lists.openDetail('asset-1')
    await eventually(() => expect(drawn()).toEqual({ picture: false, frame: true }))
  })

  /*
   * While its asset loads, the detail draws the loader bar it shares with the DAM detail.
   * That bar counted the DAM list, at whatever place the last visit left, and its two buttons did nothing.
   * It must show the provider's own place and buttons.
   */
  it('says its place in the list of the provider while its asset is being read, and walks that list', async () => {
    providedIds = ['provided-1', 'provided-2', 'provided-3']
    const lists = await openLists()
    // The list of DAM is left with its one asset at place one of one.
    await lists.openDetail('asset-1')
    await lists.closeDetail()
    await lists.goTo('provider', ...providedIds)
    const ONE = /^\/adm\/v1\/asset-external-provider\/provider-1\/(provided-\d)$/
    const answers = new Map<string, () => void>()
    server.on(
      'GET',
      ONE,
      (_request, match) =>
        new Promise<FakeDamAnswer>((resolve) => {
          answers.set(match[1], () => resolve({ status: 200, data: provided(match[1]) }))
        })
    )
    const asked = () => server.sent('GET', ONE).map((request) => request.url.split('/').pop())
    const walk = () => {
      const [previous, next] = Array.from(detail()!.querySelectorAll<HTMLButtonElement>('.v-toolbar button'))

      return { previous, next }
    }

    lists.tiles()[1].querySelectorAll<HTMLButtonElement>('.detail-icon')[1].click()
    await settled()

    expect([shown(), asked()]).toEqual(['2 / 3 provided-2', ['provided-2']])
    expect([walk().previous.disabled, walk().next.disabled]).toEqual([false, false])

    walk().next.click()
    await settled()
    expect([shown(), asked()]).toEqual(['3 / 3 provided-3', ['provided-2', 'provided-3']])

    walk().previous.click()
    await settled()
    walk().previous.click()
    await settled()
    expect([shown(), asked()]).toEqual(['1 / 3 provided-1', ['provided-2', 'provided-3', 'provided-2', 'provided-1']])

    answers.get('provided-1')!()
    await eventually(() => expect(drawn()).toEqual({ picture: true, frame: false }))
    expect(shown()).toBe('1 / 3 provided-1')
  })
})
