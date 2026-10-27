import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { RouterView } from 'vue-router'

import { assetDetail, assetFile, createFakeDam, httpError } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamAnswer } from '@/test/support/fakeDam'
import { buttonsNamed, customField, eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const SEARCH = /^\/adm\/v1\/asset\/licence\/1(\/search)?$/
const BULK = /^\/adm\/v1\/asset\/metadata-bulk-update$/
const MAKE_PRIVATE = /^\/adm\/v1\/image\/file-1\/make-private$/

const UNSAVED = 'Unsaved changes'
const STAY = 'Stay'
const LEAVE = 'Leave anyway'
const UPDATED = 'Record was updated'
const SYSTEM_ERROR = 'System error, try again later or contact administrator'
const TYPED = 'typed and not saved'
const FROM_SERVER = 'from the server'

const RIGHT = 'ArrowRight'
const LEFT = 'ArrowLeft'

const LIST = '/assets'

const onServer = (id: string, over: Record<string, unknown> = {}) => ({
  ...assetDetail(id, { attributes: { assetType: 'video', assetStatus: 'with_file' }, ...over }),
  keywords: [],
  authors: [],
})

let assets: ReturnType<typeof onServer>[] = []
const inThePlaceOfItsVideo = (asset: ReturnType<typeof onServer>) => {
  assets = assets.map((known) => (known.id === asset.id ? asset : known))
  server.asset(asset)
}

const settled = () => vi.advanceTimersByTimeAsync(100)

/**
 * Moves past the few seconds in which an asset read a moment ago is not read again.
 */
const later = () => vi.advanceTimersByTimeAsync(6_000)

const arrow = async (key: typeof RIGHT | typeof LEFT, over: Element = document.body) => {
  over.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }))
  await settled()
}

const reads = () => ['asset-1', 'asset-2', 'asset-3'].map((assetId) => server.assetReads(assetId))

const readAlone = () =>
  server.sent('GET', /^\/adm\/v1\/asset\/asset-\d$/).map((request) => request.url.split('/').pop())

const standsOut = (button: HTMLButtonElement) => button.classList.contains('v-btn--variant-flat')

const openList = async (view: 'tiles' | 'table' = 'tiles') => {
  const ui = await startUploadUi({
    server,
    grants: ['dam_asset_update', 'dam_asset_delete', 'dam_image_update'],
    customForm: { video: [customField('title')], image: [customField('title')] },
  })
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
  if (view === 'table') {
    const { GridView, useGridView } = await import('@/domains/system/composables/gridView')
    useGridView().setGridView(GridView.Table)
  }

  /*
   * The page is drawn by the router at its own address, because it asks the router about the way out of it.
   * The other pages linked from the list bar are added too.
   */
  const View = (await import('@/domains/coreDam/asset/components/list/AssetListView.vue')).default
  ui.router.addRoute({ path: LIST, name: '/(coreDam)/assets', component: View })
  ui.router.addRoute({ path: '/settings', component: { render: () => null } })
  await ui.router.push(LIST)
  const onThePage = ref(true)
  const page = await ui.mount(async () => ({
    default: defineComponent({ setup: () => () => (onThePage.value ? h(RouterView) : null) }),
  }))
  const TILE = view === 'table' ? '.a-table__row' : '.dam-image-grid__item'
  const ACTIVE = view === 'table' ? 'a-table__row--active' : 'dam-image-grid__item--active'
  const drawn = () => Array.from(page.querySelectorAll<HTMLElement>(TILE))
  const tiles = await eventually(() => {
    const found = drawn()
    expect(found).toHaveLength(3)

    return found
  })
  const panel = () => document.body.querySelector<HTMLElement>('.v-navigation-drawer--right')!
  const questions = () =>
    Array.from(document.body.querySelectorAll('.v-dialog.v-overlay--active')).filter((dialog) =>
      dialog.textContent?.includes(UNSAVED)
    )

  return {
    ...ui,
    page,
    tiles,
    panel,
    questions,
    active: () => drawn().map((tile) => tile.classList.contains(ACTIVE)),
    order: () => drawn().map((tile) => tile.querySelector('.text-truncate')?.textContent?.trim()),
    selected: () => tiles.map((tile) => tile.classList.contains('dam-image-grid__item--selected')),
    leavePage: async () => {
      onThePage.value = false
      await nextTick()
    },
    pick: async (index: number) => {
      tiles[index].click()
      await settled()
    },
    pencil: (index: number) => tiles[index].querySelectorAll<HTMLButtonElement>('.detail-icon')[1],
    title: () => panel().querySelector<HTMLTextAreaElement>('textarea')!,
    typeTitle: async (value: string) => {
      const title = panel().querySelector<HTMLTextAreaElement>('textarea')!
      title.value = value
      title.dispatchEvent(new Event('input'))
      await nextTick()
    },
    save: () => buttonsNamed(panel(), 'Save')[0],
    answer: async (name: typeof STAY | typeof LEAVE) => {
      buttonsNamed(questions()[0], name)[0].click()
      await settled()
    },
    detail: () => {
      const dialog = document.body.querySelector('.dam-image-detail-dialog.v-overlay--active')
      if (!dialog) return null

      return Array.from(dialog.querySelectorAll('.v-toolbar .text-label-large > div'))
        .map((part) => part.textContent?.trim())
        .join(' ')
    },
    detailTitle: () => document.body.querySelector<HTMLTextAreaElement>('.dam-image-detail textarea')!,
    address: () => window.location.pathname,
  }
}

