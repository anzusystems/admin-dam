import type { UploadQueueItem } from '@anzusystems/common-admin'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RouterView } from 'vue-router'

import { createFakeDam, queueRow } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamAnswer } from '@/test/support/fakeDam'
import { eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/*
 * The provider list is walked by arrow keys. Its detail is walked by keys and by the two buttons of its bar.
 * The upload queue is drawn over the whole page, and the keys do nothing under it.
 * At the two ends of the list the button that leads out is disabled,
 * also in the bar drawn while the asset is read, and nothing is read.
 * Real page, detail and queue; fake server and fake new-version address.
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

let listed: string[] = []

const asked = () => server.sent('GET', PROVIDER_ASSET).map((request) => request.url.split('/').pop())

const detail = () => document.body.querySelector<HTMLElement>('.v-dialog.v-overlay--active .dam-image-detail')

const shown = () =>
  Array.from(detail()?.querySelectorAll('.v-toolbar .text-label-large > div') ?? [])
    .map((part) => part.textContent?.trim())
    .join(' ')

const walk = () => {
  const [previous, next] = Array.from(detail()!.querySelectorAll<HTMLButtonElement>('.v-toolbar button'))

  return { previous, next }
}

const disabled = () => [walk().previous.disabled, walk().next.disabled]

const press = async (button: HTMLButtonElement) => {
  button.click()
  await settled()
}

const queue = () => document.body.querySelector<HTMLElement>('.overlay--sidebar')

const openProviderList = async () => {
  const uploaded: UploadQueueItem[] = [
    queueRow({ status: 'uploaded', canEditMetadata: true, assetId: 'asset-9', fileId: 'file-9' }),
  ]
  const ui = await startUploadUi({
    server,
    grants: ['dam_asset_update', 'dam_assetExternalProvider_access'],
    queues: { global: uploaded },
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
    expect(found).toHaveLength(listed.length)

    return found
  })

  return {
    ...ui,
    active: () => tiles.map((tile) => tile.classList.contains('dam-image-grid__item--active')),
    pick: async (index: number) => {
      tiles[index].click()
      await settled()
    },
    pencil: async (index: number) => {
      tiles[index].querySelectorAll<HTMLButtonElement>('.detail-icon')[1].click()
      await settled()
    },
    openUploadQueue: () => {
      document.body.querySelector<HTMLButtonElement>('[data-cy="button-add-description"]')!.click()

      return eventually(() => expect(queue()).not.toBeNull())
    },
    putUploadQueueAway: () => {
      queue()!.querySelector('.mdi-chevron-down')!.closest('button')!.click()

      return eventually(() => expect(queue()).toBeNull())
    },
  }
}

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
  /*
   * The upload queue turns off the keys of the DAM list, which is not this list.
   * Here the keys walked the tiles under the queue and read their assets into a panel nobody saw.
   */
  it('do nothing under the upload queue drawn over the whole page, and walk the list before it and after it', async () => {
    const list = await openProviderList()
    await list.pick(0)
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
    expect([shown(), disabled()]).toEqual(['1 / 3 provided-1', [true, false]])
    await press(walk().previous)
    expect([shown(), asked()]).toEqual(['1 / 3 provided-1', ['provided-1']])

    await press(walk().next)
    expect([shown(), disabled()]).toEqual(['2 / 3 provided-2', [false, false]])
    await press(walk().next)
    expect([shown(), disabled()]).toEqual(['3 / 3 provided-3', [false, true]])
    await press(walk().next)
    expect([shown(), asked()]).toEqual(['3 / 3 provided-3', ['provided-1', 'provided-2', 'provided-3']])

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
