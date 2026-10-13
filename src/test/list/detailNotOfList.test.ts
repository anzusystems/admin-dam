import type { UploadQueueItem } from '@anzusystems/common-admin'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { assetDetail, assetFile, createFakeDam, queueRow } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamAnswer } from '@/test/support/fakeDam'
import { buttonsNamed, customField, eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/* The detail of an asset is opened from the list - the pencil of a tile, a double click, "Edit more" of the panel
 * beside the list - and from elsewhere: for an asset just created, and by the edit of a row of the upload queue.
 * Opened from the list it walks the list, with two buttons, a counter and the arrow keys; opened from elsewhere it is
 * of no tile, and has none of them. The real page of the list with its real detail, panel and upload queue, the
 * application around it as it starts; the server is a fake, and so is the address the page asks about a new version
 * of the application. */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const SEARCH = /^\/adm\/v1\/asset\/licence\/1(\/search)?$/
const CREATE = /^\/adm\/v1\/asset\/licence\/1$/

const RIGHT = 'ArrowRight'
const LEFT = 'ArrowLeft'
const EDIT = 'Edit more'

const LIST = '/assets'
/** The asset of the row of the upload queue: an image the list does not hold. */
const UPLOADED = 'asset-9'

/** An asset the server has, in the list and in its detail: a video unless told otherwise, its title is its id. */
const onServer = (id: string, over: Record<string, unknown> = {}) => ({
  ...assetDetail(id, { attributes: { assetType: 'video', assetStatus: 'with_file' }, ...over }),
  keywords: [],
  authors: [],
})

/** What the server has, in the order of the list. */
let assets: ReturnType<typeof onServer>[] = []

const settled = () => vi.advanceTimersByTimeAsync(100)

/** An arrow key let go over the page, as the window hears it. */
const arrow = async (key: typeof RIGHT | typeof LEFT) => {
  document.body.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }))
  await settled()
}

/** How many times the server was asked for each of the three assets of the list. */
const reads = () => ['asset-1', 'asset-2', 'asset-3'].map((assetId) => server.assetReads(assetId))

const address = () => window.location.pathname

/** The open detail, or null with none open. */
const detail = () => document.body.querySelector<HTMLElement>('.dam-image-detail-dialog.v-overlay--active')

/** What the bar of the open detail says: the place of the asset in the list and its title, nothing when not of the list. */
const shown = () =>
  Array.from(detail()?.querySelectorAll('.v-toolbar .text-label-large > div') ?? [])
    .map((part) => part.textContent?.trim())
    .join(' ')

/** The asset the open detail holds, as the file panel of its form says it. */
const held = () => detail()?.querySelector('.anzu-copy-text > span')?.textContent?.trim() ?? null

/** The buttons of the bar of the open detail, by what their icons say. */
const bar = () => {
  const button = (icon: string) =>
    detail()
      ?.querySelector('.v-toolbar .' + icon)
      ?.closest('button') ?? null

  return { previous: button('mdi-chevron-left'), next: button('mdi-chevron-right'), close: button('mdi-close')! }
}

const closeDetail = async () => {
  bar().close.click()
  await eventually(() => expect(detail()).toBeNull())
}

