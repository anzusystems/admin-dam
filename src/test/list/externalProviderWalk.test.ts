import type { UploadQueueItem } from '@anzusystems/common-admin'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RouterView } from 'vue-router'

import { createFakeDam, queueRow } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamAnswer } from '@/test/support/fakeDam'
import { eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/* The list of an external provider is walked by the arrow keys, and so is its detail, by the keys and by the two
 * buttons of its bar. The upload queue of the application is drawn on that page too, and over the whole of it: the
 * keys do nothing under it. At the two ends of the list there is nowhere to go: the button that leads out is
 * disabled - in the bar drawn while the asset is read as well - and nothing is read there. The real page of the list
 * of the provider with its real detail and the real upload queue, the application around it as it starts; the server
 * is a fake, and so is the address the page asks about a new version of the application. */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const PROVIDER = 'provider-1'
const PROVIDER_LIST = /^\/adm\/v1\/asset-external-provider\/provider-1\/search$/
const PROVIDER_ASSET = /^\/adm\/v1\/asset-external-provider\/provider-1\/(provided-\d)$/

const RIGHT = 'ArrowRight'
const LEFT = 'ArrowLeft'

const settled = () => vi.advanceTimersByTimeAsync(100)

/** An arrow key let go over the page, as the window hears it. */
const arrow = async (key: typeof RIGHT | typeof LEFT) => {
  document.body.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }))
  await settled()
}

/** An image of the provider. */
const provided = (id: string) => ({
  id,
  texts: { displayTitle: id },
  attributes: { assetType: 'image' },
  url: 'https://provider.test/' + id + '.jpg',
  metadata: {},
})

/** The images the list of the provider holds, in its order. */
let listed: string[] = []

/** The assets of the provider the server was asked for one at a time, in the order it was asked. */
const asked = () => server.sent('GET', PROVIDER_ASSET).map((request) => request.url.split('/').pop())

/** The open detail of the provider. */
const detail = () => document.body.querySelector<HTMLElement>('.v-dialog.v-overlay--active .dam-image-detail')

/** What the bar of the open detail says: the place of the asset in its list and, once it is read, its title. */
const shown = () =>
  Array.from(detail()?.querySelectorAll('.v-toolbar .text-label-large > div') ?? [])
    .map((part) => part.textContent?.trim())
    .join(' ')

/** The two buttons of the bar that walk the list, of whichever bar is drawn. */
const walk = () => {
  const [previous, next] = Array.from(detail()!.querySelectorAll<HTMLButtonElement>('.v-toolbar button'))

  return { previous, next }
}

/** Which of the two buttons are disabled: previous, next. */
const disabled = () => [walk().previous.disabled, walk().next.disabled]

const press = async (button: HTMLButtonElement) => {
  button.click()
  await settled()
}

/** The upload queue drawn over the whole page, or null while it is not. */
const queue = () => document.body.querySelector<HTMLElement>('.overlay--sidebar')

/** The page of the list of the provider with its three images, none of them picked, and one uploaded asset in the
 * upload queue. */
const openProviderList = async () => {
  const uploaded: UploadQueueItem[] = [
    queueRow({ status: 'uploaded', canEditMetadata: true, assetId: 'asset-9', fileId: 'file-9' }),
  ]
  const ui = await startUploadUi({
    server,
    grants: ['dam_asset_update', 'dam_assetExternalProvider_access'],
    queues: { global: uploaded },
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
  const Provided = (await import('@/domains/coreDam/externalProvider/components/ExternalProviderAssetListView.vue'))
    .default
  // The page of the list of DAM is only linked to here.
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
    expect(found).toHaveLength(listed.length)

    return found
  })

  return {
    ...ui,
    /** Which of the tiles is the active one. */
    active: () => tiles.map((tile) => tile.classList.contains('dam-image-grid__item--active')),
    /** A click on the tile, and the read it starts answered. */
    pick: async (index: number) => {
      tiles[index].click()
      await settled()
    },
    /** The pencil of the tile, pressed: the detail of its asset opens, behind its loader while the asset is read. */
    pencil: async (index: number) => {
      tiles[index].querySelectorAll<HTMLButtonElement>('.detail-icon')[1].click()
      await settled()
    },
    /** The upload queue drawn over the whole page, as its "Add description" button draws it. */
    openUploadQueue: () => {
      document.body.querySelector<HTMLButtonElement>('[data-cy="button-add-description"]')!.click()

      return eventually(() => expect(queue()).not.toBeNull())
    },
    /** The upload queue put away into its strip under the list. */
    putUploadQueueAway: () => {
      queue()!.querySelector('.mdi-chevron-down')!.closest('button')!.click()

      return eventually(() => expect(queue()).toBeNull())
    },
  }
}

