import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { RouterView } from 'vue-router'

import { assetDetail, assetFile, createFakeDam, queueRow } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamAnswer } from '@/test/support/fakeDam'
import { buttonsNamed, customField, eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/* A detail, or the panel beside the list, can be opened while the server is still processing the main file of the
 * asset; "Save" of an asset that is not described is held back then. The processing can end otherwise than processed:
 * the file failed, or it is a duplicate of a file the server has already. The detail learns of that as of a processed
 * file - by the notification, and by what the upload queue reads for its rows - its page reads the asset with no
 * loader, its card says what became of the file, and "Save" follows that: the server fills in nothing from such a
 * file. The real pages, the real listener of the notifications, and the application around them as it starts; the
 * server is a fake, and so are the connection its notifications come by and the address the page asks about a new
 * version of the application. */

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
const FAILED_OPEN_AGAIN = 'Processing of the file failed. You can save after opening the asset again.'
/** What the card says of a main file that failed, and of one that is a duplicate. */
const SAYS = { failed: 'Asset file processing failed', duplicate: 'Asset main file is duplicate' }

const LIST = '/assets'
/** The asset whose main file the server is processing, and that file. */
const ASSET = '11111111-2222-4333-8444-555555555555'
const FILE = 'aaaaaaaa-2222-4333-8444-555555555555'
/** A file in another slot of the asset, and another asset of the list. */
const IN_SLOT = 'bbbbbbbb-2222-4333-8444-555555555555'
const OTHER = '22222222-2222-4333-8444-555555555555'

type Ended = 'failed' | 'duplicate'
type FileStatus = 'stored' | 'processed' | Ended

/** How far the server is with each of the two files of the asset. */
let fileIs: Record<string, FileStatus> = {}

const fileOnServer = (fileId: string, assetId = ASSET) => ({
  ...assetFile(fileId, fileIs[fileId] ?? 'processed', {
    asset: assetId,
    originAssetFile: fileIs[fileId] === 'duplicate' ? 'file-origin' : null,
  }),
  _resourceName: 'imageFile',
  imageAttributes: { width: 800, height: 450, ratioWidth: 16, ratioHeight: 9, mostDominantColor: '#cccccc' },
  mainRoute: null,
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
/** Long enough for whatever the news sets off to have answered. */
const answered = () => vi.advanceTimersByTimeAsync(1_000)

/** How many times the page asked for the asset, by its own id or by the id of its file. */
const reads = () =>
  server.sent('GET').filter((request) => request.url === '/adm/v1/asset/' + ASSET || BY_FILE.test(request.url)).length

/** The server says by its notification that it has ended the processing of the file so, having done so. */
const ended = async (status: Ended, fileId = FILE, assetId = ASSET) => {
  fileIs[fileId] = status
  const event =
    status === 'failed'
      ? { name: 'asset_file_failed', data: { asset: assetId, id: fileId, failReason: 'unknown' } }
      : {
          name: 'asset_file_duplicate',
          data: { asset: assetId, id: fileId, originAssetFile: 'file-origin', assetType: 'image' },
        }
  listeners.forEach((listener) => listener(event))
  await settled()
}

const dialogOfList = () => document.body.querySelector<HTMLElement>('.dam-image-detail-dialog.v-overlay--active')
const panel = () => document.body.querySelector<HTMLElement>('.v-navigation-drawer--right')!

/** The row of the asset in the upload queue, in the cases that have one. */
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
    /** Whether the form says the text. */
    says: (text: string) => !!form()!.textContent?.includes(text),
  }
}

const HELD_BACK = { heldBack: true, saysWhy: true }
// Held back for a file that failed: what the line under "Save" says is that it failed.
const HELD_BACK_FAILED = { heldBack: true, saysWhy: false }
const FREE = { heldBack: false, saysWhy: false }

beforeEach(() => {
  listeners.length = 0
  server = createFakeDam()
  inQueue = false
  fileIs = { [FILE]: 'stored', [IN_SLOT]: 'processed' }
  server.assetBy(ASSET, () => onServer(ASSET))
  server.assetBy(OTHER, () => onServer(OTHER))
  server.slotsBy(ASSET, slotsOnServer)
  const empty = (): FakeDamAnswer => ({ status: 200, data: { data: [] } })
  server.on('GET', BY_FILE, () => ({ status: 200, data: onServer(ASSET) }))
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
  // The file of an image, as the row of its slot reads it to draw it, and the original of a duplicate.
  for (const fileId of [FILE, IN_SLOT]) server.fileBy('image', fileId, () => fileOnServer(fileId))
  server.fileBy('image', 'file-origin', () => ({ ...fileOnServer('file-origin', OTHER), id: 'file-origin' }))
  // The window is one for the whole file, and so is its address.
  window.history.replaceState(null, '', LIST)
})

afterEach(() => {
  stopUploadUi()
})

/* Nothing told the open detail: it stayed at "The file is still being processed", "Save" held back, until the asset
 * was opened again. */
describe('a form opened while the main file of its asset was being processed, once the server ended it otherwise', () => {
  it.each<[Ended]>([['failed'], ['duplicate']])(
    'is read anew in the detail of the list while nothing was typed into it: the card says it %s, "Save" comes free',
    async (status) => {
      const form = await openForm(inTheDetailOfTheList)
      expect([form.save(), form.says(SAYS[status]), reads()]).toEqual([HELD_BACK, false, 1])

      await ended(status)
      await eventually(() => expect(form.save()).toEqual(FREE))

      expect([reads(), form.title()?.value, form.says(SAYS[status]), form.ui.alerts()]).toEqual([
        2,
        FROM_SERVER,
        true,
        [],
      ])
    }
  )

  /* The server saves the metadata it fills in from the file before the processing of the file is over, and what fails
   * after that fails the file: the form can be older than the metadata, as with a processed file. */
  it('keeps what was typed into the panel beside the list, says the file failed, and "Save" stays held back', async () => {
    const form = await openForm(inThePanelBesideTheList)
    const typedInto = await form.typeTitle()
    expect(form.save()).toEqual(HELD_BACK)

    await ended('failed')
    await eventually(() => expect(form.says(SAYS.failed)).toBe(true))
    await answered()

    // No loader went over the form: the very field that was typed into.
    expect([form.title() === typedInto, typedInto.isConnected, typedInto.value]).toEqual([true, true, TYPED])
    expect([reads(), form.save(), form.says(FAILED_OPEN_AGAIN), form.ui.alerts()]).toEqual([
      2,
      HELD_BACK_FAILED,
      true,
      [],
    ])
  })

  // A duplicate is found before anything of the file is saved: the server filled in nothing, what was typed can be.
  it('keeps what was typed into the panel beside the list, says the file is a duplicate, and "Save" comes free', async () => {
    const form = await openForm(inThePanelBesideTheList)
    const typedInto = await form.typeTitle()

    await ended('duplicate')
    await eventually(() => expect(form.save()).toEqual(FREE))
    await answered()

    expect([form.title() === typedInto, typedInto.value, form.says(SAYS.duplicate), form.ui.alerts()]).toEqual([
      true,
      TYPED,
      true,
      [],
    ])
  })

  it.each<[string, Place]>([
    ['the page of an asset', onThePageOfTheAsset],
    ['the page of the asset of a file', onThePageOfTheFile],
  ])('is read anew on %s', async (_where, place) => {
    const form = await openForm(place)
    expect([form.save(), reads()]).toEqual([HELD_BACK, 1])

    await ended('failed')
    await eventually(() => expect(form.save()).toEqual(FREE))

    expect([reads(), form.says(SAYS.failed), form.ui.alerts()]).toEqual([2, true, []])
  })

  // Without a notification the upload queue learns it by a read of the asset: here by the refresh button of the row.
  it('is read anew once the upload queue has read the asset with its main file failed', async () => {
    inQueue = true
    const form = await openForm(inTheDetailOfTheList)
    expect([form.save(), reads()]).toEqual([HELD_BACK, 1])

    fileIs[FILE] = 'failed'
    await form.ui.store.refreshQueueItem(form.ui.rows.global[0])
    await eventually(() => expect(form.save()).toEqual(FREE))

    // The read of the queue, and the read of the detail it led to.
    expect([reads(), form.says(SAYS.failed), form.ui.alerts()]).toEqual([3, true, []])
  })

  // The guard: a file in another slot of the asset is not its main file.
  /* A file of another slot that failed can have had the metadata filled in from it before it failed: the asset is
   * read again for it, as for one processed. Not for a file of another asset. */
  it('is read again for a file in another slot of its asset that failed, not for the file of another asset', async () => {
    const form = await openForm(inTheDetailOfTheList)

    await ended('failed', IN_SLOT)
    await ended('duplicate', 'file-of-other', OTHER)
    await answered()

    expect([reads(), form.save(), form.ui.alerts()]).toEqual([2, HELD_BACK, []])
  })
})
