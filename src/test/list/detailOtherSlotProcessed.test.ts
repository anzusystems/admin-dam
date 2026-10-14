import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { RouterView } from 'vue-router'

import { assetDetail, assetFile, createFakeDam, queueRow } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamAnswer } from '@/test/support/fakeDam'
import { buttonsNamed, customField, eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/* The server fills in the metadata of an asset that is not described from whichever of its files it processes first,
 * not from its main file alone: a file put into another slot of the asset as well. The detail learns of such a file as
 * of its main file - by the notification, and by the read of the upload queue that settles the row of its upload -
 * and reads the asset with no loader: with nothing typed the form takes it in its place, with something typed "Save"
 * is held back, as the form is older than what the server filled in. Not for an asset that is described. The real
 * pages, the real listener of the notifications, and the application around them as it starts; the server is a fake,
 * and so are the connection its notifications come by and the address the page asks about a new version of the
 * application. */

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

/** How far the server is with each of the two files of the asset, and whether the asset is described. */
let fileIs: Record<string, FileStatus> = {}
let described = false

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
    flags: { described, visible: true },
    mainFile: fileOnServer(id === ASSET ? FILE : 'file-of-other', id),
    // What the server has filled in from the file of the other slot, once it has processed it.
    metadata: {
      customData: { title: fileIs[IN_SLOT] === 'processed' ? FROM_SERVER : '' },
      authorSuggestions: {},
      keywordSuggestions: {},
    },
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

/** The server says by its notification that it has processed the file, having done so. */
const processed = async (fileId: string, assetId = ASSET) => {
  fileIs[fileId] = 'processed'
  listeners.forEach((listener) => listener({ name: 'asset_file_processed', data: { asset: assetId, id: fileId } }))
  await settled()
}

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

/** The upload into the other slot of the asset, in the cases that have one: its file is with the server. */
let inQueue = false

const start = async () => {
  const ui = await startUploadUi({
    server,
    grants: ['dam_asset_update', 'dam_image_update'],
    extSystem: { image: { slots: ['default', 'extra'] } },
    customForm: { image: [customField('title')] },
    queues: inQueue
      ? {
          slots: [
            queueRow({ type: 'slotFile', status: 'processing', assetId: ASSET, fileId: IN_SLOT, slotName: 'extra' }),
          ],
        }
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
const FREE = { heldBack: false, saysWhy: false }

beforeEach(() => {
  listeners.length = 0
  server = createFakeDam()
  inQueue = false
  described = false
  fileIs = { [FILE]: 'stored', [IN_SLOT]: 'stored' }
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

/* The detail heard only of the main file: a file of another slot processed meanwhile filled in the metadata, and
 * "Save" came free over a form older than they are once the main file was done with - as a duplicate, say. */
describe('a form whose asset has a file of another slot processed while it is open', () => {
  it('keeps what was typed into it, and "Save" held back also once its main file is found a duplicate', async () => {
    const form = await openForm(inThePanelBesideTheList)
    const typedInto = await form.typeTitle()

    await processed(IN_SLOT)
    await answered()
    expect([reads(), form.title() === typedInto, typedInto.value, form.save()]).toEqual([2, true, TYPED, HELD_BACK])

    await ended('duplicate')
    await answered()

    expect([form.title() === typedInto, typedInto.value, form.says(SAYS.duplicate), form.save()]).toEqual([
      true,
      TYPED,
      true,
      HELD_BACK,
    ])
  })

  it('is read anew while nothing was typed into it, its main file processed already', async () => {
    fileIs[FILE] = 'processed'
    const form = await openForm(inTheDetailOfTheList)
    expect([form.save(), form.title()?.value, reads()]).toEqual([FREE, '', 1])

    await processed(IN_SLOT)
    await eventually(() => expect(form.title()?.value).toBe(FROM_SERVER))

    expect([reads(), form.save(), form.ui.alerts()]).toEqual([2, FREE, []])
  })

  /* The notification settles the row of the upload into that slot as well, and the queue tells the detail of it too:
   * one read of the detail for both. (Without a notification the poll of the queue tells it, as it settles the row:
   * `slotFileTellsDetail.test.ts`.) */
  it('is read once when the notification and the upload queue both say the file is processed', async () => {
    inQueue = true
    const form = await openForm(inTheDetailOfTheList)

    await processed(IN_SLOT)
    await eventually(() => expect(form.title()?.value).toBe(FROM_SERVER))
    await answered()

    // The read of the detail, and the one of the queue that completes the row.
    expect([reads(), form.ui.rows.slots[0].status, form.ui.alerts()]).toEqual([3, 'uploaded', []])
  })

  /* "Save" sends the asset as described, and the server fills in nothing more of it from then on; the asset held in the
   * panel was not marked so, and the file was taken for news: "Save" held back over what was typed after the save. */
  it('is not read, nor "Save" held back, for a file of another slot once the form was saved', async () => {
    server.on('PATCH', /^\/adm\/v1\/asset\/metadata-bulk-update$/, (request) => ({
      status: 200,
      data: JSON.parse(request.data as string),
    }))
    fileIs[FILE] = 'processed'
    const form = await openForm(inThePanelBesideTheList)
    await form.typeTitle()
    buttonsNamed(panel(), 'Save')[0].click()
    await answered()
    const typedAgain = await form.typeTitle()

    await processed(IN_SLOT)
    await answered()

    expect([reads(), form.title() === typedAgain, form.save(), form.ui.alerts()]).toEqual([
      1,
      true,
      FREE,
      ['Record was updated'],
    ])
  })

  // The guard: the server leaves the metadata of an asset that is described alone.
  it('is not read for a file of another slot of an asset that is described', async () => {
    described = true
    const form = await openForm(inThePanelBesideTheList)

    await processed(IN_SLOT)
    await answered()

    expect([reads(), form.ui.alerts()]).toEqual([1, []])
  })
})
