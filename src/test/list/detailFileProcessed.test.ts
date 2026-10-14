import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { RouterView } from 'vue-router'

import { assetDetail, assetFile, createFakeDam, queueRow } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamAnswer } from '@/test/support/fakeDam'
import { buttonsNamed, customField, eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/* A detail, or the panel beside the list, can be opened while the server is still processing the main file of the
 * asset - by the pencil of a row of the upload queue, during a long upload. "Save" of an asset that is not described
 * is held back then: the server may yet fill in its metadata from the file, and a form read before that would write
 * over them. That the file is processed the application learns from the server - by a notification, and by what the
 * upload queue reads for its rows - and the detail that holds the asset learns it then. The real pages - the list
 * with its dialog, its panel and its upload queue, the page of an asset, the page of the asset of a file - the real
 * listener of the notifications, and the application around them as it starts; the server is a fake, and so are the
 * connection its notifications come by and the address the page asks about a new version of the application. */

let server: FakeDam
const listeners: Array<(event: { name: string; data: unknown }) => void> = []

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))
vi.mock('@anzusystems/common-admin', async (importOriginal) => ({
  ...((await importOriginal()) as Record<string, unknown>),
  initDamNotifications: () => ({ openConnection: () => undefined }),
  useDamNotifications: () => ({
    addDamNotificationListener: (listener: (event: { name: string; data: unknown }) => void) => {
      listeners.push(listener)

      return () => undefined
    },
  }),
}))

const SEARCH = /^\/adm\/v1\/asset\/licence\/1(\/search)?$/
const BY_FILE = /^\/adm\/v1\/asset\/asset-file\/([^/]+)$/

const TYPED = 'typed and not saved'
const FROM_SERVER = 'from the server'
const STILL_PROCESSED = 'The file is still being processed.'

const LIST = '/assets'
/** The asset whose main file the server is processing, and that file. */
const ASSET = '11111111-2222-4333-8444-555555555555'
const FILE = 'aaaaaaaa-2222-4333-8444-555555555555'
/** A file in another slot of the asset, and another asset of the list. */
const IN_SLOT = 'bbbbbbbb-2222-4333-8444-555555555555'
const OTHER = '22222222-2222-4333-8444-555555555555'

type FileStatus = 'stored' | 'processed'

/** How far the server is with each of the two files of the asset, and which of them are public. */
let fileIs: Record<string, FileStatus> = {}
let published = new Set<string>()

const fileOnServer = (fileId: string, assetId = ASSET) => ({
  ...assetFile(fileId, fileIs[fileId] ?? 'processed', { asset: assetId }),
  _resourceName: 'imageFile',
  imageAttributes: { width: 800, height: 450, ratioWidth: 16, ratioHeight: 9, mostDominantColor: '#cccccc' },
  mainRoute: published.has(fileId) ? { id: 'route-' + fileId, publicUrl: 'https://dam.test/public/' + fileId } : null,
})

/** An asset as the server holds it now: an image of the licence of the user, not described. */
const onServer = (id: string) => ({
  ...assetDetail(id, {
    attributes: { assetType: 'image', assetStatus: 'with_file' },
    licence: 1,
    flags: { described: false, visible: true },
    mainFile: fileOnServer(id === ASSET ? FILE : 'file-of-other', id),
  }),
  keywords: [],
  authors: [],
})

const slotsOnServer = () => {
  const data = Object.entries({ default: FILE, extra: IN_SLOT }).map(([slotName, fileId]) => ({
    id: 'slot-' + slotName,
    slotName,
    default: slotName === 'default',
    main: fileId === FILE,
    assetFile: fileOnServer(fileId),
  }))

  return { data, totalCount: data.length }
}

const settled = () => vi.advanceTimersByTimeAsync(100)

/** How a read of the asset is answered: at once with what the server holds, unless a case holds it. */
let answerRead: () => unknown = () => onServer(ASSET)

/* The next read of the asset is held, every later one answers at once. Let go, it answers what the server held when
 * it was asked. */
const holdNextRead = () => {
  let letGo: () => void = () => undefined
  let asked = false
  answerRead = () => {
    if (asked) return onServer(ASSET)
    asked = true
    const asRead = onServer(ASSET)

    return new Promise((resolve) => (letGo = () => resolve(asRead)))
  }

  return () => {
    letGo()

    return settled()
  }
}

/** How many times the server was asked for the asset, by its own id or by the id of its file. */
const reads = () =>
  server.sent('GET').filter((request) => request.url === '/adm/v1/asset/' + ASSET || BY_FILE.test(request.url)).length

/** The server says by its notification that it has processed the file, having done so. */
const processed = async (fileId = FILE, assetId = ASSET) => {
  fileIs[fileId] = 'processed'
  listeners.forEach((listener) => listener({ name: 'asset_file_processed', data: { asset: assetId, id: fileId } }))
  await settled()
}

