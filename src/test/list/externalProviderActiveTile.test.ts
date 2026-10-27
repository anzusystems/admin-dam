import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RouterView } from 'vue-router'

import { createFakeDam, queueRow } from '@/test/support/fakeDam'
import type { FakeDam } from '@/test/support/fakeDam'
import { buttonsNamed, eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/*
 * The active tile of an external provider list is the tile of the asset picked last, by click or arrow key.
 * Arrow keys continue from it and the panel beside the list shows its asset.
 * After a filter, "Refresh" or a further page it stays the tile
 * of its asset wherever that is, not the tile at the old place.
 * With no active tile the right arrow picks the first one.
 * Real page and panel; fake server, new-version address and end-of-list view observer.
 */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const PROVIDER = 'provider-1'
const PROVIDER_LIST = /^\/adm\/v1\/asset-external-provider\/provider-1\/search$/
const PROVIDER_ASSET = /^\/adm\/v1\/asset-external-provider\/provider-1\/(provided-\d)$/

const RIGHT = 'ArrowRight'
const LEFT = 'ArrowLeft'

const settled = () => vi.advanceTimersByTimeAsync(100)

const arrow = async (key: typeof RIGHT | typeof LEFT) => {
  document.body.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }))
  await settled()
}

const provided = (id: string) => ({
  id,
  texts: { displayTitle: id },
  attributes: { assetType: 'image' },
  url: 'https://provider.test/' + id + '.jpg',
  metadata: {},
})

let pages: string[][] = []
let asked: string[] = []

let watched: Array<{ element: Element; tell: (entries: Array<{ isIntersecting: boolean }>) => void }> = []

class ViewWatcher {
  constructor(private readonly tell: (entries: Array<{ isIntersecting: boolean }>) => void) {}
  observe(element: Element) {
    watched.push({ element, tell: this.tell })
  }
  unobserve() {}
  disconnect() {}
}

const read = () => server.sent('GET', PROVIDER_ASSET).map((request) => request.url.split('/').pop())

const openProviderList = async (uploaded = false) => {
  vi.stubGlobal('IntersectionObserver', ViewWatcher)
  const ui = await startUploadUi({
    server,
    grants: ['dam_asset_update', 'dam_assetExternalProvider_access', 'dam_image_create'],
    queues: uploaded
      ? { global: [queueRow({ status: 'uploaded', canEditMetadata: true, assetId: 'asset-9', fileId: 'file-9' })] }
      : {},
  })
  asked = ui.asked
  const config = ui.library.useDamConfigStore()
  const extSystem = config.damConfigExtSystem.get(1) as unknown as Record<string, unknown>
  extSystem.assetExternalProviders = { [PROVIDER]: { title: 'Provider', listingLimit: 3 } }
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
  const tiles = () => Array.from(page.querySelectorAll<HTMLElement>('.dam-image-grid__item'))
  const order = () => tiles().map((tile) => tile.querySelector('.text-truncate')?.textContent?.trim())
  await eventually(() => expect(order()).toEqual(pages[0]))

  return {
    ...ui,
    order,
    active: () => tiles().map((tile) => tile.classList.contains('dam-image-grid__item--active')),
    pick: async (index: number) => {
      tiles()[index].click()
      await settled()
    },
    readAnew: async (...now: string[][]) => {
      pages = now
      page.querySelector('.mdi-refresh')!.closest('button')!.click()
      await settled()
      await eventually(() => expect(order()).toEqual(now[0]))
    },
    scrollToTheEnd: async () => {
      const end = watched.filter(({ element }) => element.isConnected && element.className === 'w-100').at(-1)!
      end.tell([{ isIntersecting: true }])
      await settled()
    },
  }
}

beforeEach(() => {
  server = createFakeDam()
  pages = [['provided-1', 'provided-2', 'provided-3']]
  asked = []
  watched = []
  server.on('GET', /^\/adm\/v1\/asset-licence\/1$/, () => ({ status: 200, data: { id: 1, name: 'Licence' } }))
  server.on('GET', /^\/adm\/v1\/ext-system\/1$/, () => ({ status: 200, data: { id: 1, name: 'Ext system' } }))
  server.on('GET', PROVIDER_ASSET, (_request, match) => ({ status: 200, data: provided(match[1]) }))
  server.on('GET', PROVIDER_LIST, () => {
    const query = new URLSearchParams((asked.at(-1) ?? '').split('?')[1] ?? '')
    const page = Number(query.get('offset')) / (Number(query.get('limit')) || 3)

    return {
      status: 200,
      data: { data: (pages[page] ?? []).map(provided), hasNextPage: page + 1 < pages.length },
    }
  })
})

afterEach(() => {
  stopUploadUi()
})