type List = Awaited<ReturnType<typeof openList>>

const typedIntoTheSecond = async (list: List) => {
  await list.pick(1)
  await list.typeTitle(TYPED)

  return list.title()
}

beforeEach(() => {
  server = createFakeDam()
  assets = ['asset-1', 'asset-2', 'asset-3'].map((id) => onServer(id))
  assets.forEach((asset) => server.asset(asset))
  const empty = (): FakeDamAnswer => ({ status: 200, data: { data: [] } })
  server.on('GET', SEARCH, () => ({
    status: 200,
    data: { data: assets.map((asset) => structuredClone(asset)), hasNextPage: false },
  }))
  server.on('GET', /^\/adm\/v1\/asset-licence\/1$/, () => ({ status: 200, data: { id: 1, name: 'Licence' } }))
  server.on('GET', /^\/adm\/v1\/ext-system\/1$/, () => ({ status: 200, data: { id: 1, name: 'Ext system' } }))
  server.on('GET', /^\/adm\/v1\/distribution\/asset(-file)?\/[^/]+$/, empty)
  server.on('PATCH', BULK, (request) => ({ status: 200, data: JSON.parse(request.data as string) }))
  // The window is one for the whole file, and so is its address.
  window.history.replaceState(null, '', LIST)
})

afterEach(() => {
  stopUploadUi()
})

