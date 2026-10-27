import type { UploadQueueItem } from '@anzusystems/common-admin'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { RouterView } from 'vue-router'

import { assetDetail, assetFile, createFakeDam, httpError, queueRow } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamAnswer } from '@/test/support/fakeDam'
import { buttonsNamed, customField, eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/*
 * The detail opens from the list (pencil, double click, "Edit more") and
 * from elsewhere (a just created asset, the edit of an upload queue row).
 * Opened from the list it walks the list with two buttons, a counter and the arrow keys.
 * Opened from elsewhere it belongs to no tile, has none of these, and the list keys are not its own.
 */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const SEARCH = /^\/adm\/v1\/asset\/licence\/1(\/search)?$/
const CREATE = /^\/adm\/v1\/asset\/licence\/1$/

const RIGHT = 'ArrowRight'
const LEFT = 'ArrowLeft'
const EDIT = 'Edit more'
const NO_ROWS = 'No matching assets found'
const SYSTEM_ERROR = 'System error, try again later or contact administrator'

const LIST = '/assets'
const UPLOADED = 'asset-9'

const onServer = (id: string, over: Record<string, unknown> = {}) => ({
  ...assetDetail(id, { attributes: { assetType: 'video', assetStatus: 'with_file' }, ...over }),
  keywords: [],
  authors: [],
})

let assets: ReturnType<typeof onServer>[] = []

const settled = () => vi.advanceTimersByTimeAsync(100)

const arrow = async (key: typeof RIGHT | typeof LEFT) => {
  document.body.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }))
  await settled()
}

const reads = () => ['asset-1', 'asset-2', 'asset-3'].map((assetId) => server.assetReads(assetId))

const address = () => window.location.pathname

const detail = () => document.body.querySelector<HTMLElement>('.dam-image-detail-dialog.v-overlay--active')

const shown = () =>
  Array.from(detail()?.querySelectorAll('.v-toolbar .text-label-large > div') ?? [])
    .map((part) => part.textContent?.trim())
    .join(' ')

const held = () => detail()?.querySelector('.anzu-copy-text > span')?.textContent?.trim() ?? null

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

const watchFor = (selector: string) => {
  let drawn = false
  const look = (records: MutationRecord[]) => {
    const added = records.flatMap((record) => Array.from(record.addedNodes)) as Array<Partial<Element>>
    drawn ||= added.some((node) => node.matches?.(selector) || !!node.querySelector?.(selector))
  }
  const observer = new MutationObserver(look)
  observer.observe(document.body, { childList: true, subtree: true })

  return () => {
    look(observer.takeRecords())

    return drawn
  }
}

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
  await eventually(() =>
    assets.length ? expect(tiles()).toHaveLength(assets.length) : expect(page.textContent).toContain(NO_ROWS)
  )
  const panel = () => document.body.querySelector<HTMLElement>('.v-navigation-drawer--right')!
  const queue = () => document.body.querySelector<HTMLElement>('.overlay--sidebar')
  const editRow = async () => {
    const edit = await eventually(() => {
      const button = queue() ? buttonsNamed(queue()!, EDIT)[0] : undefined
      expect(button?.disabled).toBe(false)

      return button!
    })
    edit.click()
  }

  return {
    ...ui,
    page,
    panel,
    tiles,
    queue,
    editRow,
    active: () => tiles().map((tile) => tile.classList.contains('dam-image-grid__item--active')),
    pick: async (index: number) => {
      tiles()[index].click()
      await settled()
    },
    pencil: (index: number) => tiles()[index].querySelectorAll<HTMLButtonElement>('.detail-icon')[1],
    editMore: async () => {
      buttonsNamed(panel(), EDIT)[0].click()
      await eventually(() => expect(detail()).not.toBeNull())
    },
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
      // The menu stays open under the new detail until the first click into it, and holds the keys meanwhile.
      const into = detail()!.querySelector('.v-toolbar')!
      into.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
      into.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await eventually(() => expect(document.body.querySelector('.v-menu.v-overlay--active')).toBeNull())
    },
    openUploadQueue: () => {
      document.body.querySelector<HTMLButtonElement>('[data-cy="button-add-description"]')!.click()

      return eventually(() => expect(queue()).not.toBeNull())
    },
    editUploaded: async () => {
      document.body.querySelector<HTMLButtonElement>('[data-cy="button-add-description"]')!.click()
      await editRow()
      await eventually(() => expect(held()).toBe(UPLOADED))
    },
    openMassEdit: async (index: number) => {
      tiles()[index].dispatchEvent(new MouseEvent('click', { bubbles: true, ctrlKey: true }))
      const open = await eventually(() => {
        const footer = document.body.querySelector('.asset-footer__selected')
        const button = footer ? buttonsNamed(footer, 'Edit')[0] : undefined
        expect(button).toBeTruthy()

        return button!
      })
      open.click()
      await eventually(() => expect(queue()).not.toBeNull())
    },
    hideUploadQueue: async () => {
      queue()!.querySelector('.mdi-chevron-down')!.closest('button')!.click()
      await eventually(() => expect(queue()).toBeNull())
    },
    readAnew: async (order: string[]) => {
      assets = order.map((id) => onServer(id))
      page.querySelector('.mdi-refresh')!.closest('button')!.click()
      await settled()
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
  server.on('POST', CREATE, () => ({
    status: 201,
    data: onServer('asset-new', { attributes: { assetType: 'image', assetStatus: 'draft' }, mainFile: null }),
  }))
  server.asset(onServer('asset-new', { attributes: { assetType: 'image', assetStatus: 'draft' }, mainFile: null }))
  // The window is one for the whole file, and so is its address.
  window.history.replaceState(null, '', LIST)
})