/** The page of the list with its three assets, none of them picked, and one uploaded asset in the upload queue. */
const openList = async () => {
  const uploaded: UploadQueueItem[] = [
    queueRow({ status: 'uploaded', canEditMetadata: true, assetId: UPLOADED, fileId: 'file-9' }),
  ]
  const ui = await startUploadUi({
    server,
    grants: ['dam_asset_create', 'dam_asset_update'],
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
  // The two pages the bar of the list links to.
  ui.router.addRoute({ path: LIST, name: '/(coreDam)/assets', component: { render: () => null } })
  ui.router.addRoute({ path: '/settings', component: { render: () => null } })

  const page = await ui.mount(() => import('@/domains/coreDam/asset/components/list/AssetListView.vue'))
  /** The tiles as they are drawn now: a list read anew draws new ones. */
  const tiles = () => Array.from(page.querySelectorAll<HTMLElement>('.dam-image-grid__item'))
  await eventually(() => expect(tiles()).toHaveLength(3))
  const panel = () => document.body.querySelector<HTMLElement>('.v-navigation-drawer--right')!

  return {
    ...ui,
    page,
    panel,
    /** Which of the tiles is the active one. */
    active: () => tiles().map((tile) => tile.classList.contains('dam-image-grid__item--active')),
    /** A click on the tile, and the read it starts answered. */
    pick: async (index: number) => {
      tiles()[index].click()
      await settled()
    },
    pencil: (index: number) => tiles()[index].querySelectorAll<HTMLButtonElement>('.detail-icon')[1],
    /** "Edit more" of the panel beside the list. */
    editMore: async () => {
      buttonsNamed(panel(), EDIT)[0].click()
      await eventually(() => expect(detail()).not.toBeNull())
    },
    /** "Create empty asset" of the menu of the page, confirmed: the detail of the new asset opens. */
    createEmpty: async () => {
      page.querySelector<HTMLButtonElement>('[data-cy="button-main"]')!.click()
      const create = await eventually(() => {
        const item = document.body.querySelector<HTMLElement>('[data-cy="button-main-empty-asset"]')
        expect(item).not.toBeNull()

        return item!
      })
      create.click()
      const confirm = await eventually(() => {
        const button = document.body.querySelector<HTMLButtonElement>(
          '[data-cy="create-panel"] button[data-cy="button-confirm"]'
        )
        expect(button).not.toBeNull()

        return button!
      })
      confirm.click()
      await eventually(() => expect(held()).toBe('asset-new'))
      // The menu stays open under the new detail until the first click into it, and holds the keys while it does.
      const into = detail()!.querySelector('.v-toolbar')!
      into.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
      into.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await eventually(() => expect(document.body.querySelector('.v-menu.v-overlay--active')).toBeNull())
    },
    /** The edit of the one row of the upload queue, from the queue drawn over the whole page. */
    editUploaded: async () => {
      document.body.querySelector<HTMLButtonElement>('[data-cy="button-add-description"]')!.click()
      const edit = await eventually(() => {
        const queue = document.body.querySelector('.overlay--sidebar')
        expect(queue).not.toBeNull()

        return buttonsNamed(queue!, EDIT)[0]
      })
      edit.click()
      await eventually(() => expect(held()).toBe(UPLOADED))
    },
    /** The queue is put away again, as its "hide" button puts it. */
    hideUploadQueue: async () => {
      document.body.querySelector('.overlay--sidebar .mdi-chevron-down')!.closest('button')!.click()
      await eventually(() => expect(document.body.querySelector('.overlay--sidebar')).toBeNull())
    },
    /** The list is read anew, with the assets in this order. */
    readAnew: async (order: string[]) => {
      assets = order.map((id) => onServer(id))
      page.querySelector('.mdi-refresh')!.closest('button')!.click()
      await eventually(() =>
        expect(
          Array.from(page.querySelectorAll('.dam-image-grid__item .text-truncate')).map((title) =>
            title.textContent?.trim()
          )
        ).toEqual(order)
      )
    },
  }
}

beforeEach(() => {
  server = createFakeDam()
  assets = ['asset-1', 'asset-2', 'asset-3'].map((id) => onServer(id))
  assets.forEach((asset) => server.asset(asset))
  server.asset(
    onServer(UPLOADED, {
      attributes: { assetType: 'image', assetStatus: 'with_file' },
      mainFile: assetFile('file-9', 'processed', { asset: UPLOADED }),
    })
  )
  const empty = (): FakeDamAnswer => ({ status: 200, data: { data: [] } })
  server.on('GET', SEARCH, () => ({
    status: 200,
    data: { data: assets.map((asset) => structuredClone(asset)), hasNextPage: false },
  }))
  server.on('GET', /^\/adm\/v1\/asset-licence\/1$/, () => ({ status: 200, data: { id: 1, name: 'Licence' } }))
  server.on('GET', /^\/adm\/v1\/ext-system\/1$/, () => ({ status: 200, data: { id: 1, name: 'Ext system' } }))
  server.on('GET', /^\/adm\/v1\/distribution\/asset(-file)?\/[^/]+$/, empty)
  server.on('GET', /^\/adm\/v1\/(keyword|author)\/ext-system\/1\/search$/, empty)
  // An asset with no file yet, as the server makes one.
  server.on('POST', CREATE, () => ({
    status: 201,
    data: onServer('asset-new', { attributes: { assetType: 'image', assetStatus: 'draft' }, mainFile: null }),
  }))
  // The window is one for the whole file, and so is its address.
  window.history.replaceState(null, '', LIST)
})

afterEach(() => {
  stopUploadUi()
})

type List = Awaited<ReturnType<typeof openList>>

/** A detail that is not of the list, opened and left open. */
const notOfList: Array<[string, (list: List) => Promise<void>, string]> = [
  ['an asset just created', (list) => list.createEmpty(), 'asset-new'],
  ['a row of the upload queue', (list) => list.editUploaded(), UPLOADED],
]

/** The same, closed again: the panel beside the list is left holding its asset. */
const afterNotOfList: Array<[string, (list: List) => Promise<void>, string]> = [
  [
    notOfList[0][0],
    async (list) => {
      await list.createEmpty()
      await closeDetail()
    },
    notOfList[0][2],
  ],
  [
    notOfList[1][0],
    async (list) => {
      await list.editUploaded()
      await closeDetail()
      await list.hideUploadQueue()
    },
    notOfList[1][2],
  ],
]

describe('the arrow keys of the list while a detail that is not of the list is open', () => {
  // The second tile is the active one: its neighbours are what the keys would read.
  it.each(notOfList)(
    'do nothing in the detail of %s: no neighbour of a tile is read into it',
    async (_of, open, id) => {
      const list = await openList()
      await list.pick(1)
      await open(list)
      expect([held(), shown()]).toEqual([id, ''])

      await arrow(RIGHT)
      await arrow(LEFT)

      expect([held(), shown(), address()]).toEqual([id, '', LIST])
      expect([list.active(), reads()]).toEqual([
        [false, true, false],
        [0, 1, 0],
      ])
    }
  )

  // Not even the neighbour of the first tile, which the keys pick while none is active.
  it('do nothing in the detail of an asset just created while no tile is active', async () => {
    const list = await openList()
    await list.createEmpty()

    await arrow(RIGHT)

    expect([held(), address(), list.active(), reads()]).toEqual(['asset-new', LIST, [false, false, false], [0, 0, 0]])
  })

  // The keys are kept from that detail, not from the list: with it closed they pick the neighbour of the active tile.
  it.each(afterNotOfList)('walk the list again once the detail of %s is closed', async (_of, before) => {
    const list = await openList()
    await list.pick(0)
    await before(list)

    await arrow(RIGHT)

    expect([list.active(), reads(), address()]).toEqual([[false, true, false], [1, 1, 0], LIST])
  })

  it.each(afterNotOfList)(
    'walk the list again in the detail the pencil of a tile opens after that of %s',
    async (_of, before) => {
      const list = await openList()
      await before(list)

      list.pencil(1).click()
      await eventually(() => expect(shown()).toBe('2 / 3 asset-2'))
      await arrow(RIGHT)

      expect([shown(), address(), reads()]).toEqual(['3 / 3 asset-3', '/assets/asset-3', [0, 1, 1]])
    }
  )
})

describe('"Edit more" of the panel beside the list', () => {
  /* The detail opened last leaves its view behind, and closing it does not put the view back: without one of its
   * own the detail of the panel had no buttons, no counter and no name after a detail that was not of the list. */
  it.each(afterNotOfList)(
    'opens a detail of the list for the asset of the active tile, also after the detail of %s',
    async (_of, before) => {
      const list = await openList()
      await before(list)
      await list.pick(1)

      await list.editMore()

      expect([shown(), held(), address()]).toEqual(['2 / 3 asset-2', 'asset-2', '/assets/asset-2'])
      expect([bar().previous?.disabled, bar().next?.disabled]).toEqual([false, false])
      // And it walks the list, by its buttons and by the keys.
      await arrow(RIGHT)
      expect(shown()).toBe('3 / 3 asset-3')
      bar().previous!.click()
      await settled()
      expect([shown(), address()]).toEqual(['2 / 3 asset-2', '/assets/asset-2'])
    }
  )

  // The panel holds the asset of the detail closed last, and the active tile is of another one, or there is none.
  it.each(afterNotOfList)(
    'opens a detail that is not of the list while the panel holds %s',
    async (_of, before, id) => {
      const list = await openList()
      await list.pick(1)
      await before(list)
      expect(list.panel().querySelector('.anzu-copy-text > span')?.textContent).toBe(id)

      await list.editMore()

      expect([shown(), held(), bar().previous, bar().next]).toEqual(['', id, null, null])
      await arrow(RIGHT)
      await arrow(LEFT)
      expect([held(), list.active(), reads()]).toEqual([id, [false, true, false], [0, 1, 0]])
    }
  )

  /* The same after a detail that was of the list: the place of the active tile outlives a list read anew, and is
   * then the place of another asset. The detail would count from that one, and walk the list from it. */
  it('opens a detail that is not of the list while the tile at the active place is of another asset', async () => {
    const list = await openList()
    list.pencil(1).click()
    await eventually(() => expect(shown()).toBe('2 / 3 asset-2'))
    await closeDetail()
    await list.readAnew(['asset-1', 'asset-3', 'asset-2'])

    await list.editMore()

    expect([shown(), held(), bar().previous, bar().next]).toEqual(['', 'asset-2', null, null])
    await arrow(RIGHT)
    expect([held(), reads()]).toEqual(['asset-2', [0, 1, 0]])
  })

  // The guard of the rule: read anew with its asset at the same place, the list is walked from it as before.
  it('opens a detail of the list while the tile at the active place is still of its asset', async () => {
    const list = await openList()
    await list.pick(1)
    await list.readAnew(['asset-3', 'asset-2', 'asset-1'])

    await list.editMore()

    expect([shown(), held()]).toEqual(['2 / 3 asset-2', 'asset-2'])
    await arrow(RIGHT)
    expect(shown()).toBe('3 / 3 asset-1')
  })
})