describe('metadata typed into the panel beside the list and not saved, while no detail is open', () => {
  type Place = { active: boolean[]; detail: string | null; address: string; reads: number[] }
  type Way = [string, (list: List) => Promise<void>, Place]
  const second: Place = { active: [false, true, false], detail: null, address: LIST, reads: [0, 1, 0] }
  const third: Place = { active: [false, false, true], detail: null, address: LIST, reads: [0, 1, 1] }
  const ways: Way[] = [
    ['a click on another tile', (list) => list.pick(2), third],
    ['the right arrow key', () => arrow(RIGHT), third],
    [
      'the left arrow key',
      () => arrow(LEFT),
      { active: [true, false, false], detail: null, address: LIST, reads: [1, 1, 0] },
    ],
    [
      'the pencil of another tile',
      async (list) => {
        list.pencil(2).click()
        await settled()
      },
      { ...third, detail: '3 / 3 asset-3', address: '/assets/asset-3' },
    ],
  ]

  it.each(ways)('are asked about by %s: "Stay" keeps them, "Leave anyway" goes on', async (_way, go, end) => {
    const list = await openList()
    const typedInto = await typedIntoTheSecond(list)
    const asked = server.requests.length
    const place = (): Place => ({
      active: list.active(),
      detail: list.detail(),
      address: list.address(),
      reads: reads(),
    })

    await go(list)

    expect(list.questions()).toHaveLength(1)
    expect(list.questions()[0].textContent).toContain('You have unsaved changes. Are you sure you want to leave?')
    expect([place(), server.requests.length - asked, typedInto.isConnected]).toEqual([second, 0, true])

    await list.answer(STAY)

    expect([list.questions(), place(), server.requests.length - asked]).toEqual([[], second, 0])
    expect([list.title() === typedInto, typedInto.isConnected, typedInto.value]).toEqual([true, true, TYPED])
    expect(standsOut(list.save())).toBe(true)

    await go(list)
    expect([list.questions().length, server.requests.length - asked]).toEqual([1, 0])

    await list.answer(LEAVE)

    expect([list.questions(), place()]).toEqual([[], end])
    expect([list.title().value, standsOut(list.save())]).toEqual([FROM_SERVER, false])
    expect(server.sent('PATCH', BULK)).toHaveLength(0)
  })

  it('are not asked about when nothing was typed, whichever the way', async () => {
    const list = await openList()
    await list.pick(1)

    await list.pick(2)
    expect([list.questions(), list.active(), reads()]).toEqual([[], [false, false, true], [0, 1, 1]])

    await arrow(LEFT)
    expect([list.questions(), list.active(), reads(), list.address()]).toEqual([
      [],
      [false, true, false],
      [0, 2, 1],
      LIST,
    ])

    await arrow(LEFT)
    expect([list.active(), reads(), list.address()]).toEqual([[true, false, false], [1, 2, 1], LIST])

    list.pencil(1).click()
    await settled()
    expect([list.questions(), list.detail(), reads(), list.address()]).toEqual([
      [],
      '2 / 3 asset-2',
      [1, 3, 1],
      '/assets/asset-2',
    ])
  })

  it('are not asked about once the panel has saved them', async () => {
    const list = await openList()
    await typedIntoTheSecond(list)
    list.save().click()
    await eventually(() => expect(list.alerts()).toEqual([UPDATED]))

    await list.pick(2)

    expect([list.questions(), list.active(), reads()]).toEqual([[], [false, false, true], [0, 1, 1]])
  })

  it('are asked about after a save the server refused', async () => {
    server.on('PATCH', BULK, () => {
      throw httpError(500)
    })
    const list = await openList()
    await typedIntoTheSecond(list)
    list.save().click()
    await eventually(() => expect(list.alerts()).toEqual([SYSTEM_ERROR]))

    await list.pick(2)

    expect([list.questions().length, list.active(), reads()]).toEqual([1, [false, true, false], [0, 1, 0]])
  })

  // After "Leave anyway" the panel is behind its loader.
  // The form is not there to be asked about.
  it('are not asked about again while the asset they were left for is being read', async () => {
    const list = await openList()
    let answer: () => void = () => undefined
    server.assetBy('asset-3', () => new Promise((resolve) => (answer = () => resolve(onServer('asset-3')))))
    await typedIntoTheSecond(list)
    await list.pick(2)
    await list.answer(LEAVE)
    expect([list.questions(), reads()]).toEqual([[], [0, 1, 1]])

    await list.pick(0)

    expect([list.questions(), list.active(), reads()]).toEqual([[], [true, false, false], [1, 1, 1]])
    answer()
    await settled()
    expect([list.questions(), list.active(), standsOut(list.save())]).toEqual([[], [true, false, false], false])
  })

  // The detail closes over the asset it deleted while the panel still shows it.
  // Nothing is left to save.
  it('are not asked about once their asset was deleted in the detail', async () => {
    server.on('DELETE', /^\/adm\/v1\/asset\/asset-2$/, () => ({ status: 204, data: '' }))
    const list = await openList()
    list.pencil(1).click()
    await eventually(() => expect(list.detail()).toBe('2 / 3 asset-2'))
    const title = list.detailTitle()
    title.value = TYPED
    title.dispatchEvent(new Event('input'))
    await nextTick()
    expect(standsOut(list.save())).toBe(true)

    document.body.querySelector<HTMLButtonElement>('.dam-image-detail [data-cy="button-delete"]')!.click()
    const confirm = await eventually(() => {
      const button = document.body.querySelector<HTMLButtonElement>('[data-cy="button-confirm-delete"]')
      expect(button).not.toBeNull()

      return button!
    })
    confirm.click()
    await eventually(() => expect(list.detail()).toBeNull())
    expect([server.sent('DELETE').length, standsOut(list.save())]).toEqual([1, false])

    await list.pick(2)

    expect([list.questions(), list.active(), reads()]).toEqual([[], [false, false, true], [0, 1, 1]])
  })

  it('are asked about when it was a switch of the form that was changed', async () => {
    const list = await openList()
    await list.pick(1)
    const singleUse = list.panel().querySelector<HTMLInputElement>('.v-switch input')!
    expect([singleUse.checked, standsOut(list.save())]).toEqual([false, false])

    singleUse.click()
    await nextTick()
    await arrow(RIGHT)

    expect([list.questions().length, list.active(), reads()]).toEqual([1, [false, true, false], [0, 1, 0]])
    await list.answer(STAY)
    expect([singleUse.isConnected, singleUse.checked, standsOut(list.save())]).toEqual([true, true, true])
  })

  // The panel can be put away with typed text in it.
  // The next read replaces that text anyway.
  it('are asked about while the panel is put away, and "Stay" leaves it put away', async () => {
    const list = await openList()
    await typedIntoTheSecond(list)
    const inView = () => list.panel().classList.contains('v-navigation-drawer--active')
    expect(inView()).toBe(true)
    list.page.querySelector('.mdi-information-outline')!.closest('button')!.click()
    await settled()
    expect(inView()).toBe(false)

    await list.pick(2)

    expect([list.questions().length, reads()]).toEqual([1, [0, 1, 0]])
    await list.answer(STAY)
    expect([inView(), list.title().value, reads()]).toEqual([false, TYPED, [0, 1, 0]])

    await list.pick(2)
    await list.answer(LEAVE)
    expect([inView(), list.title().value, reads()]).toEqual([true, FROM_SERVER, [0, 1, 1]])
  })

  /*
   * A double click is two clicks and then the double click itself. The first click asks.
   * In a browser the rest lands on the question, here on the tile. Either way there is one question.
   * "Leave anyway" opens the detail of the tile, as the double click would.
   */
  it('are asked about once by a double click on another tile, which then opens its detail', async () => {
    const list = await openList()
    await typedIntoTheSecond(list)

    list.tiles[2].click()
    list.tiles[2].click()
    list.tiles[2].dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))
    await settled()

    expect([list.questions().length, list.active(), list.detail(), reads()]).toEqual([
      1,
      [false, true, false],
      null,
      [0, 1, 0],
    ])
    await list.answer(LEAVE)
    expect([list.questions(), list.active(), list.detail(), reads()]).toEqual([
      [],
      [false, false, true],
      '3 / 3 asset-3',
      [0, 1, 1],
    ])
  })

  // Picks for the mass edit read their assets for its queue.
  // The panel keeps the asset it already has.
  it.each<[string, MouseEventInit, boolean[]]>([
    ['Ctrl', { ctrlKey: true }, [false, false, true]],
    ['Shift', { shiftKey: true }, [false, true, true]],
  ])('are not asked about by a click with %s, which reads nothing into the panel', async (_key, held, selected) => {
    const list = await openList()
    const typedInto = await typedIntoTheSecond(list)

    list.tiles[2].dispatchEvent(new MouseEvent('click', { bubbles: true, ...held }))
    await settled()

    expect([list.questions(), list.selected(), list.active(), readAlone()]).toEqual([
      [],
      selected,
      [false, true, false],
      ['asset-2'],
    ])
    expect([list.title() === typedInto, typedInto.value, standsOut(list.save())]).toEqual([true, TYPED, true])
  })
})