afterEach(() => {
  stopUploadUi()
})

type List = Awaited<ReturnType<typeof openList>>

const notOfList: Array<[string, (list: List) => Promise<void>, string]> = [
  ['an asset just created', (list) => list.createEmpty(), 'asset-new'],
  ['a row of the upload queue', (list) => list.editUploaded(), UPLOADED],
]

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
  it.each(notOfList)(
    'do nothing in the detail of %s: no neighbour of a tile is read into it',
    async (_of, open, id) => {
      const list = await openList()
      await list.pick(1)
      await open(list)
      expect([held(), shown()]).toEqual([id, id])

      await arrow(RIGHT)
      await arrow(LEFT)

      expect([held(), shown(), address()]).toEqual([id, id, LIST])
      expect([list.active(), reads()]).toEqual([
        [false, true, false],
        [0, 1, 0],
      ])
    }
  )

  it('do nothing in the detail of an asset just created while no tile is active', async () => {
    const list = await openList()
    await list.createEmpty()

    await arrow(RIGHT)

    expect([held(), address(), list.active(), reads()]).toEqual(['asset-new', LIST, [false, false, false], [0, 0, 0]])
  })

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

/*
 * The place of the asset in the list used to share one block with its name.
 * A detail that is not of the list has no place, and the bar then showed nothing.
 */
describe('the bar of a detail that is not of the list', () => {
  const NAMED = 'A photo with a name of its own'

  it('says the name of its asset, and no place in the list', async () => {
    server.asset(
      onServer(UPLOADED, {
        attributes: { assetType: 'image', assetStatus: 'with_file' },
        texts: { displayTitle: NAMED },
        mainFile: assetFile('file-9', 'processed', { asset: UPLOADED }),
      })
    )
    const list = await openList()
    await list.pick(1)

    await list.editUploaded()

    expect([shown(), held(), bar().previous, bar().next]).toEqual([NAMED, UPLOADED, null, null])

    await closeDetail()
    await list.hideUploadQueue()
    list.pencil(1).click()
    await eventually(() => expect(shown()).toBe('2 / 3 asset-2'))
  })

  it('says nothing for an asset that has no name', async () => {
    server.on('POST', CREATE, () => ({
      status: 201,
      data: onServer('asset-new', {
        attributes: { assetType: 'image', assetStatus: 'draft' },
        texts: { displayTitle: '' },
        mainFile: null,
      }),
    }))
    const list = await openList()

    await list.createEmpty()

    expect([shown(), held(), bar().previous, bar().next]).toEqual(['', 'asset-new', null, null])
  })
})