const menu = () => document.body.querySelector('.v-menu.v-overlay--active')
const dialogOfList = () => document.body.querySelector<HTMLElement>('.dam-image-detail-dialog.v-overlay--active')
const panel = () => document.body.querySelector<HTMLElement>('.v-navigation-drawer--right')!

/** The row of the asset in the upload queue, in the cases that have one: its file is with the server, and its
 * metadata can be edited. A notification of the file makes the queue read the asset for it. */
let inQueue = false

const start = async () => {
  const ui = await startUploadUi({
    server,
    grants: ['dam_asset_update', 'dam_image_update'],
    extSystem: { image: { slots: ['default', 'extra'] } },
    customForm: { image: [customField('title')] },
    queues: inQueue
      ? { global: [queueRow({ status: 'processing', canEditMetadata: true, assetId: ASSET, fileId: FILE })] }
      : {},
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
  // As the start of the application: the listener of the notifications of the server.
  const { initAppNotificationListeners } = await import('@/domains/system/composables/appNotificationListeners')
  initAppNotificationListeners()
  const View = (await import('@/domains/coreDam/asset/components/list/AssetListView.vue')).default
  ui.router.addRoute({ path: LIST, name: '/(coreDam)/assets', component: View })
  ui.router.addRoute({ path: '/settings', component: { render: () => null } })

  return ui
}

type Ui = Awaited<ReturnType<typeof start>>

/** A place the form of the asset is drawn in: opened, it answers the element the form is drawn in. */
type Place = () => Promise<{ ui: Ui; form: () => HTMLElement | null }>

const listOpened = async () => {
  const ui = await start()
  await ui.router.push(LIST)
  const page = await ui.mount(async () => ({ default: RouterView }))
  const tiles = () => Array.from(page.querySelectorAll<HTMLElement>('.dam-image-grid__item'))
  await eventually(() => expect(tiles()).toHaveLength(2))

  return { ui, tiles }
}

const inTheDetailOfTheList: Place = async () => {
  const { ui, tiles } = await listOpened()
  tiles()[0].querySelectorAll<HTMLButtonElement>('.detail-icon')[1].click()

  return { ui, form: dialogOfList }
}

const inThePanelBesideTheList: Place = async () => {
  const { ui, tiles } = await listOpened()
  tiles()[0].click()

  return { ui, form: panel }
}

/** The detail of the row of the upload queue: its pencil, from the queue drawn over the whole page. */
const inTheDetailOfTheQueueRow: Place = async () => {
  const { ui } = await listOpened()
  document.body.querySelector<HTMLButtonElement>('[data-cy="button-add-description"]')!.click()
  const edit = await eventually(() => {
    const queue = document.body.querySelector('.overlay--sidebar')
    expect(queue).not.toBeNull()

    return buttonsNamed(queue!, 'Edit more')[0]
  })
  edit.click()

  return { ui, form: dialogOfList }
}

/** The page of a detail, as the router draws it at the address. */
const onPage = async (name: string, path: string, load: () => Promise<{ default: unknown }>, address: string) => {
  const ui = await start()
  ui.router.addRoute({ path, name, component: (await load()).default as never })
  await ui.router.push(address)
  const page = await ui.mount(async () => ({ default: RouterView }))

  return { ui, form: () => page }
}

const onThePageOfTheAsset: Place = () =>
  onPage(
    '/(coreDam)/assets/[id]',
    '/assets/:id',
    () => import('@/domains/coreDam/asset/components/detail/AssetDetailView.vue'),
    '/assets/' + ASSET
  )

const onThePageOfTheFile: Place = () =>
  onPage(
    '/(coreDam)/assets/file/[id]',
    '/assets/file/:id',
    () => import('@/domains/coreDam/asset/components/detail/AssetFileDetailView.vue'),
    '/assets/file/' + FILE
  )

const ofTheList: Array<[string, Place]> = [
  ['the detail of the asset', inTheDetailOfTheList],
  ['the panel beside the list', inThePanelBesideTheList],
]

/** The form of the asset, opened in the place and drawn: what a case reads of it. */
const openForm = async (place: Place) => {
  const { ui, form } = await place()
  const title = () => form()?.querySelector<HTMLTextAreaElement>('textarea') ?? null
  await eventually(() => expect(title()).not.toBeNull())

  return {
    ui,
    title,
    typeTitle: async () => {
      const field = title()!
      field.value = TYPED
      field.dispatchEvent(new Event('input'))
      await nextTick()

      return field
    },
    /** "Save" of the form: whether it is held back, and whether the form says why. */
    save: () => ({
      heldBack: buttonsNamed(form()!, 'Save')[0]?.disabled,
      saysWhy: !!form()!.textContent?.includes(STILL_PROCESSED),
    }),
    /** What the menu of the file card offers: null when the card draws no menu. */
    cardOffers: async () => {
      const button = form()!.querySelector('.mdi-dots-vertical')?.closest('button')
      if (!button) return null
      button.click()
      await eventually(() => expect(menu()).not.toBeNull())
      const items = Array.from(menu()!.querySelectorAll<HTMLElement>('.v-list-item')).map((item) =>
        item.textContent?.trim()
      )
      button.click()
      await eventually(() => expect(menu()).toBeNull())

      return items
    },
  }
}

const HELD_BACK = { heldBack: true, saysWhy: true }
const FREE = { heldBack: false, saysWhy: false }

beforeEach(() => {
  listeners.length = 0
  server = createFakeDam()
  inQueue = false
  fileIs = { [FILE]: 'stored', [IN_SLOT]: 'processed' }
  published = new Set()
  answerRead = () => onServer(ASSET)
  server.assetBy(ASSET, () => answerRead())
  server.assetBy(OTHER, () => onServer(OTHER))
  server.slotsBy(ASSET, slotsOnServer)
  const empty = (): FakeDamAnswer => ({ status: 200, data: { data: [] } })
  server.on('GET', BY_FILE, async () => ({ status: 200, data: structuredClone(await answerRead()) }))
  server.on('GET', SEARCH, () => ({
    status: 200,
    data: { data: [onServer(ASSET), onServer(OTHER)], hasNextPage: false },
  }))
  server.on('GET', /^\/adm\/v1\/asset-licence\/1$/, () => ({
    status: 200,
    data: { id: 1, name: 'Licence', extSystem: 1 },
  }))
  server.on('GET', /^\/adm\/v1\/ext-system\/1$/, () => ({ status: 200, data: { id: 1, name: 'Ext system' } }))
  server.on('GET', /^\/adm\/v1\/distribution\/asset(-file)?\/[^/]+$/, empty)
  server.on('GET', /^\/adm\/v1\/(keyword|author)\/ext-system\/1\/search$/, empty)
  // The file of an image, as the row of its slot reads it to draw it.
  for (const fileId of [FILE, IN_SLOT]) server.fileBy('image', fileId, () => fileOnServer(fileId))
  // The window is one for the whole file, and so is its address.
  window.history.replaceState(null, '', LIST)
})

afterEach(() => {
  stopUploadUi()
})

/* Nothing told the open detail that the file was processed: "Save" stayed held back, with the text that says the
 * file is still being processed, until the asset was opened again. */
describe('a form opened while the main file of its asset was being processed, once the server says it is processed', () => {
  it.each(ofTheList)('is read anew in %s while nothing was typed into it: "Save" comes free', async (_where, place) => {
    const form = await openForm(place)
    expect([form.save(), await form.cardOffers(), reads()]).toEqual([HELD_BACK, null, 1])

    await processed()
    await eventually(() => expect(form.save()).toEqual(FREE))

    // Read once, whole: the form is as the server has it now, and the file can be made public.
    expect([reads(), form.title()?.value, await form.cardOffers(), form.ui.alerts()]).toEqual([
      2,
      FROM_SERVER,
      ['Make public'],
      [],
    ])
  })

  /* The form is the one read before the server was done with the file, and may be older than the metadata the
   * server has filled in since: "Save" stays held back. What is held of the file is brought up to date all the same. */
  it.each(ofTheList)(
    'keeps what was typed into it in %s, and "Save" held back: only its file is as the server has it',
    async (_where, place) => {
      const form = await openForm(place)
      const typedInto = await form.typeTitle()
      expect([form.save(), await form.cardOffers()]).toEqual([HELD_BACK, null])

      await processed()
      await eventually(() => expect(reads()).toBe(2))
      await settled()

      // No loader went over the form: the very field that was typed into.
      expect([form.title() === typedInto, typedInto.isConnected, typedInto.value]).toEqual([true, true, TYPED])
      expect([form.save(), await form.cardOffers(), form.ui.alerts()]).toEqual([HELD_BACK, ['Make public'], []])
    }
  )

  it.each<[string, Place]>([
    ['the page of an asset', onThePageOfTheAsset],
    ['the page of the asset of a file', onThePageOfTheFile],
  ])('is read anew on %s', async (_where, place) => {
    const form = await openForm(place)
    expect([form.save(), reads()]).toEqual([HELD_BACK, 1])

    await processed()
    await eventually(() => expect(form.save()).toEqual(FREE))

    expect([reads(), form.title()?.value, form.ui.alerts()]).toEqual([2, FROM_SERVER, []])
  })

  /* Without a notification the upload queue learns it by a read of the asset: by its poll, or by the refresh button
   * of the row. The detail of the row is the one opened by its pencil. */
  it('is read anew in the detail of a row of the upload queue, once the queue has read the asset as processed', async () => {
    inQueue = true
    const form = await openForm(inTheDetailOfTheQueueRow)
    expect([form.save(), reads()]).toEqual([HELD_BACK, 1])

    fileIs[FILE] = 'processed'
    await form.ui.store.refreshQueueItem(form.ui.rows.global[0])
    await eventually(() => expect(form.save()).toEqual(FREE))

    // The read of the queue, and the read of the detail it led to.
    expect([reads(), form.ui.rows.global[0].status, form.ui.alerts()]).toEqual([3, 'uploaded', []])
  })

  /* The news can come while the asset is being read, and that read can still bring the file as not processed: the
   * asset is read once more as it lands. */
  it('is read once more when the read that was on its way brought the file as not processed yet', async () => {
    const letRead = holdNextRead()
    const { ui, tiles } = await listOpened()
    tiles()[0].querySelectorAll<HTMLButtonElement>('.detail-icon')[1].click()
    await settled()
    expect(reads()).toBe(1)

    await processed()
    expect(reads()).toBe(1)
    await letRead()

    await eventually(() => expect(reads()).toBe(2))
    await eventually(() => expect(buttonsNamed(dialogOfList()!, 'Save')[0]?.disabled).toBe(false))
    expect([dialogOfList()!.textContent?.includes(STILL_PROCESSED), ui.alerts()]).toEqual([false, []])
  })
})

describe('a form that has nothing to learn from a file the server has processed', () => {
  // The guard: the read that was on its way brought the file as processed already.
  it('is not read again when the read that was on its way brought the file as processed', async () => {
    const { tiles } = await listOpened()
    const letRead = holdNextRead()
    // The server is done before the detail asks.
    fileIs[FILE] = 'processed'
    tiles()[0].querySelectorAll<HTMLButtonElement>('.detail-icon')[1].click()
    await settled()

    await processed()
    await letRead()
    await eventually(() => expect(buttonsNamed(dialogOfList()!, 'Save')[0]?.disabled).toBe(false))
    await settled()

    expect(reads()).toBe(1)
  })

  /* The guard: the file is of another asset. (A file in another slot of its asset, the asset not described, is news:
   * the server may have filled in the metadata from it - `detailOtherSlotProcessed.test.ts`.) */
  it('is not read again for the file of another asset', async () => {
    const form = await openForm(inTheDetailOfTheList)

    await processed('file-of-other', OTHER)
    await processed(FILE, OTHER)

    expect([reads(), form.save(), form.ui.alerts()]).toEqual([1, HELD_BACK, []])
  })

  // The guard: the page that drew the form is left, and the store of the detail holds its asset still.
  it('is not read again once the page of the asset was left', async () => {
    const form = await openForm(onThePageOfTheAsset)
    // Over the dialogs the page has mounted, a navigation waits for a timer of theirs before it goes on.
    const left = form.ui.router.push('/settings')
    await settled()
    await left

    await processed()

    expect([reads(), form.ui.alerts()]).toEqual([1, []])
  })
})

/* The server makes public only a file it has processed, and answers any other with a refusal that gives no reason. */
describe('"Make public" of a file', () => {
  // The guard: a public file keeps its menu, whatever is held of how far it is processed.
  it('leaves a public file its menu, with its address and "Make private", while it is held as not processed', async () => {
    published = new Set([FILE])
    const form = await openForm(inTheDetailOfTheList)

    expect(await form.cardOffers()).toEqual(['Copy URL', 'Make private'])
  })

  it('is offered in the row of a slot only for a file the server has processed, and no menu is drawn without it', async () => {
    fileIs = { [FILE]: 'processed', [IN_SLOT]: 'stored' }
    await openForm(inTheDetailOfTheList)
    dialogOfList()!.querySelector<HTMLElement>('[data-cy="button-slots"]')!.click()
    const slotRow = (name: string) =>
      Array.from(dialogOfList()!.querySelectorAll<HTMLElement>('.sidebar-info__content .pa-4.pb-8')).find((row) =>
        row.querySelector('.font-weight-bold')?.textContent?.trim().startsWith(name)
      )
    await eventually(() => expect([slotRow('default'), slotRow('extra')].every(Boolean)).toBe(true))

    // The menu of the file of the row, beside the chip that says the file is private: not the menu of the slot.
    const routeMenuOf = (name: string) => slotRow(name)!.querySelector('.mdi-dots-vertical')?.closest('button')
    expect([!!routeMenuOf('default'), !!routeMenuOf('extra')]).toEqual([true, false])
    routeMenuOf('default')!.click()
    await eventually(() =>
      expect(
        Array.from(menu()?.querySelectorAll('.v-list-item') ?? []).map((item) => item.textContent?.trim())
      ).toEqual(['Make public'])
    )
  })
})