/*
 * An asset read a moment ago is not read again, so a click on its tile or its pencil leaves the panel as it is.
 * Later they read the asset anew and replace the typed text.
 * An arrow key at an end of the list leads to no asset.
 */
describe('metadata typed into the panel and not saved, when the way leads to the asset the panel holds', () => {
  it('are not asked about by a click on its tile a moment after it was read: nothing is read', async () => {
    const list = await openList()
    const typedInto = await typedIntoTheSecond(list)

    await list.pick(1)

    expect([list.questions(), reads()]).toEqual([[], [0, 1, 0]])
    expect([list.title() === typedInto, typedInto.isConnected, typedInto.value]).toEqual([true, true, TYPED])
  })

  // The detail shows the typed text and asks about it itself when switched to the neighbour.
  it('are not asked about by its pencil a moment after it was read: the detail opens over them', async () => {
    const list = await openList()
    await typedIntoTheSecond(list)

    list.pencil(1).click()
    await settled()

    expect([list.questions(), list.detail(), reads()]).toEqual([[], '2 / 3 asset-2', [0, 1, 0]])
    expect(list.detailTitle().value).toBe(TYPED)

    await arrow(RIGHT)

    expect([list.questions().length, list.detail(), reads()]).toEqual([1, '2 / 3 asset-2', [0, 1, 0]])
    expect(document.body.querySelectorAll('.v-dialog.v-overlay--active')).toHaveLength(2)
    await list.answer(LEAVE)
    expect([list.questions(), list.detail(), reads()]).toEqual([[], '3 / 3 asset-3', [0, 1, 1]])
  })

  it.each<[string, (list: List) => Promise<void>, string | null]>([
    ['a click on its tile', (list) => list.pick(1), null],
    [
      'its pencil',
      async (list) => {
        list.pencil(1).click()
        await settled()
      },
      '2 / 3 asset-2',
    ],
  ])('are asked about by %s once it would be read anew', async (_way, go, detail) => {
    const list = await openList()
    const typedInto = await typedIntoTheSecond(list)
    await later()

    await go(list)

    expect([list.questions().length, list.detail(), reads()]).toEqual([1, null, [0, 1, 0]])
    await list.answer(STAY)
    expect([list.questions(), list.detail(), reads()]).toEqual([[], null, [0, 1, 0]])
    expect([list.title() === typedInto, typedInto.value]).toEqual([true, TYPED])

    await go(list)
    await list.answer(LEAVE)

    expect([list.questions(), list.detail(), reads()]).toEqual([[], detail, [0, 2, 0]])
    expect(list.title().value).toBe(FROM_SERVER)
  })

  /*
   * At an end of the list the arrow key leads nowhere.
   * The active asset is not read again, however long after its read, so there is nothing to ask about.
   */
  it.each<[string, typeof RIGHT | typeof LEFT, number, boolean[], number[]]>([
    ['the right arrow key on the last tile', RIGHT, 2, [false, false, true], [0, 0, 1]],
    ['the left arrow key on the first tile', LEFT, 0, [true, false, false], [1, 0, 0]],
  ])('are not asked about by %s, which reads nothing', async (_way, key, index, active, read) => {
    const list = await openList()
    await list.pick(index)
    const untouched = list.title()

    await arrow(key)
    await later()
    await arrow(key)

    expect([list.questions(), list.active(), reads(), list.address()]).toEqual([[], active, read, LIST])
    expect([list.title() === untouched, untouched.isConnected, untouched.value]).toEqual([true, true, FROM_SERVER])

    await list.typeTitle(TYPED)
    await arrow(key)
    await later()
    await arrow(key)

    expect([list.questions(), list.active(), reads(), list.address()]).toEqual([[], active, read, LIST])
    expect([list.title() === untouched, untouched.value, standsOut(list.save())]).toEqual([true, TYPED, true])
  })
})