/** The read of every asset of the provider is held from now on: answered one by one, by what this gives back. */
const holdReads = () => {
  const answers = new Map<string, () => void>()
  server.on(
    'GET',
    PROVIDER_ASSET,
    (_request, match) =>
      new Promise<FakeDamAnswer>((resolve) => {
        answers.set(match[1], () => resolve({ status: 200, data: provided(match[1]) }))
      })
  )

  return async (id: string) => {
    answers.get(id)!()
    await settled()
  }
}

beforeEach(() => {
  server = createFakeDam()
  listed = ['provided-1', 'provided-2', 'provided-3']
  server.on('GET', /^\/adm\/v1\/asset-licence\/1$/, () => ({ status: 200, data: { id: 1, name: 'Licence' } }))
  server.on('GET', /^\/adm\/v1\/ext-system\/1$/, () => ({ status: 200, data: { id: 1, name: 'Ext system' } }))
  server.on('GET', PROVIDER_ASSET, (_request, match) => ({ status: 200, data: provided(match[1]) }))
  server.on('GET', PROVIDER_LIST, () => ({ status: 200, data: { data: listed.map(provided), hasNextPage: false } }))
})

afterEach(() => {
  stopUploadUi()
})

describe('the arrow keys of the list of an external provider', () => {
  /* The upload queue turns off the keys of the list of DAM, which is not this list: here they walked the tiles
   * under the queue, and read their assets into the panel nobody saw. */
  it('do nothing under the upload queue drawn over the whole page, and walk the list before it and after it', async () => {
    const list = await openProviderList()
    await list.pick(0)
    // With the queue in its strip under the list the keys walk the list.
    await arrow(RIGHT)
    expect([list.active(), asked()]).toEqual([
      [false, true, false],
      ['provided-1', 'provided-2'],
    ])

    await list.openUploadQueue()
    await arrow(RIGHT)
    await arrow(LEFT)

    expect([list.active(), asked()]).toEqual([
      [false, true, false],
      ['provided-1', 'provided-2'],
    ])

    await list.putUploadQueueAway()
    await arrow(RIGHT)
    expect([list.active(), asked()]).toEqual([
      [false, false, true],
      ['provided-1', 'provided-2', 'provided-3'],
    ])
  })

  // The asset of the tile was read once more by each key that had nowhere to go.
  it('read nothing at the two ends of the list', async () => {
    const list = await openProviderList()
    await list.pick(2)

    await arrow(RIGHT)
    expect([list.active(), asked()]).toEqual([[false, false, true], ['provided-3']])

    await list.pick(0)
    await arrow(LEFT)
    expect([list.active(), asked()]).toEqual([
      [true, false, false],
      ['provided-3', 'provided-1'],
    ])
  })
})

describe('the two buttons of the detail of an asset of an external provider', () => {
  it('are disabled each at its end of the list: nothing is read there, by the button or by the key', async () => {
    const list = await openProviderList()
    await list.pencil(2)
    await eventually(() => expect(shown()).toBe('3 / 3 provided-3'))

    expect(disabled()).toEqual([false, true])
    await press(walk().next)
    await arrow(RIGHT)
    expect([shown(), asked()]).toEqual(['3 / 3 provided-3', ['provided-3']])

    await press(walk().previous)
    // In the middle of the list both lead somewhere.
    expect([shown(), disabled()]).toEqual(['2 / 3 provided-2', [false, false]])
    await press(walk().previous)
    expect([shown(), disabled()]).toEqual(['1 / 3 provided-1', [true, false]])

    await press(walk().previous)
    await arrow(LEFT)
    expect([shown(), asked()]).toEqual(['1 / 3 provided-1', ['provided-3', 'provided-2', 'provided-1']])
  })

  // The bar drawn while the asset is read is the bar of the loaded detail, as far as it is known by then.
  it('are disabled the same way while the asset is being read', async () => {
    const list = await openProviderList()
    const answer = holdReads()

    await list.pencil(0)
    expect([shown(), disabled()]).toEqual(['1 / 3', [true, false]])
    await press(walk().previous)
    expect([shown(), asked()]).toEqual(['1 / 3', ['provided-1']])

    await press(walk().next)
    expect([shown(), disabled()]).toEqual(['2 / 3', [false, false]])
    await press(walk().next)
    expect([shown(), disabled()]).toEqual(['3 / 3', [false, true]])
    await press(walk().next)
    expect([shown(), asked()]).toEqual(['3 / 3', ['provided-1', 'provided-2', 'provided-3']])

    // And the loaded detail says of them what its loader said.
    await answer('provided-3')
    expect([shown(), disabled()]).toEqual(['3 / 3 provided-3', [false, true]])
  })

  it('are both disabled in the detail of the only asset of a list', async () => {
    listed = ['provided-1']
    const list = await openProviderList()

    await list.pencil(0)
    await eventually(() => expect(shown()).toBe('1 / 1 provided-1'))

    expect(disabled()).toEqual([true, true])
  })
})
