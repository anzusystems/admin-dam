import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RouterView } from 'vue-router'

import { assetDetail, assetFile, createFakeDam } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamAnswer } from '@/test/support/fakeDam'
import { customField, eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/* The detail of an asset of an external provider shows the picture of that asset, and nothing of it can be changed
 * there. The detail of an asset of DAM has tabs, one of them the region of interest of an image, whose frame is
 * drawn in the place of the picture; the tab that was open last is remembered for the detail opened next. The real
 * pages of the two lists with their real details, the application around them as it starts; the server is a fake,
 * and so is the address the page asks about a new version of the application. */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const SEARCH = /^\/adm\/v1\/asset\/licence\/1(\/search)?$/
const PROVIDER = 'provider-1'
const PROVIDER_LIST = /^\/adm\/v1\/asset-external-provider\/provider-1\/search$/
const PROVIDER_ASSET = /^\/adm\/v1\/asset-external-provider\/provider-1\/([^/]+)$/
const ROI = /^\/adm\/v1\/roi\/roi-1$/

const settled = () => vi.advanceTimersByTimeAsync(100)

/** An image of DAM, with the file its region of interest is of. */
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

/** An image of the provider. */
const provided = (id: string) => ({
  id,
  texts: { displayTitle: id },
  attributes: { assetType: 'image' },
  url: 'https://provider.test/' + id + '.jpg',
  metadata: {},
})

/** The open detail, of either list. */
const detail = () => document.body.querySelector<HTMLElement>('.v-dialog.v-overlay--active .dam-image-detail')

/** What the open detail draws in the place of the picture: the picture of its asset, or the frame of a region. */
const drawn = () => {
  const place = detail()?.querySelector('.dam-image-detail__left')

  return { picture: !!place?.querySelector('.asset-image'), frame: !!place?.querySelector('.a-cropper') }
}

/** The images the list of the provider holds, in its order. */
let providedIds: string[] = []

/** What the bar of the open detail says: the place of the asset in its list and its title. */
const shown = () =>
  Array.from(detail()?.querySelectorAll('.v-toolbar .text-label-large > div') ?? [])
    .map((part) => part.textContent?.trim())
    .join(' ')

/** The page of the list of DAM, as the router draws it: the page of the list of the provider is one address away. */
const openLists = async () => {
  const ui = await startUploadUi({
    server,
    grants: ['dam_asset_update', 'dam_regionOfInterest_update', 'dam_assetExternalProvider_access'],
    customForm: { image: [customField('title')] },
  })
  // The provider, as the config of the ext system names it.
  const config = ui.library.useDamConfigStore()
  const extSystem = config.damConfigExtSystem.get(1) as unknown as Record<string, unknown>
  extSystem.assetExternalProviders = { [PROVIDER]: { title: 'Provider' } }
  // The user as the bar of the page draws them, with the provider on their account.
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
  // The two lists as the router draws them, each at its own address, and the pages their bars link to.
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
  /** The user goes to the other list, as the menu of the integrations takes them: its tiles are drawn. */
  const goTo = async (list: 'assets' | 'provider', ...titles: string[]) => {
    // Not awaited before the clock moves: an open dialog or menu of Vuetify holds every navigation back by a timer.
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
    /** The detail of the one asset of the list, opened by the pencil of its tile. */
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
  // The region of interest of the image of DAM, as its tab reads it.
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

  /* It has no tabs of its own to leave the region of interest by: the frame drawn there was the one of the image of
   * DAM, and moving it saved the region of that image. */
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

    // The tab is still the one the detail of DAM was left on: it is that detail that opens on it again.
    await lists.closeDetail()
    await lists.goTo('assets', 'asset-1')
    await lists.openDetail('asset-1')
    await eventually(() => expect(drawn()).toEqual({ picture: false, frame: true }))
  })

  /* While its asset is read the detail draws the bar of the loader it shares with the detail of DAM. That bar
   * counted the list of DAM - whatever place the last visit of that list left behind - and its two buttons did
   * nothing. It is the bar of the detail of the provider: its own place, and its own buttons. */
  it('says its place in the list of the provider while its asset is being read, and walks that list', async () => {
    providedIds = ['provided-1', 'provided-2', 'provided-3']
    const lists = await openLists()
    // The list of DAM is left with its one asset at place one of one.
    await lists.openDetail('asset-1')
    await lists.closeDetail()
    await lists.goTo('provider', ...providedIds)
    /** The read of every asset of the provider is held from now on: answered one by one. */
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
    /** The two buttons of the bar that walk the list, of whichever bar is drawn. */
    const walk = () => {
      const [previous, next] = Array.from(detail()!.querySelectorAll<HTMLButtonElement>('.v-toolbar button'))

      return { previous, next }
    }

    lists.tiles()[1].querySelectorAll<HTMLButtonElement>('.detail-icon')[1].click()
    await settled()

    expect([shown(), asked()]).toEqual(['2 / 3 provided-2', ['provided-2']])
    // As in the loaded detail of the provider: both there, neither disabled.
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