describe('the question about metadata typed into the panel and not saved', () => {
  // Under the question the page is reachable only through the keys, which the list hears on the window.
  it('is one: the arrow keys and a click under it do nothing, and its answer is for the way that asked', async () => {
    const list = await openList()
    await typedIntoTheSecond(list)
    await list.pick(2)
    const stay = buttonsNamed(list.questions()[0], STAY)[0]

    await arrow(RIGHT, stay)
    await arrow(LEFT, stay)
    await list.pick(0)

    expect([list.questions().length, list.active(), list.address(), reads()]).toEqual([
      1,
      [false, true, false],
      LIST,
      [0, 1, 0],
    ])
    expect(document.body.querySelectorAll('.v-dialog.v-overlay--active')).toHaveLength(1)

    await list.answer(LEAVE)
    expect([list.questions(), list.active(), reads()]).toEqual([[], [false, false, true], [0, 1, 1]])
  })

  /*
   * A way to the asset the panel holds is not asked about a moment after its read.
   * Under an open question it stays open like every other way.
   * Its first step puts the panel behind its loader, which answers "stay".
   */
  it('stays open over a way that would not be asked about by itself', async () => {
    const list = await openList()
    await list.pick(2)
    await list.typeTitle(TYPED)
    await list.pick(0)
    expect(list.questions()).toHaveLength(1)

    await arrow(RIGHT)
    await list.pick(2)

    expect([list.questions().length, list.active(), list.address(), reads()]).toEqual([
      1,
      [false, false, true],
      LIST,
      [0, 0, 1],
    ])
    await list.answer(LEAVE)
    expect([list.questions(), list.active(), reads()]).toEqual([[], [true, false, false], [1, 0, 1]])
  })

  /*
   * Closing the detail asks nothing. The typed text stays in the panel.
   * The detail takes a moment to go, and its own question is drawn in it.
   */
  it('is one also while a detail that was typed into is closing', async () => {
    const list = await openList()
    await list.pick(1)
    list.pencil(1).click()
    await eventually(() => expect(list.detail()).toBe('2 / 3 asset-2'))
    const title = list.detailTitle()
    title.value = TYPED
    title.dispatchEvent(new Event('input'))
    await nextTick()

    const close = Array.from(document.body.querySelectorAll<HTMLButtonElement>('.dam-image-detail .v-toolbar button'))
    close[3].click()
    list.tiles[2].click()
    await nextTick()

    expect([list.questions().length, list.detail(), reads()]).toEqual([1, null, [0, 1, 0]])
    await settled()
    expect([list.questions().length, list.title().value, reads()]).toEqual([1, TYPED, [0, 1, 0]])
    await list.answer(LEAVE)
    expect([list.questions(), list.detail(), reads()]).toEqual([[], null, [0, 1, 1]])
  })

  /*
   * The panel reads its asset anew when the file address changes.
   * That answer can arrive while the question is open, for a
   * request sent before it (here, making an image file private).
   * Only the file is taken from that read. The form and the question stay.
   */
  it('stays while the panel takes the file of its asset read anew under it, and its answer still counts', async () => {
    const published = { id: 'route-1', publicUrl: 'https://dam.test/public/file-1' }
    const image = (mainRoute: typeof published | null) =>
      onServer('asset-2', {
        attributes: { assetType: 'image', assetStatus: 'with_file' },
        mainFile: { ...assetFile('file-1', 'processed', { asset: 'asset-2' }), mainRoute },
      })
    inThePlaceOfItsVideo(image(published))
    let madePrivate: () => void = () => undefined
    server.on(
      'PATCH',
      MAKE_PRIVATE,
      // core-dam answers this for an image with 204 and no body.
      () => new Promise<FakeDamAnswer>((resolve) => (madePrivate = () => resolve({ status: 204 })))
    )
    const list = await openList()
    const route = () =>
      Array.from(list.panel().querySelectorAll('.v-chip'))
        .map((chip) => chip.textContent?.trim())
        .filter((text) => text?.startsWith('File is'))
    await list.pick(1)
    const menu = () => document.body.querySelector('.v-menu.v-overlay--active')
    list.panel().querySelector('.mdi-dots-vertical')!.closest('button')!.click()
    const makePrivate = await eventually(() => {
      const item = Array.from(menu()?.querySelectorAll<HTMLElement>('.v-list-item') ?? []).find(
        (found) => found.textContent?.trim() === 'Make private'
      )
      expect(item).toBeTruthy()

      return item!
    })
    makePrivate.click()
    await eventually(() => expect(server.sent('PATCH', MAKE_PRIVATE)).toHaveLength(1))
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await eventually(() => expect(menu()).toBeNull())
    await list.typeTitle(TYPED)
    const typedInto = list.title()
    await list.pick(2)
    expect(list.questions()).toHaveLength(1)
    let answerRead: () => void = () => undefined
    server.assetBy('asset-2', () => new Promise((resolve) => (answerRead = () => resolve(image(null)))))

    madePrivate()
    await settled()

    expect([list.questions().length, reads(), route()]).toEqual([1, [0, 2, 0], ['File is public']])
    expect([list.title() === typedInto, typedInto.isConnected, typedInto.value]).toEqual([true, true, TYPED])

    answerRead()
    await settled()

    expect([list.questions().length, list.active(), reads(), route()]).toEqual([
      1,
      [false, true, false],
      [0, 2, 0],
      ['File is private'],
    ])
    expect([list.title() === typedInto, typedInto.value, standsOut(list.save())]).toEqual([true, TYPED, true])
    await list.answer(LEAVE)
    expect([list.questions(), list.active(), list.title().value, reads()]).toEqual([
      [],
      [false, false, true],
      FROM_SERVER,
      [0, 2, 1],
    ])
  })

  // An asset can be listed twice.
  // The clicked tile is the one picked, not the first of the two.
  it('lets a click go on to the very tile that was clicked when its asset is listed twice', async () => {
    assets = ['asset-3', 'asset-2', 'asset-3'].map((id) => onServer(id))
    const list = await openList()
    await typedIntoTheSecond(list)

    await list.pick(2)
    await list.answer(LEAVE)

    expect([list.questions(), list.active(), list.title().value, reads()]).toEqual([
      [],
      [false, false, true],
      FROM_SERVER,
      [0, 1, 1],
    ])
  })

  /*
   * The list can be read anew while the question is open, as the save of the upload queue does on its answer.
   * The clicked asset is then at another place in it, or gone.
   */
  describe('over a list read anew meanwhile', () => {
    const readAnew = async (list: List, now: string[]) => {
      assets = now.map((id) => onServer(id))
      list.page.querySelector('.mdi-refresh')!.closest('button')!.click()
      await settled()
      expect([list.order(), list.questions().length, reads()]).toEqual([now, 1, [0, 1, 0]])
    }
    const toTheThird: Array<[string, (list: List) => Promise<void>, string | null]> = [
      ['a click on a tile', (list) => list.pick(2), null],
      [
        'the pencil of a tile',
        async (list) => {
          list.pencil(2).click()
          await settled()
        },
        '1 / 3 asset-3',
      ],
    ]

    it.each(toTheThird)('lets %s go on to where its asset is by then', async (_way, go, detail) => {
      const list = await openList()
      await typedIntoTheSecond(list)
      await go(list)
      await readAnew(list, ['asset-3', 'asset-1', 'asset-2'])

      await list.answer(LEAVE)

      expect([list.questions(), list.active(), list.detail(), reads()]).toEqual([
        [],
        [true, false, false],
        detail,
        [0, 1, 1],
      ])
    })

    it.each(toTheThird)('lets %s go nowhere when its asset is in the list no more', async (_way, go) => {
      const list = await openList()
      const typedInto = await typedIntoTheSecond(list)
      await go(list)
      await readAnew(list, ['asset-1', 'asset-2'])

      await list.answer(LEAVE)

      expect([list.questions(), list.active(), list.detail(), list.address(), reads()]).toEqual([
        [],
        [false, true],
        null,
        LIST,
        [0, 1, 0],
      ])
      expect([list.title() === typedInto, typedInto.value, standsOut(list.save())]).toEqual([true, TYPED, true])
    })
  })

  // Nothing is left to draw the question.
  // The way that asked would wait for its answer forever.
  it('is answered "stay" when the page of the list goes under it: the next ask is a question again', async () => {
    const list = await openList()
    await typedIntoTheSecond(list)
    await list.pick(2)
    expect(list.questions()).toHaveLength(1)
    const { useAssetDetailStore } = await import('@/domains/coreDam/asset/store/assetDetailStore')
    const store = useAssetDetailStore()

    await list.leavePage()
    await settled()

    expect([store.leaveUnsavedQuestion, list.questions(), reads()]).toEqual([false, [], [0, 1, 0]])
    const told = vi.fn()
    void store.askToLeaveUnsaved().then(told)
    await settled()
    expect([store.leaveUnsavedQuestion, told.mock.calls]).toEqual([true, []])
  })

  /*
   * The store is emptied as a failed read empties it, written as the app start
   * writes an asset, and put behind its loader as the read after a bulk save does.
   * Behind that loader the typed text is not given up, unlike after
   * "Leave anyway". The next way to another asset asks again.
   */
  type StoreChange = (store: { reset: () => void; setAsset: (asset: never) => void; showLoader: () => void }) => void
  it.each<[string, StoreChange, boolean]>([
    ['is emptied', (store) => store.reset(), false],
    ['has an asset written into it', (store) => store.setAsset(onServer('asset-2') as never), false],
    ['goes behind its loader', (store) => store.showLoader(), true],
  ])('goes when the panel %s under it: nothing moves', async (_how, change, asksAgain) => {
    const list = await openList()
    await typedIntoTheSecond(list)
    await list.pick(2)
    expect(list.questions()).toHaveLength(1)
    const { useAssetDetailStore } = await import('@/domains/coreDam/asset/store/assetDetailStore')

    change(useAssetDetailStore())
    await settled()

    expect([list.questions(), list.active(), reads()]).toEqual([[], [false, true, false], [0, 1, 0]])
    await list.pick(2)
    expect([list.questions().length, list.active(), reads()]).toEqual(
      asksAgain ? [1, [false, true, false], [0, 1, 0]] : [0, [false, false, true], [0, 1, 1]]
    )
  })
})

