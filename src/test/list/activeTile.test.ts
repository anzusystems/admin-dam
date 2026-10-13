import type { UploadQueueItem } from '@anzusystems/common-admin'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RouterView } from 'vue-router'

import { assetDetail, assetFile, createFakeDam, httpError, queueRow } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamAnswer } from '@/test/support/fakeDam'
import { buttonsNamed, customField, eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/* One tile of the list is the active one: the tile of the asset picked last, by a click or by an arrow key. The arrow
 * keys go on from it, a click with Shift picks the tiles from it for the mass edit, and the panel beside the list
 * shows its asset. The list is read anew by its filter, its search, its sorting and its "Refresh", and a further page
 * of it is read as its end is scrolled into view: the active tile is the tile of its asset, wherever that is by then,
 * not the tile at the place it had. An asset a list came without has no tile, and is waited for only while the panel
 * still shows it. The real page of the list with its real panel, detail and upload queue, the application around it
 * as it starts; the server is a fake, and so are the address the page asks about a new version of the application
 * and what the browser tells the page of its end coming into view. */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const SEARCH = /^\/adm\/v1\/asset\/licence\/1(\/search)?$/

const RIGHT = 'ArrowRight'
const LEFT = 'ArrowLeft'

const LIST = '/assets'
const NO_ASSET = 'No asset selected'
const SYSTEM_ERROR = 'System error, try again later or contact administrator'
/** The asset of the row of the upload queue: an image the list does not hold. */
const UPLOADED = 'asset-9'

/** An asset the server has, in the list and in its detail: a video, its title is its id. */
const onServer = (id: string) => ({
  ...assetDetail(id, { attributes: { assetType: 'video', assetStatus: 'with_file' } }),
  keywords: [],
  authors: [],
})

/** The pages of the list the server has, in their order. */
let pages: string[][] = []
/** The rows the page asks for at a time. */
const ROWS = 25
/** The addresses the server was asked, each whole: the one asked last says which page of the list it is for. */
let asked: string[] = []

/** What the page watches for coming into view. */
let watched: Array<{ element: Element; tell: (entries: Array<{ isIntersecting: boolean }>) => void }> = []

class ViewWatcher {
  constructor(private readonly tell: (entries: Array<{ isIntersecting: boolean }>) => void) {}
  observe(element: Element) {
    watched.push({ element, tell: this.tell })
  }
  unobserve() {}
  disconnect() {}
}

const settled = () => vi.advanceTimersByTimeAsync(100)

/** Past the few seconds in which an asset read a moment ago is not read again. */
const later = () => vi.advanceTimersByTimeAsync(6_000)

/** An arrow key let go over the page, as the window hears it. */
const arrow = async (key: typeof RIGHT | typeof LEFT) => {
  document.body.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }))
  await settled()
}

/** What the bar of the open detail says: the place of its asset in the list and its title. */
const shown = () =>
  Array.from(
    document.body.querySelectorAll('.dam-image-detail-dialog.v-overlay--active .v-toolbar .text-label-large > div')
  )
    .map((part) => part.textContent?.trim())
    .join(' ')

/** The assets the server was asked for one at a time, as the panel reads its own. */
const readAlone = () =>
  server.sent('GET', /^\/adm\/v1\/asset\/asset-\d$/).map((request) => request.url.split('/').pop())

/** The open detail, or null with none open. */
const detail = () => document.body.querySelector<HTMLElement>('.dam-image-detail-dialog.v-overlay--active')

/** The page of the list with the assets of the first page the server has, none of them picked, and one uploaded
 * asset in the upload queue. */