/*
 * Rows of a list read anew were all drawn inactive and the place of the active tile stayed.
 * No tile was highlighted, the keys continued from the old place,
 * and a click on the tile at that place did not highlight it.
 */
describe('the active tile of the list of an external provider, once the list is read anew', () => {
  it('is the tile of its asset at the place the asset has by then: the keys go on from there', async () => {
    const list = await openProviderList()
    await list.pick(1)

    await list.readAnew(['provided-3', 'provided-1', 'provided-2'])

    expect([list.active(), read()]).toEqual([[false, false, true], ['provided-2']])
    await arrow(LEFT)
    expect([list.active(), read()]).toEqual([
      [false, true, false],
      ['provided-2', 'provided-1'],
    ])
  })

  it('is none when the list came without its asset; a click on the tile at its old place makes that one active', async () => {
    const list = await openProviderList()
    await list.pick(1)

    await list.readAnew(['provided-4', 'provided-5', 'provided-6'])
    expect(list.active()).toEqual([false, false, false])

    await list.pick(1)
    expect([list.active(), read()]).toEqual([
      [false, true, false],
      ['provided-2', 'provided-5'],
    ])
  })

  // A click after a list shorter than the place of the active tile threw: the tile was highlighted, its asset not read.
  it('lets any tile be picked and read after a list shorter than the place the active tile had', async () => {
    const list = await openProviderList()
    await list.pick(2)

    await list.readAnew(['provided-4'])
    await list.pick(0)

    expect([list.active(), read(), list.alerts()]).toEqual([[true], ['provided-3', 'provided-4'], []])
  })

  it('is the tile of its asset once a further page brings it, while the panel still shows it', async () => {
    const list = await openProviderList()
    await list.pick(1)

    await list.readAnew(['provided-4', 'provided-5', 'provided-6'], ['provided-7', 'provided-2'])
    expect(list.active()).toEqual([false, false, false])
    await list.scrollToTheEnd()

    expect([list.order(), list.active()]).toEqual([
      ['provided-4', 'provided-5', 'provided-6', 'provided-7', 'provided-2'],
      [false, false, false, false, true],
    ])
  })
})

/*
 * "Import to ADAM" used the asset of the active tile.
 * With no tile active it did nothing, although the panel showed an asset.
 */
describe('"Import to ADAM" of the panel beside the list of an external provider', () => {
  it('imports the asset the panel shows, also with no tile active', async () => {
    const list = await openProviderList()
    await list.pick(1)
    await list.readAnew(['provided-4', 'provided-5', 'provided-6'])
    expect(list.active()).toEqual([false, false, false])

    const panel = document.body.querySelector<HTMLElement>('.v-navigation-drawer--right')!
    buttonsNamed(panel, 'Import to ADAM')[0].click()
    await settled()

    expect(list.store.getQueueItems('global').map((row) => row.externalProviderAssetId)).toEqual(['provided-2'])
  })
})

/* With no tile active the right arrow went to the second tile: it counted from the first one. */
describe('the arrow keys of the list of an external provider with no tile active', () => {
  it('pick the first tile by the right one, and the next by the next', async () => {
    const list = await openProviderList()

    await arrow(RIGHT)
    expect([list.active(), read()]).toEqual([[true, false, false], ['provided-1']])
    await arrow(RIGHT)
    expect([list.active(), read()]).toEqual([
      [false, true, false],
      ['provided-1', 'provided-2'],
    ])
  })

  it('pick the first tile after a list that came without the asset of the active one', async () => {
    const list = await openProviderList()
    await list.pick(2)
    await list.readAnew(['provided-4', 'provided-5', 'provided-6'])

    await arrow(RIGHT)

    expect([list.active(), read()]).toEqual([
      [true, false, false],
      ['provided-3', 'provided-4'],
    ])
  })

  it('pick the only tile of a list of one by the right one', async () => {
    pages = [['provided-1']]
    const list = await openProviderList()

    await arrow(RIGHT)

    expect([list.active(), read()]).toEqual([[true], ['provided-1']])
  })

  it('do nothing by the left one', async () => {
    const list = await openProviderList()

    await arrow(LEFT)

    expect([list.active(), read()]).toEqual([[false, false, false], []])
  })
})

describe('the upload queue drawn over the whole page of an external provider', () => {
  it('has no word above it', async () => {
    await openProviderList(true)

    document.body.querySelector<HTMLButtonElement>('[data-cy="button-add-description"]')!.click()
    const card = await eventually(() => {
      const found = document.body.querySelector<HTMLElement>('.overlay--sidebar .v-card')
      expect(found?.querySelector('.dam-upload-queue__item')).toBeTruthy()

      return found!
    })

    const words = Array.from(card.childNodes)
      .filter((node) => node.nodeType === Node.TEXT_NODE)
      .map((node) => node.textContent?.trim())
      .join('')
    expect(words).toBe('')
  })
})
