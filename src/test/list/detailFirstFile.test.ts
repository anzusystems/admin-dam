import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { RouterView } from 'vue-router'

import { assetDetail, assetFile, createFakeDam, queueRow } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamAnswer } from '@/test/support/fakeDam'
import { buttonsNamed, customField, eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/* "Create empty asset" makes an asset with no file, and its detail opens; the first file is put into a slot of it in
 * the "Sloty" tab, and becomes its main file. The server fills in the metadata of an asset that is not described from
 * that file as it processes it, so a form read before that is older than what the server has once it is done: the
 * detail learns of that first file as of any main file the server is done with - its page reads the asset with no
 * loader, the form taken in place while nothing is typed into it, "Save" held back otherwise. The real pages - the list
 * with its dialog, its panel and its upload queue, the page of an asset - the real listener of the notifications, and
 * the application around them as it starts; the server is a fake, and so are the connection its notifications come by
 * and the address the page asks about a new version of the application. */

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

const TYPED = 'typed and not saved'
const FROM_FILE = 'filled in from the file'
const STILL_PROCESSED = 'The file is still being processed.'
const PROCESSED_OPEN_AGAIN = 'The file is processed. Saving becomes possible after the detail is opened again.'
const FAILED_OPEN_AGAIN = 'Processing of the file failed. You can save after opening the asset again.'
const WITHOUT_FILE = 'Asset is without file'
const FAILED = 'Asset file processing failed'

const LIST = '/assets'
/** The asset created empty, and the first file put into its slot. */
const ASSET = '11111111-2222-4333-8444-555555555555'
const FILE = 'aaaaaaaa-2222-4333-8444-555555555555'
/** Another asset of the list, with a file of its own. */
const OTHER = '22222222-2222-4333-8444-555555555555'

type FileStatus = 'stored' | 'processed' | 'failed'

/** How far the server is with the first file of the asset: null while the asset has none. */
let fileIs: FileStatus | null = null

const fileOnServer = (fileId: string, status: FileStatus, assetId: string) => ({
  ...assetFile(fileId, status, { asset: assetId }),
  _resourceName: 'imageFile',
  imageAttributes: { width: 800, height: 450, ratioWidth: 16, ratioHeight: 9, mostDominantColor: '#cccccc' },
  mainRoute: null,
})

/** An asset as the server holds it now: an image of the licence of the user, not described. Of the asset created
 * empty the server fills in the metadata from its first file as it processes it. */
const onServer = (id: string) => {
  const status = id === ASSET ? fileIs : 'processed'

  return {
    ...assetDetail(id, {
      attributes: { assetType: 'image', assetStatus: status === 'processed' ? 'with_file' : 'draft' },
      licence: 1,
      flags: { described: false, visible: true },
      mainFile: status ? fileOnServer(id === ASSET ? FILE : 'file-of-other', status, id) : null,
      metadata: {
        customData: { title: status === 'processed' ? FROM_FILE : '' },
        authorSuggestions: {},
        keywordSuggestions: {},
      },
    }),
    keywords: [],
    authors: [],
  }
}

/** Its one slot, empty until the first file is put into it. */
const slotsOnServer = () => ({
  data: [
    {
      id: 'slot-default',
      slotName: 'default',
      default: true,
      main: !!fileIs,
      assetFile: fileIs ? fileOnServer(FILE, fileIs, ASSET) : null,
    },
  ],
  totalCount: 1,
})

const settled = () => vi.advanceTimersByTimeAsync(100)
/** Long enough for whatever the news sets off to have answered. */
const answered = () => vi.advanceTimersByTimeAsync(1_000)

/** How many times the server was asked for the asset. */
const reads = () => server.assetReads(ASSET)

/** The server says by its notification what became of the first file, having brought it there. */
const notify = async (status: 'processed' | 'failed', assetId = ASSET, fileId = FILE) => {
  if (assetId === ASSET) fileIs = status
  const name = status === 'processed' ? 'asset_file_processed' : 'asset_file_failed'
  listeners.forEach((listener) => listener({ name, data: { asset: assetId, id: fileId, failReason: 'unknown' } }))
  await settled()
}

const menu = () => document.body.querySelector('.v-menu.v-overlay--active')
const dialogOfList = () => document.body.querySelector<HTMLElement>('.dam-image-detail-dialog.v-overlay--active')
const panel = () => document.body.querySelector<HTMLElement>('.v-navigation-drawer--right')!

const start = async () => {
  const ui = await startUploadUi({
    server,
    grants: ['dam_asset_update', 'dam_image_update'],
    extSystem: { image: { slots: ['default'] } },
    customForm: { image: [customField('title')] },
    // The upload of the first file into the slot of the asset: its file is with the server, which processes it.
    queues: {
      slots: [queueRow({ type: 'slotFile', status: 'processing', assetId: ASSET, fileId: FILE, slotName: 'default' })],
    },
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

const onThePageOfTheAsset: Place = async () => {
  const ui = await start()
  const View = (await import('@/domains/coreDam/asset/components/detail/AssetDetailView.vue')).default
  ui.router.addRoute({ path: '/assets/:id', name: '/(coreDam)/assets/[id]', component: View })
  await ui.router.push('/assets/' + ASSET)
  const page = await ui.mount(async () => ({ default: RouterView }))

  return { ui, form: () => page }
}

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
    /** "Save" of the form: whether it is held back, and whether the form says why - still processed, or processed. */
    save: () => ({
      heldBack: buttonsNamed(form()!, 'Save')[0]?.disabled,
      saysWhy: [STILL_PROCESSED, PROCESSED_OPEN_AGAIN].some((line) => form()!.textContent?.includes(line)),
    }),
    /** Whether the form says the text. */
    says: (text: string) => !!form()!.textContent?.includes(text),
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
// Held back for a file that failed: what the line under "Save" says is that it failed.
const HELD_BACK_FAILED = { heldBack: true, saysWhy: false }
const FREE = { heldBack: false, saysWhy: false }

beforeEach(() => {
  listeners.length = 0
  server = createFakeDam()
  fileIs = null
  server.assetBy(ASSET, () => onServer(ASSET))
  server.assetBy(OTHER, () => onServer(OTHER))
  server.slotsBy(ASSET, slotsOnServer)
  const empty = (): FakeDamAnswer => ({ status: 200, data: { data: [] } })
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
  server.fileBy('image', FILE, () => fileOnServer(FILE, fileIs ?? 'stored', ASSET))
  // The window is one for the whole file, and so is its address.
  window.history.replaceState(null, '', LIST)
})

afterEach(() => {
  stopUploadUi()
})

/* The upload queue wrote the processed file into the detail, and nothing read the asset: the form stayed the one
 * read before the file, empty, and "Save" was free - a save wrote it over what the server had filled in. */
describe('the form of an asset created empty, once the first file put into its slot is processed', () => {
  it.each<[string, Place]>([...ofTheList, ['the page of the asset', onThePageOfTheAsset]])(
    'is read anew in %s while nothing was typed into it: it is the form the server filled in from the file',
    async (_where, place) => {
      const form = await openForm(place)
      expect([form.save(), form.title()?.value, form.says(WITHOUT_FILE)]).toEqual([FREE, '', true])

      await notify('processed')
      await eventually(() => expect(form.title()?.value).toBe(FROM_FILE))
      await answered()

      expect([form.save(), form.says(WITHOUT_FILE), await form.cardOffers(), form.ui.alerts()]).toEqual([
        FREE,
        false,
        ['Make public'],
        [],
      ])
    }
  )

  // The form is the one read before the server filled in the metadata: saved, it would write over them.
  it.each(ofTheList)(
    'keeps what was typed into it in %s, and "Save" held back: only its file is as the server has it',
    async (_where, place) => {
      const form = await openForm(place)
      const typedInto = await form.typeTitle()
      expect(form.save()).toEqual(FREE)

      await notify('processed')
      await answered()

      // No loader went over the form: the very field that was typed into.
      expect([form.title() === typedInto, typedInto.isConnected, typedInto.value]).toEqual([true, true, TYPED])
      expect([form.save(), await form.cardOffers(), form.ui.alerts()]).toEqual([HELD_BACK, ['Make public'], []])
    }
  )

  // Without a notification: the refresh of the row of the upload reads the asset for it.
  it('is read anew once the upload queue has read the asset with its first file processed', async () => {
    const form = await openForm(inTheDetailOfTheList)
    const before = reads()

    fileIs = 'processed'
    await form.ui.store.refreshQueueItem(form.ui.rows.slots[0])
    await eventually(() => expect(form.title()?.value).toBe(FROM_FILE))

    expect([reads() > before + 1, form.save(), form.ui.alerts()]).toEqual([true, FREE, []])
  })

  // The guard: a first file the queue reads still on its way holds "Save" back, as any main file on its way does.
  it('shows the first file still on its way with "Save" held back, and comes free once it is processed', async () => {
    const form = await openForm(inThePanelBesideTheList)

    fileIs = 'stored'
    await form.ui.store.refreshQueueItem(form.ui.rows.slots[0])
    await eventually(() => expect(form.save()).toEqual(HELD_BACK))
    expect(form.title()?.value).toBe('')

    await notify('processed')
    await eventually(() => expect(form.title()?.value).toBe(FROM_FILE))
    expect([form.save(), form.ui.alerts()]).toEqual([FREE, []])
  })

  // The server can have saved metadata filled in from a file it failed after that: as with a processed one.
  it('takes a first file that failed under what was typed, with "Save" held back and the card saying it failed', async () => {
    const form = await openForm(inThePanelBesideTheList)
    const typedInto = await form.typeTitle()

    await notify('failed')
    await eventually(() => expect(form.says(FAILED)).toBe(true))
    await answered()

    expect([
      form.title() === typedInto,
      typedInto.value,
      form.save(),
      form.says(FAILED_OPEN_AGAIN),
      form.ui.alerts(),
    ]).toEqual([true, TYPED, HELD_BACK_FAILED, true, []])
  })

  // Held back by the state of the file while it is on its way; once it is processed, by the age of the form.
  it('keeps "Save" held back under what was typed while the first file is on its way, and once it is processed', async () => {
    const form = await openForm(inThePanelBesideTheList)
    const typedInto = await form.typeTitle()

    fileIs = 'stored'
    await form.ui.store.refreshQueueItem(form.ui.rows.slots[0])
    await eventually(() => expect(form.save()).toEqual(HELD_BACK))
    await notify('processed')
    await answered()

    expect([form.title() === typedInto, typedInto.value, form.save(), form.ui.alerts()]).toEqual([
      true,
      TYPED,
      HELD_BACK,
      [],
    ])
  })

  it('keeps "Save" held back under what was typed once the first file on its way has failed', async () => {
    const form = await openForm(inThePanelBesideTheList)
    const typedInto = await form.typeTitle()

    fileIs = 'stored'
    await form.ui.store.refreshQueueItem(form.ui.rows.slots[0])
    await eventually(() => expect(form.save()).toEqual(HELD_BACK))
    await notify('failed')
    await eventually(() => expect(form.says(FAILED)).toBe(true))
    await answered()

    expect([
      form.title() === typedInto,
      typedInto.value,
      form.save(),
      form.says(FAILED_OPEN_AGAIN),
      form.ui.alerts(),
    ]).toEqual([true, TYPED, HELD_BACK_FAILED, true, []])
  })

  // The guard: a file of another asset is no news to it.
  it('is not read for a file the server has processed of another asset', async () => {
    const form = await openForm(inThePanelBesideTheList)
    await answered()
    const before = reads()

    await notify('processed', OTHER, 'file-of-other')
    await answered()

    expect([reads(), form.title()?.value, form.save(), form.says(WITHOUT_FILE)]).toEqual([before, '', FREE, true])
  })
})