const openList = async () => {
  vi.stubGlobal('IntersectionObserver', ViewWatcher)
  const uploaded: UploadQueueItem[] = [
    queueRow({ status: 'uploaded', canEditMetadata: true, assetId: UPLOADED, fileId: 'file-9' }),
  ]
  const ui = await startUploadUi({
    server,
    grants: ['dam_asset_update'],
    customForm: { video: [customField('title')], image: [customField('title')] },
    queues: { global: uploaded },
  })
  asked = ui.asked
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
  /* The page as the router draws it, at its own address: it asks the router about the way out of it. With it the
   * other page the bar of the list links to. */
  const View = (await import('@/domains/coreDam/asset/components/list/AssetListView.vue')).default
  ui.router.addRoute({ path: LIST, name: '/(coreDam)/assets', component: View })
  ui.router.addRoute({ path: '/settings', component: { render: () => null } })
  await ui.router.push(LIST)
  const page = await ui.mount(async () => ({ default: RouterView }))
  /** The tiles as they are drawn now: a list read anew draws new ones. */
  const tiles = () => Array.from(page.querySelectorAll<HTMLElement>('.dam-image-grid__item'))
  /** The assets of the tiles, in the order they are drawn in. */
  const order = () => tiles().map((tile) => tile.querySelector('.text-truncate')?.textContent?.trim())
  await eventually(() => expect(order()).toEqual(pages[0]))
  const panel = () => document.body.querySelector<HTMLElement>('.v-navigation-drawer--right')!

  return {
    ...ui,
    page,
    tiles,
    order,
    /** Which of the tiles is the active one. */
    active: () => tiles().map((tile) => tile.classList.contains('dam-image-grid__item--active')),
    /** Which of the tiles are picked for the mass edit. */
    selected: () => tiles().map((tile) => tile.classList.contains('dam-image-grid__item--selected')),
    /** The asset the panel beside the list holds, as its file card says it: null while it holds none. */
    held: () => panel().querySelector('.anzu-copy-text > span')?.textContent?.trim() ?? null,
    panel,
    /** A click on the tile, and the read it starts answered. */
    pick: async (index: number) => {
      tiles()[index].click()
      await settled()
    },
    /** The list is read anew by its "Refresh", and from now on the server has these pages of it. */
    readAnew: async (...now: string[][]) => {
      pages = now
      page.querySelector('.mdi-refresh')!.closest('button')!.click()
      await settled()
      await eventually(() => expect(order()).toEqual(now[0]))
    },
    /** The edit of the row of the upload queue, from the queue drawn over the whole page: pressed, not waited for. */
    editUploaded: async () => {
      document.body.querySelector<HTMLButtonElement>('[data-cy="button-add-description"]')!.click()
      const edit = await eventually(() => {
        const queue = document.body.querySelector('.overlay--sidebar')
        const button = queue ? buttonsNamed(queue, 'Edit more')[0] : undefined
        expect(button?.disabled).toBe(false)

        return button!
      })
      edit.click()
      await settled()
    },
    /** The detail is closed, and the queue drawn over the whole page put away: the list is in view again. */
    backToTheList: async () => {
      detail()?.querySelector('.v-toolbar .mdi-close')!.closest('button')!.click()
      await eventually(() => expect(detail()).toBeNull())
      document.body.querySelector('.overlay--sidebar .mdi-chevron-down')!.closest('button')!.click()
      await eventually(() => expect(document.body.querySelector('.overlay--sidebar')).toBeNull())
    },
    /** The end of the list is scrolled into view, as the browser tells the page: the next page of it is read. */
    scrollToTheEnd: async () => {
      const end = watched.filter(({ element }) => element.isConnected && element.className === 'w-100').at(-1)!
      end.tell([{ isIntersecting: true }])
      await settled()
    },
    /** The user goes to another page of the application, and comes back to the list. */
    leaveAndComeBack: async () => {
      void ui.router.push('/settings')
      await settled()
      expect(tiles()).toEqual([])
      void ui.router.push(LIST)
      await settled()
      await eventually(() => expect(order()).toEqual(pages[0]))
    },
  }
}

