import type { UploadQueueItem } from '@anzusystems/common-admin'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RouterView } from 'vue-router'

import { assetDetail, assetFile, createFakeDam, queueRow } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamAnswer } from '@/test/support/fakeDam'
import { buttonsNamed, customField, eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/* While its asset is read the detail draws the bar of its loader. The two buttons of that bar were drawn enabled and
 * did nothing: a press made while the neighbour was being read was lost. They are the buttons of the bar of the loaded
 * detail: they walk the list, lead nowhere at its ends, and are not there in a detail that is not of the list. The
 * real page of the list with its real detail and upload queue, the application around it as it starts; the server is
 * a fake, and so is the address the page asks about a new version of the application. The same bar under the detail
 * of an asset of an external provider is in `externalProviderDetail.test.ts`. */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const SEARCH = /^\/adm\/v1\/asset\/licence\/1(\/search)?$/

const LIST = '/assets'
/** The asset of the row of the upload queue: an image the list does not hold. */
const UPLOADED = 'asset-9'

/** An asset the server has, in the list and in its detail: a video unless told otherwise, its title is its id. */
const onServer = (id: string, over: Record<string, unknown> = {}) => ({
  ...assetDetail(id, { attributes: { assetType: 'video', assetStatus: 'with_file' }, ...over }),
  keywords: [],
  authors: [],
})

const uploadedOnServer = () =>
  onServer(UPLOADED, {
    attributes: { assetType: 'image', assetStatus: 'with_file' },
    mainFile: assetFile('file-9', 'processed', { asset: UPLOADED }),
  })

const settled = () => vi.advanceTimersByTimeAsync(100)

const address = () => window.location.pathname

/** How many times the server was asked for each of the assets. */
const reads = (...assetIds: string[]) => assetIds.map((assetId) => server.assetReads(assetId))

/** The open detail, or null with none open. */
const detail = () => document.body.querySelector<HTMLElement>('.dam-image-detail-dialog.v-overlay--active')

/** What the bar of the detail says: the place of the asset in the list and its title, under the loader as well. */
const shown = () =>
  Array.from(detail()?.querySelectorAll('.v-toolbar .text-label-large > div') ?? [])
    .map((part) => part.textContent?.trim())
    .join(' ')

/** Whether the form of the detail is drawn: not while the detail is behind its loader. */
const loaded = () => detail()?.querySelector('textarea') !== null

/** The buttons of the bar of the detail that walk the list, of whichever bar is drawn, and the one that closes it. */
const bar = () => {
  const button = (icon: string) =>
    detail()
      ?.querySelector('.v-toolbar .' + icon)
      ?.closest('button') ?? null

  return { previous: button('mdi-chevron-left')!, next: button('mdi-chevron-right')!, close: button('mdi-close') }
}

const press = async (button: HTMLButtonElement) => {
  button.click()
  await settled()
}

/** The read of the asset is held from now on: answered by what this gives back. */
const hold = (id: string, asset: () => unknown = () => onServer(id)) => {
  let answer: () => void = () => undefined
  server.assetBy(id, () => new Promise((resolve) => (answer = () => resolve(asset()))))

  return async () => {
    answer()
    await settled()
  }
}

/** The page of the list with its three assets, none of them opened, and one uploaded asset in the upload queue. */
const openList = async () => {
  const uploaded: UploadQueueItem[] = [
    queueRow({ status: 'uploaded', canEditMetadata: true, assetId: UPLOADED, fileId: 'file-9' }),
  ]
  const ui = await startUploadUi({
    server,
    grants: ['dam_asset_update'],
    customForm: { video: [customField('title')], image: [customField('title')] },
    queues: { global: uploaded },
  })
  // The user as the bar of the page draws them.
  const { useAuth } = await import('@/domains/system/auth/auth')
  const { currentUser, setCurrentUser } = useAuth().useCurrentUser('dam')
  setCurrentUser({
    ...currentUser.value,
    email: 'user@dam.test',
    person: { firstName: 'Test', lastName: 'User', fullName: 'Test User' },
    avatar: { color: '', text: 'TU' },
  } as never)
  // The one request of the page that does not go through the client: the version the application is served in.
  vi.stubGlobal('fetch', async () => ({
    ok: true,
    headers: { get: () => 'application/json' },
    json: async () => ({ appVersion: '' }),
  }))
  const View = (await import('@/domains/coreDam/asset/components/list/AssetListView.vue')).default
  ui.router.addRoute({ path: LIST, name: '/(coreDam)/assets', component: View })
  ui.router.addRoute({ path: '/settings', component: { render: () => null } })
  await ui.router.push(LIST)
  const page = await ui.mount(async () => ({ default: RouterView }))
  const tiles = await eventually(() => {
    const found = page.querySelectorAll<HTMLElement>('.dam-image-grid__item')
    expect(found).toHaveLength(3)

    return found
  })

  return {
    ...ui,
    /** The pencil of the tile, pressed: the detail of its asset opens, behind its loader while the asset is read. */
    pencil: async (index: number) => {
      tiles[index].querySelectorAll<HTMLButtonElement>('.detail-icon')[1].click()
      await settled()
    },
    /** A click on the tile, and the read it starts answered. */
    pick: async (index: number) => {
      tiles[index].click()
      await settled()
    },
    /** The edit of the one row of the upload queue, from the queue drawn over the whole page: pressed. */
    editUploaded: async () => {
      document.body.querySelector<HTMLButtonElement>('[data-cy="button-add-description"]')!.click()
      const edit = await eventually(() => {
        const queue = document.body.querySelector<HTMLElement>('.overlay--sidebar')
        const button = queue ? buttonsNamed(queue, 'Edit more')[0] : undefined
        expect(button?.disabled).toBe(false)

        return button!
      })
      edit.click()
      await eventually(() => expect(detail()).not.toBeNull())
    },
  }
}

beforeEach(() => {
  server = createFakeDam()
  const listed = ['asset-1', 'asset-2', 'asset-3'].map((id) => onServer(id))
  listed.forEach((asset) => server.asset(asset))
  server.asset(uploadedOnServer())
  const empty = (): FakeDamAnswer => ({ status: 200, data: { data: [] } })
  server.on('GET', SEARCH, () => ({
    status: 200,
    data: { data: listed.map((asset) => structuredClone(asset)), hasNextPage: false },
  }))
  server.on('GET', /^\/adm\/v1\/asset-licence\/1$/, () => ({ status: 200, data: { id: 1, name: 'Licence' } }))
  server.on('GET', /^\/adm\/v1\/ext-system\/1$/, () => ({ status: 200, data: { id: 1, name: 'Ext system' } }))
  server.on('GET', /^\/adm\/v1\/distribution\/asset(-file)?\/[^/]+$/, empty)
  server.on('GET', /^\/adm\/v1\/(keyword|author)\/ext-system\/1\/search$/, empty)
  // The window is one for the whole file, and so is its address.
  window.history.replaceState(null, '', LIST)
})

afterEach(() => {
  stopUploadUi()
})

describe('the bar of the detail while its asset is being read', () => {
  it('goes on to the next asset by its "next" button, and has nowhere to go from the last', async () => {
    const list = await openList()
    await list.pencil(0)
    expect([shown(), loaded()]).toEqual(['1 / 3 asset-1', true])
    const answerSecond = hold('asset-2')
    const answerThird = hold('asset-3')
    await press(bar().next)
    expect([shown(), loaded(), address()]).toEqual(['2 / 3 asset-2', false, '/assets/asset-2'])
    expect([bar().previous.disabled, bar().next.disabled]).toEqual([false, false])

    await press(bar().next)

    expect([shown(), loaded(), address(), reads('asset-2', 'asset-3')]).toEqual([
      '3 / 3 asset-3',
      false,
      '/assets/asset-3',
      [1, 1],
    ])
    // The last one: the button out of the list is disabled, and a press of it reads nothing.
    expect([bar().previous.disabled, bar().next.disabled]).toEqual([false, true])
    await press(bar().next)
    expect([shown(), reads('asset-2', 'asset-3')]).toEqual(['3 / 3 asset-3', [1, 1]])

    await answerThird()
    expect([shown(), loaded()]).toEqual(['3 / 3 asset-3', true])
    // The asset that was stepped over answers nothing.
    await answerSecond()
    expect([shown(), address()]).toEqual(['3 / 3 asset-3', '/assets/asset-3'])
  })

  it('goes back by its "previous" button, and has nowhere to go from the first', async () => {
    const list = await openList()
    const answerFirst = hold('asset-1')
    await list.pencil(0)
    expect([shown(), loaded()]).toEqual(['1 / 3 asset-1', false])

    // The first one: nothing before it.
    expect([bar().previous.disabled, bar().next.disabled]).toEqual([true, false])
    await press(bar().previous)
    expect([shown(), address(), reads('asset-1', 'asset-2')]).toEqual(['1 / 3 asset-1', '/assets/asset-1', [1, 0]])

    await press(bar().next)
    expect([shown(), loaded(), address()]).toEqual(['2 / 3 asset-2', true, '/assets/asset-2'])
    await answerFirst()
    expect(shown()).toBe('2 / 3 asset-2')

    // And back from the third while it is being read: to the asset the detail still holds, read a moment ago.
    hold('asset-3')
    await press(bar().next)
    expect([shown(), loaded()]).toEqual(['3 / 3 asset-3', false])

    await press(bar().previous)

    expect([shown(), loaded(), address(), reads('asset-2', 'asset-3')]).toEqual([
      '2 / 3 asset-2',
      true,
      '/assets/asset-2',
      [1, 1],
    ])
  })

  /* The bar of the loader has what the bar of the loaded detail has, and for a detail that is not of the list that is
   * neither a button nor a place: here the detail of a row of the upload queue, with the second tile the active one. */
  it('has no buttons and no place in the list in a detail that is not of the list', async () => {
    const answer = hold(UPLOADED, uploadedOnServer)
    const list = await openList()
    await list.pick(1)

    await list.editUploaded()

    expect([shown(), loaded(), bar().previous, bar().next, bar().close === null]).toEqual([
      '',
      false,
      null,
      null,
      false,
    ])

    await answer()
    expect([shown(), loaded(), bar().previous, bar().next]).toEqual([UPLOADED, true, null, null])
  })
})