describe('the rows of the list drawn as a table, with metadata typed into the panel and not saved', () => {
  beforeEach(() => {
    const assetFileProperties = { distributesInServices: [], slotNames: [], fromRss: false, width: 0, height: 0 }
    assets.forEach((asset) => inThePlaceOfItsVideo(onServer(asset.id, { assetFileProperties, podcasts: [] })))
  })

  it('ask as the tiles do: a click on another row', async () => {
    const list = await openList('table')
    const typedInto = await typedIntoTheSecond(list)

    await list.pick(2)

    expect([list.questions().length, list.active(), reads()]).toEqual([1, [false, true, false], [0, 1, 0]])
    await list.answer(STAY)
    expect([list.title() === typedInto, typedInto.value, reads()]).toEqual([true, TYPED, [0, 1, 0]])

    await list.pick(2)
    await list.answer(LEAVE)
    expect([list.questions(), list.active(), reads()]).toEqual([[], [false, false, true], [0, 1, 1]])
  })

  /*
   * The edit button of a row is a link to the detail page. Its plain click belongs to the router alone.
   * The list opens no detail of its own and reads nothing.
   */
  it('do nothing of their own for a plain click on the edit button of a row: its link is followed', async () => {
    const list = await openList('table')
    let arrive: () => void = () => undefined
    list.router.beforeEach(() => new Promise<void>((resolve) => (arrive = resolve)))

    list.tiles[2].querySelector<HTMLElement>('[data-cy="table-edit"]')!.click()
    await settled()

    expect([list.active(), list.detail(), list.address(), reads()]).toEqual([
      [false, false, false],
      null,
      LIST,
      [0, 0, 0],
    ])
    expect(list.panel().textContent).toContain('No asset selected')
    arrive()
    await settled()
    expect([list.router.currentRoute.value.path, reads()]).toEqual(['/assets/asset-3', [0, 0, 0]])
  })

  it('ask for a plain click on the edit button of a row, a link that leaves the list', async () => {
    const list = await openList('table')
    const typedInto = await typedIntoTheSecond(list)
    const edit = list.tiles[2].querySelector<HTMLElement>('[data-cy="table-edit"]')!

    edit.click()
    await settled()

    expect([list.questions().length, list.router.currentRoute.value.path, list.active(), reads()]).toEqual([
      1,
      LIST,
      [false, true, false],
      [0, 1, 0],
    ])
    await list.answer(STAY)
    expect([list.questions(), list.router.currentRoute.value.path, list.detail(), reads()]).toEqual([
      [],
      LIST,
      null,
      [0, 1, 0],
    ])
    expect([list.title() === typedInto, typedInto.isConnected, typedInto.value]).toEqual([true, true, TYPED])
    expect(standsOut(list.save())).toBe(true)

    edit.click()
    await settled()
    await list.answer(LEAVE)
    expect([list.questions(), list.router.currentRoute.value.path, reads()]).toEqual([[], '/assets/asset-3', [0, 1, 0]])
  })

  /*
   * A double click on the edit button is two clicks of the button.
   * It is not a double click of the row, which would open the detail of the list.
   */
  const doubleClick = (on: HTMLElement, held: MouseEventInit = {}) => {
    on.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail: 1, ...held }))
    on.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail: 2, ...held }))
    on.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true, detail: 2, ...held }))
  }

  it('do nothing of their own for a double click on the edit button of a row: its link is followed', async () => {
    const list = await openList('table')
    const arrive: Array<() => void> = []
    list.router.beforeEach(() => new Promise<void>((resolve) => arrive.push(resolve)))

    doubleClick(list.tiles[2].querySelector<HTMLElement>('[data-cy="table-edit"]')!)
    await settled()

    expect([list.active(), list.detail(), list.address(), reads()]).toEqual([
      [false, false, false],
      null,
      LIST,
      [0, 0, 0],
    ])
    arrive.forEach((go) => go())
    await settled()
    expect([list.router.currentRoute.value.path, reads()]).toEqual(['/assets/asset-3', [0, 0, 0]])
  })

  it('ask once for a double click on the edit button of a row, and "Leave anyway" follows its link', async () => {
    const list = await openList('table')
    await typedIntoTheSecond(list)

    doubleClick(list.tiles[2].querySelector<HTMLElement>('[data-cy="table-edit"]')!)
    await settled()

    expect([list.questions().length, list.router.currentRoute.value.path, list.active(), reads()]).toEqual([
      1,
      LIST,
      [false, true, false],
      [0, 1, 0],
    ])
    await list.answer(LEAVE)
    expect([list.questions(), list.router.currentRoute.value.path, reads()]).toEqual([[], '/assets/asset-3', [0, 1, 0]])
  })

  // With a key held, the browser opens the link elsewhere on each of the two clicks.
  // The list does nothing of its own.
  it('do nothing of their own for a double click on the edit button of a row with Ctrl held', async () => {
    const list = await openList('table')

    doubleClick(list.tiles[2].querySelector<HTMLElement>('[data-cy="table-edit"]')!, { ctrlKey: true })
    await settled()

    expect([list.detail(), list.router.currentRoute.value.path, reads()]).toEqual([null, LIST, [0, 0, 0]])
  })

  it('open the detail of the list for a double click on a row, as they always did', async () => {
    const list = await openList('table')

    doubleClick(list.tiles[2])
    await settled()

    expect([list.detail(), list.active(), list.router.currentRoute.value.path]).toEqual([
      '3 / 3 asset-3',
      [false, false, true],
      LIST,
    ])
  })

  /*
   * With a key held or another button, the router leaves the link to the browser, which opens it elsewhere.
   * The list stays as it is with the typed text. It opens no detail beside the tab and asks nothing.
   */
  it.each<[string, MouseEventInit]>([
    ['Ctrl held', { ctrlKey: true }],
    ['Cmd held', { metaKey: true }],
    ['Shift held', { shiftKey: true }],
    ['Alt held', { altKey: true }],
    ['another button', { button: 1 }],
  ])('do nothing of their own for a click on the edit button of a row with %s', async (_how, held) => {
    const list = await openList('table')
    const typedInto = await typedIntoTheSecond(list)
    const edit = list.tiles[2].querySelector<HTMLElement>('[data-cy="table-edit"]')!

    edit.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, ...held }))
    await settled()

    expect([list.questions().length, list.router.currentRoute.value.path, list.detail(), reads()]).toEqual([
      0,
      LIST,
      null,
      [0, 1, 0],
    ])
    expect([list.title() === typedInto, typedInto.value, list.active()]).toEqual([true, TYPED, [false, true, false]])
  })
})