beforeEach(() => {
  server = createFakeDam()
  pages = [['asset-1', 'asset-2', 'asset-3']]
  asked = []
  watched = []
  for (const id of ['asset-1', 'asset-2', 'asset-3', 'asset-4']) server.asset(onServer(id))
  server.asset({
    ...onServer(UPLOADED),
    attributes: { assetType: 'image', assetStatus: 'with_file' },
    mainFile: assetFile('file-9', 'processed', { asset: UPLOADED }),
  })
  const empty = (): FakeDamAnswer => ({ status: 200, data: { data: [] } })
  server.on('GET', SEARCH, () => {
    const offset = Number(new URLSearchParams((asked.at(-1) ?? '').split('?')[1] ?? '').get('offset'))
    const page = offset / ROWS

    return {
      status: 200,
      data: { data: (pages[page] ?? []).map((id) => onServer(id)), hasNextPage: page + 1 < pages.length },
    }
  })
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

describe('the active tile of the list, once the list is read anew', () => {
  it('is the tile of its asset at the place the asset has by then: the keys go on from there', async () => {
    const list = await openList()
    // The asset picked last is the one that counts.
    await list.pick(0)
    await list.pick(1)

    await list.readAnew(['asset-3', 'asset-1', 'asset-2'])

    // The panel holds the asset as it did, and nothing was read for it.
    expect([list.active(), list.held(), readAlone()]).toEqual([[false, false, true], 'asset-2', ['asset-1', 'asset-2']])

    await later()
    await arrow(LEFT)
    expect([list.active(), list.held(), readAlone()]).toEqual([
      [false, true, false],
      'asset-1',
      ['asset-1', 'asset-2', 'asset-1'],
    ])
    // And from the last tile there is nowhere to go on to.
    await arrow(RIGHT)
    await arrow(RIGHT)
    expect([list.active(), readAlone()]).toEqual([
      [false, false, true],
      ['asset-1', 'asset-2', 'asset-1', 'asset-2'],
    ])
  })

  // The tile at the place the active one had is a tile as any other: a click on it picks it.
  it('is no tile when its asset is in the list no more, and a click makes the tile at its old place the active one', async () => {
    const list = await openList()
    await list.pick(1)

    await list.readAnew(['asset-1', 'asset-3'])

    expect([list.active(), list.held()]).toEqual([[false, false], 'asset-2'])

    await list.pick(1)
    expect([list.active(), list.held(), readAlone()]).toEqual([[false, true], 'asset-3', ['asset-2', 'asset-3']])
  })

  // With no tile active the keys start where they start on a list nothing was picked in.
  it('is no tile when its asset is in the list no more, and the keys start as in a list nothing was picked in', async () => {
    const list = await openList()
    await arrow(RIGHT)
    expect([list.active(), readAlone()]).toEqual([[false, true, false], ['asset-2']])

    await list.readAnew(['asset-1', 'asset-3', 'asset-4'])
    expect(list.active()).toEqual([false, false, false])
    await arrow(RIGHT)

    expect([list.active(), readAlone()]).toEqual([
      [false, true, false],
      ['asset-2', 'asset-3'],
    ])
  })

  // The first page of the list read anew need not bring the asset: a page read as the list is scrolled can.
  it('is the tile of its asset in a further page of the list, once that page is read', async () => {
    const list = await openList()
    await list.pick(1)

    await list.readAnew(['asset-1', 'asset-3'], ['asset-4', 'asset-2'])
    expect([list.order(), list.active()]).toEqual([
      ['asset-1', 'asset-3'],
      [false, false],
    ])
    await list.scrollToTheEnd()

    expect([list.order(), list.active(), list.held(), readAlone()]).toEqual([
      ['asset-1', 'asset-3', 'asset-4', 'asset-2'],
      [false, false, false, true],
      'asset-2',
      ['asset-2'],
    ])
    await arrow(LEFT)
    expect([list.active(), list.held()]).toEqual([[false, false, true, false], 'asset-4'])
  })

  /* A tile picked meanwhile is the active one, and a further page does not take that from it: not for the asset
   * that was active before, nor for an earlier tile of its own asset - a list can hold an asset twice. */
  it('stays the tile picked since, whatever a further page of the list brings', async () => {
    const list = await openList()
    await list.pick(1)
    await list.readAnew(['asset-1', 'asset-3', 'asset-1'], ['asset-4', 'asset-2'])

    await list.pick(2)
    await list.scrollToTheEnd()

    expect([list.order(), list.active(), list.held()]).toEqual([
      ['asset-1', 'asset-3', 'asset-1', 'asset-4', 'asset-2'],
      [false, false, true, false, false],
      'asset-1',
    ])
  })

  // The tiles for the mass edit are picked from the active one to the one clicked with Shift.
  it('is where a click with Shift picks from', async () => {
    const list = await openList()
    await list.pick(1)
    await list.readAnew(['asset-2', 'asset-1', 'asset-3'])

    list.tiles()[2].dispatchEvent(new MouseEvent('click', { bubbles: true, shiftKey: true }))
    await settled()

    expect([list.active(), list.selected()]).toEqual([
      [true, false, false],
      [true, true, true],
    ])
  })
})

/* "Reset" of the filter empties the list before it reads it anew, where the other ways leave the old rows drawn
 * meanwhile: one more way the list is read anew, and the active tile follows its asset through it as well. */
describe('the active tile of the list, once the filter is reset', () => {
  it('is the tile of its asset at the place the asset has by then, and the detail of the panel is of the list', async () => {
    const list = await openList()
    await list.pick(1)
    pages = [['asset-3', 'asset-1', 'asset-2']]

    list.page.querySelector('.mdi-filter-remove-outline')!.closest('button')!.click()
    await settled()
    await eventually(() => expect(list.order()).toEqual(pages[0]))

    expect([list.active(), list.held(), readAlone()]).toEqual([[false, false, true], 'asset-2', ['asset-2']])

    // "Edit more" of the panel opens the detail of the active tile: with its place in the list, and its buttons.
    buttonsNamed(list.panel(), 'Edit more')[0].click()
    await eventually(() => expect(shown()).toBe('3 / 3 asset-2'))
    await arrow(LEFT)
    expect(shown()).toBe('2 / 3 asset-1')
  })

  it('is no tile when the list holds its asset no more', async () => {
    const list = await openList()
    await list.pick(1)
    pages = [['asset-3', 'asset-1']]

    list.page.querySelector('.mdi-filter-remove-outline')!.closest('button')!.click()
    await settled()
    await eventually(() => expect(list.order()).toEqual(pages[0]))

    expect([list.active(), list.held()]).toEqual([[false, false], 'asset-2'])
  })
})

/* A list that comes without the asset of the active tile leaves no tile active; the asset is waited for, and its tile
 * is the active one again once a later list or a further page brings it. Waited for while the panel beside the list
 * still shows it: when the panel has taken another asset since, or lost its own, a tile made active for the old one
 * would be a tile nobody picked, beside a panel that shows something else. */
describe('the asset of the active tile that a list came without', () => {
  /** The second asset picked, and the list read anew without it: no tile is active, the panel holds the asset. */
  const lostFromTheList = async (...then: string[][]) => {
    const list = await openList()
    await list.pick(1)
    await list.readAnew(['asset-1', 'asset-3'], ...then)
    expect([list.active(), list.held()]).toEqual([[false, false], 'asset-2'])

    return list
  }

  it('has its tile active again in the list that brings it back, while the panel shows it', async () => {
    const list = await lostFromTheList()

    await list.readAnew(['asset-3', 'asset-1', 'asset-2'])

    expect([list.active(), list.held(), readAlone()]).toEqual([[false, false, true], 'asset-2', ['asset-2']])
  })

  it('is forgotten once the panel holds the asset of a queue row: the list that brings it back has no active tile', async () => {
    const list = await lostFromTheList()
    await list.editUploaded()
    await eventually(() => expect(detail()?.querySelector('.anzu-copy-text > span')?.textContent).toBe(UPLOADED))
    await list.backToTheList()

    await list.readAnew(['asset-1', 'asset-2', 'asset-3'])

    expect([list.active(), list.held()]).toEqual([[false, false, false], UPLOADED])
    // And it stays forgotten: the list read once more has none either.
    await list.readAnew(['asset-2', 'asset-1', 'asset-3'])
    expect(list.active()).toEqual([false, false, false])
  })

  it('is forgotten once the panel has lost its asset to a read that failed', async () => {
    server.assetBy(UPLOADED, () => {
      throw httpError(500)
    })
    const list = await lostFromTheList()
    await list.editUploaded()
    await eventually(() => expect(list.alerts()).toEqual([SYSTEM_ERROR]))
    expect(list.panel().textContent).toBe(NO_ASSET)
    await list.backToTheList()

    await list.readAnew(['asset-1', 'asset-2', 'asset-3'])

    expect([list.active(), list.panel().textContent]).toEqual([[false, false, false], NO_ASSET])
  })

  it('is forgotten for a further page as well, once the panel holds another asset', async () => {
    const list = await lostFromTheList(['asset-4', 'asset-2'])
    await list.editUploaded()
    await eventually(() => expect(detail()?.querySelector('.anzu-copy-text > span')?.textContent).toBe(UPLOADED))
    await list.backToTheList()

    await list.scrollToTheEnd()

    expect([list.order(), list.active(), list.held()]).toEqual([
      ['asset-1', 'asset-3', 'asset-4', 'asset-2'],
      [false, false, false, false],
      UPLOADED,
    ])
  })

  // Behind its loader the panel shows no asset: the one it is reading can be another.
  it('is forgotten by a list that comes while the panel reads the asset of a queue row', async () => {
    let answer: () => void = () => undefined
    const uploaded = {
      ...onServer(UPLOADED),
      attributes: { assetType: 'image', assetStatus: 'with_file' },
      mainFile: assetFile('file-9', 'processed', { asset: UPLOADED }),
    }
    server.assetBy(UPLOADED, () => new Promise((resolve) => (answer = () => resolve(uploaded))))
    const list = await lostFromTheList()
    await list.editUploaded()
    expect(server.assetReads(UPLOADED)).toBe(1)

    await list.readAnew(['asset-1', 'asset-2', 'asset-3'])

    expect(list.active()).toEqual([false, false, false])
    answer()
    await eventually(() => expect(detail()?.querySelector('.anzu-copy-text > span')?.textContent).toBe(UPLOADED))
    expect(list.active()).toEqual([false, false, false])
  })

  /* A tile that is active stays the tile of its asset whatever the panel holds: the detail of a queue row opened and
   * closed over it leaves it highlighted, and so does the list read anew after that. */
  it('is not what an active tile is: that one follows its asset though the panel holds the asset of a queue row', async () => {
    const list = await openList()
    await list.pick(1)
    await list.editUploaded()
    await eventually(() => expect(detail()?.querySelector('.anzu-copy-text > span')?.textContent).toBe(UPLOADED))
    await list.backToTheList()
    expect([list.active(), list.held()]).toEqual([[false, true, false], UPLOADED])

    await list.readAnew(['asset-3', 'asset-1', 'asset-2'])

    expect([list.active(), list.held()]).toEqual([[false, false, true], UPLOADED])
  })

  // The same for a tile picked after an asset was lost: it is active as any other, not waited for.
  it('gives way to a tile picked since, which follows its asset as any other', async () => {
    const list = await lostFromTheList()
    await list.pick(0)
    await list.editUploaded()
    await eventually(() => expect(detail()?.querySelector('.anzu-copy-text > span')?.textContent).toBe(UPLOADED))
    await list.backToTheList()

    await list.readAnew(['asset-3', 'asset-2', 'asset-1'])

    expect([list.active(), list.held()]).toEqual([[false, false, true], UPLOADED])
  })
})

describe('the active tile of the list, once the page of the list is left', () => {
  // The page comes back with nothing picked: its panel holds no asset, and no tile is the active one.
  it('is no tile on the way back into the page, and a click makes the tile at its old place the active one', async () => {
    const list = await openList()
    await list.pick(1)

    await list.leaveAndComeBack()

    expect([list.active(), list.panel().textContent]).toEqual([[false, false, false], NO_ASSET])
    await list.pick(1)
    expect([list.active(), list.held()]).toEqual([[false, true, false], 'asset-2'])
  })

  it('is no tile on the way back into the page: the keys start as in a list nothing was picked in', async () => {
    const list = await openList()
    await list.pick(2)

    await list.leaveAndComeBack()
    await arrow(LEFT)
    expect(list.active()).toEqual([false, false, false])
    await arrow(RIGHT)

    expect([list.active(), list.held()]).toEqual([[false, true, false], 'asset-2'])
  })
})
