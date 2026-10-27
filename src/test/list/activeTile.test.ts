import type { UploadQueueItem } from '@anzusystems/common-admin'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RouterView } from 'vue-router'

import { assetDetail, assetFile, createFakeDam, httpError, queueRow } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamAnswer } from '@/test/support/fakeDam'
import { buttonsNamed, customField, eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/*
 * The active tile is the tile of the asset picked last, by a click or an arrow key. It follows
 * its asset when the list is read anew or a further page is read, not the place it had.
 * An asset the list came without has no tile, and is waited for only while the panel still shows it.
 * Real list page, panel, detail and upload queue. The server, the
 * app-version address and the browser's view-intersection reports are fakes.
 */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const SEARCH = /^\/adm\/v1\/asset\/licence\/1(\/search)?$/

const RIGHT = 'ArrowRight'
const LEFT = 'ArrowLeft'

const LIST = '/assets'
const NO_ASSET = 'No asset selected'
const SYSTEM_ERROR = 'System error, try again later or contact administrator'
const UPLOADED = 'asset-9'

const onServer = (id: string) => ({
  ...assetDetail(id, { attributes: { assetType: 'video', assetStatus: 'with_file' } }),
  keywords: [],
  authors: [],
})

let pages: string[][] = []
const ROWS = 25
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

const settled = () => vi.advanceTimersByTimeAsync(100)

/**
 * Moves past the few seconds in which an asset read a moment ago is not read again.
 */
const later = () => vi.advanceTimersByTimeAsync(6_000)

const arrow = async (key: typeof RIGHT | typeof LEFT) => {
  document.body.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }))
  await settled()
}

const shown = () =>
  Array.from(
    document.body.querySelectorAll('.dam-image-detail-dialog.v-overlay--active .v-toolbar .text-label-large > div')
  )
    .map((part) => part.textContent?.trim())
    .join(' ')

const readAlone = () =>
  server.sent('GET', /^\/adm\/v1\/asset\/asset-\d$/).map((request) => request.url.split('/').pop())

const detail = () => document.body.querySelector<HTMLElement>('.dam-image-detail-dialog.v-overlay--active')

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
  /* The page asks the router about the way out of it. The other page the list bar links to is added too. */
  const View = (await import('@/domains/coreDam/asset/components/list/AssetListView.vue')).default
  ui.router.addRoute({ path: LIST, name: '/(coreDam)/assets', component: View })
  ui.router.addRoute({ path: '/settings', component: { render: () => null } })
  await ui.router.push(LIST)
  const page = await ui.mount(async () => ({ default: RouterView }))
  const tiles = () => Array.from(page.querySelectorAll<HTMLElement>('.dam-image-grid__item'))
  const order = () => tiles().map((tile) => tile.querySelector('.text-truncate')?.textContent?.trim())
  await eventually(() => expect(order()).toEqual(pages[0]))
  const panel = () => document.body.querySelector<HTMLElement>('.v-navigation-drawer--right')!

  return {
    ...ui,
    page,
    tiles,
    order,
    active: () => tiles().map((tile) => tile.classList.contains('dam-image-grid__item--active')),
    selected: () => tiles().map((tile) => tile.classList.contains('dam-image-grid__item--selected')),
    held: () => panel().querySelector('.anzu-copy-text > span')?.textContent?.trim() ?? null,
    panel,
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
    backToTheList: async () => {
      detail()?.querySelector('.v-toolbar .mdi-close')!.closest('button')!.click()
      await eventually(() => expect(detail()).toBeNull())
      document.body.querySelector('.overlay--sidebar .mdi-chevron-down')!.closest('button')!.click()
      await eventually(() => expect(document.body.querySelector('.overlay--sidebar')).toBeNull())
    },
    scrollToTheEnd: async () => {
      const end = watched.filter(({ element }) => element.isConnected && element.className === 'w-100').at(-1)!
      end.tell([{ isIntersecting: true }])
      await settled()
    },
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
    await list.pick(0)
    await list.pick(1)

    await list.readAnew(['asset-3', 'asset-1', 'asset-2'])

    expect([list.active(), list.held(), readAlone()]).toEqual([[false, false, true], 'asset-2', ['asset-1', 'asset-2']])

    await later()
    await arrow(LEFT)
    expect([list.active(), list.held(), readAlone()]).toEqual([
      [false, true, false],
      'asset-1',
      ['asset-1', 'asset-2', 'asset-1'],
    ])
    await arrow(RIGHT)
    await arrow(RIGHT)
    expect([list.active(), readAlone()]).toEqual([
      [false, false, true],
      ['asset-1', 'asset-2', 'asset-1', 'asset-2'],
    ])
  })

  it('is no tile when its asset is in the list no more, and a click makes the tile at its old place the active one', async () => {
    const list = await openList()
    await list.pick(1)

    await list.readAnew(['asset-1', 'asset-3'])

    expect([list.active(), list.held()]).toEqual([[false, false], 'asset-2'])

    await list.pick(1)
    expect([list.active(), list.held(), readAlone()]).toEqual([[false, true], 'asset-3', ['asset-2', 'asset-3']])
  })

  it('is no tile when its asset is in the list no more, and the keys start as in a list nothing was picked in', async () => {
    const list = await openList()
    await arrow(RIGHT)
    expect([list.active(), readAlone()]).toEqual([[true, false, false], ['asset-1']])

    await list.readAnew(['asset-2', 'asset-3', 'asset-4'])
    expect(list.active()).toEqual([false, false, false])
    await arrow(RIGHT)

    expect([list.active(), readAlone()]).toEqual([
      [true, false, false],
      ['asset-1', 'asset-2'],
    ])
  })

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

  /*
   * A tile picked meanwhile stays the active one when a further page arrives. This holds for the previously
   * active asset and for an earlier tile of its own asset, since a list can hold an asset twice.
   */
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

/*
 * "Reset" of the filter empties the list before reading it anew. The other ways keep the
 * old rows drawn meanwhile. The active tile must follow its asset through this one too.
 */
describe('the active tile of the list, once the filter is reset', () => {
  it('is the tile of its asset at the place the asset has by then, and the detail of the panel is of the list', async () => {
    const list = await openList()
    await list.pick(1)
    pages = [['asset-3', 'asset-1', 'asset-2']]

    list.page.querySelector('.mdi-filter-remove-outline')!.closest('button')!.click()
    await settled()
    await eventually(() => expect(list.order()).toEqual(pages[0]))

    expect([list.active(), list.held(), readAlone()]).toEqual([[false, false, true], 'asset-2', ['asset-2']])

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

/*
 * A list without the asset of the active tile leaves no tile active. The
 * tile becomes active again when a later list or page brings the asset.
 * This is waited for only while the panel still shows the asset. Otherwise
 * the tile would be one nobody picked, beside a panel showing something else.
 */
describe('the asset of the active tile that a list came without', () => {
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

  // Behind its loader the panel shows no asset, because the one it is reading can be another.
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

  /*
   * An active tile follows its asset whatever the panel holds. Opening and closing the
   * detail of a queue row over it, or reading the list anew, leaves it highlighted.
   */
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

    expect([list.active(), list.held()]).toEqual([[true, false, false], 'asset-1'])
  })
})