describe('"Edit more" of the panel beside the list', () => {
  /*
   * The detail opened last leaves its view behind, and closing it does not restore the view.
   * Without its own view, the detail of the panel had no buttons,
   * counter or name after a detail that was not of the list.
   */
  it.each(afterNotOfList)(
    'opens a detail of the list for the asset of the active tile, also after the detail of %s',
    async (_of, before) => {
      const list = await openList()
      await before(list)
      await list.pick(1)

      await list.editMore()

      expect([shown(), held(), address()]).toEqual(['2 / 3 asset-2', 'asset-2', '/assets/asset-2'])
      expect([bar().previous?.disabled, bar().next?.disabled]).toEqual([false, false])
      await arrow(RIGHT)
      expect(shown()).toBe('3 / 3 asset-3')
      bar().previous!.click()
      await settled()
      expect([shown(), address()]).toEqual(['2 / 3 asset-2', '/assets/asset-2'])
    }
  )

  it.each(afterNotOfList)(
    'opens a detail that is not of the list while the panel holds %s',
    async (_of, before, id) => {
      const list = await openList()
      await list.pick(1)
      await before(list)
      expect(list.panel().querySelector('.anzu-copy-text > span')?.textContent).toBe(id)

      await list.editMore()

      expect([shown(), held(), bar().previous, bar().next]).toEqual([id, id, null, null])
      await arrow(RIGHT)
      await arrow(LEFT)
      expect([held(), list.active(), reads()]).toEqual([id, [false, true, false], [0, 1, 0]])
    }
  )

  it('opens a detail of the list at the place the asset of the active tile has in a list read anew', async () => {
    const list = await openList()
    list.pencil(1).click()
    await eventually(() => expect(shown()).toBe('2 / 3 asset-2'))
    await closeDetail()
    await list.readAnew(['asset-1', 'asset-3', 'asset-2'])
    expect(list.active()).toEqual([false, false, true])

    await list.editMore()

    expect([shown(), held(), bar().previous?.disabled, bar().next?.disabled]).toEqual([
      '3 / 3 asset-2',
      'asset-2',
      false,
      true,
    ])
    await arrow(LEFT)
    expect([shown(), held(), reads()]).toEqual(['2 / 3 asset-3', 'asset-3', [0, 1, 1]])
  })

  it('opens a detail that is not of the list while the list read anew holds its asset no more', async () => {
    const list = await openList()
    list.pencil(1).click()
    await eventually(() => expect(shown()).toBe('2 / 3 asset-2'))
    await closeDetail()
    await list.readAnew(['asset-1', 'asset-3'])
    expect(list.active()).toEqual([false, false])

    await list.editMore()

    expect([shown(), held(), bar().previous, bar().next]).toEqual(['asset-2', 'asset-2', null, null])
    await arrow(RIGHT)
    expect([held(), reads()]).toEqual(['asset-2', [0, 1, 0]])
  })

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

/* The detail is drawn by the page, not by the rows of its list. A list with no rows or one being read draws no rows. */
describe('the detail of an asset while the list draws no rows', () => {
  it.each(notOfList)('opens over a list with no rows for %s', async (_of, open, id) => {
    assets = []
    const list = await openList()

    await open(list)

    expect([held(), shown(), address(), list.tiles()]).toEqual([id, id, LIST, []])
  })

  it('opens over a list with no rows by "Edit more" of the panel, for the asset the panel holds', async () => {
    assets = []
    const list = await openList()
    await list.createEmpty()
    await closeDetail()
    expect(list.panel().querySelector('.anzu-copy-text > span')?.textContent).toBe('asset-new')

    await list.editMore()

    expect([held(), shown()]).toEqual(['asset-new', 'asset-new'])
  })

  it('opens by "Edit more" of the panel after a list read anew came with no rows', async () => {
    const list = await openList()
    await list.pick(1)
    await list.readAnew([])
    expect(list.page.textContent).toContain(NO_ROWS)

    await list.editMore()

    expect([held(), shown(), bar().previous, bar().next]).toEqual(['asset-2', 'asset-2', null, null])
  })

  /*
   * The list is read anew under an open detail when the save of the
   * upload queue answers. A loader stands in place of the rows meanwhile.
   */
  it('stays as it is while the list is read anew under it, and once the list is there again', async () => {
    const list = await openList()
    list.pencil(1).click()
    await eventually(() => expect(shown()).toBe('2 / 3 asset-2'))
    const title = detail()!.querySelector<HTMLTextAreaElement>('textarea')!
    title.value = 'typed and not saved'
    title.dispatchEvent(new Event('input'))
    await nextTick()
    let answer: () => void = () => undefined
    server.on(
      'GET',
      SEARCH,
      () =>
        new Promise<FakeDamAnswer>((resolve) => {
          answer = () => resolve({ status: 200, data: { data: assets.map((asset) => structuredClone(asset)) } })
        })
    )

    list.page.querySelector('.mdi-refresh')!.closest('button')!.click()
    await settled()

    expect([list.tiles(), shown(), title.isConnected, title.value]).toEqual([
      [],
      '2 / 3 asset-2',
      true,
      'typed and not saved',
    ])
    answer()
    await settled()
    expect([list.tiles().length, shown(), title.isConnected, title.value]).toEqual([
      3,
      '2 / 3 asset-2',
      true,
      'typed and not saved',
    ])
  })
})

/*
 * The store the detail is drawn from outlives the list page, and other pages write into it.
 * The detail page of an asset (edit button of a table row, link of a duplicate)
 * opens its asset there and leaves it open when left by the browser back button.
 */
describe('the detail of an asset on the way into the page of the list', () => {
  const ELSEWHERE = '11111111-2222-4333-8444-555555555555'

  it('is not drawn from what the page of the detail of an asset left open', async () => {
    server.asset(onServer(ELSEWHERE, { licence: 1 }))
    const list = await openList()
    const Standalone = (await import('@/domains/coreDam/asset/components/detail/AssetDetailView.vue')).default
    list.router.addRoute({ path: '/assets/:id', name: '/(coreDam)/assets/[id]', component: Standalone })
    void list.router.push('/assets/' + ELSEWHERE)
    await eventually(() => expect(list.page.querySelector('.dam-image-detail .anzu-copy-text > span')).not.toBeNull())
    const { useAssetDetailStore } = await import('@/domains/coreDam/asset/store/assetDetailStore')
    expect([useAssetDetailStore().detail, useAssetDetailStore().asset?.id]).toEqual([true, ELSEWHERE])
    const wasDrawn = watchFor('.dam-image-detail-dialog')

    list.router.back()
    await settled()
    await eventually(() => expect(list.tiles()).toHaveLength(3))

    expect([wasDrawn(), detail(), list.panel().textContent]).toEqual([false, null, 'No asset selected'])
    list.pencil(1).click()
    await eventually(() => expect(shown()).toBe('2 / 3 asset-2'))
    expect(wasDrawn()).toBe(true)
  })
})

/*
 * The upload queue and the mass edit are drawn over the whole page and turn the list keys off.
 * The detail of one of their rows turns the keys on again as it closes.
 * So does a failed read of a row, since the queue is still over the list.
 */
describe('the arrow keys of the list under a queue drawn over the whole page', () => {
  const readAlone = () =>
    server.sent('GET', /^\/adm\/v1\/asset\/asset-\d$/).map((request) => request.url.split('/').pop())

  it('do nothing once the detail of a row of the upload queue is closed, until the queue is put away', async () => {
    const list = await openList()
    await list.pick(0)
    await list.editUploaded()
    await closeDetail()
    expect(list.queue()).not.toBeNull()

    await arrow(RIGHT)
    await arrow(LEFT)

    expect([list.active(), reads(), address()]).toEqual([[true, false, false], [1, 0, 0], LIST])
    expect(list.panel().querySelector('.anzu-copy-text > span')?.textContent).toBe(UPLOADED)

    await list.hideUploadQueue()
    await arrow(RIGHT)
    expect([list.active(), reads(), address()]).toEqual([[false, true, false], [1, 1, 0], LIST])
  })

  it('do nothing once the read of a row of the upload queue failed, until the queue is put away', async () => {
    server.assetBy(UPLOADED, () => {
      throw httpError(500)
    })
    const list = await openList()
    await list.pick(0)
    await list.openUploadQueue()
    await list.editRow()
    await eventually(() => expect(list.alerts()).toEqual([SYSTEM_ERROR]))
    expect([detail(), list.queue() === null]).toEqual([null, false])

    await arrow(RIGHT)
    await arrow(LEFT)

    expect([list.active(), reads()]).toEqual([
      [true, false, false],
      [1, 0, 0],
    ])

    await list.hideUploadQueue()
    await arrow(RIGHT)
    expect([list.active(), reads()]).toEqual([
      [false, true, false],
      [1, 1, 0],
    ])
  })

  it('do nothing once the detail of a row of the mass edit is closed, until the queue is put away', async () => {
    const list = await openList()
    await list.pick(0)
    await list.openMassEdit(2)
    await list.editRow()
    await eventually(() => expect(held()).toBe('asset-3'))
    await closeDetail()
    expect([list.queue() === null, readAlone()]).toEqual([false, ['asset-1', 'asset-3']])

    await arrow(RIGHT)
    await arrow(LEFT)

    expect([list.active(), readAlone()]).toEqual([
      [true, false, false],
      ['asset-1', 'asset-3'],
    ])

    await list.hideUploadQueue()
    await arrow(RIGHT)
    expect([list.active(), readAlone()]).toEqual([
      [false, true, false],
      ['asset-1', 'asset-3', 'asset-2'],
    ])
  })

  it('walk the list while a queue is drawn small, under the list', async () => {
    const list = await openList()
    await list.pick(0)
    expect([list.queue(), document.body.querySelector('[data-cy="button-add-description"]') === null]).toEqual([
      null,
      false,
    ])

    await arrow(RIGHT)

    expect([list.active(), reads()]).toEqual([
      [false, true, false],
      [1, 1, 0],
    ])
  })
})
