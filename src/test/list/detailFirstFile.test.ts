import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { RouterView } from 'vue-router'

import { assetDetail, assetFile, createFakeDam, queueRow } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamAnswer } from '@/test/support/fakeDam'
import { buttonsNamed, customField, eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/*
 * "Create empty asset" makes an asset with no file and opens its detail. The
 * first file is put into a slot in the "Sloty" tab and becomes the main file.
 * The server fills in the metadata of an undescribed asset from that file
 * while processing it, so a form read earlier is older than the server data.
 * The detail treats this first file like any main file the server finishes: the page reads the asset
 * with no loader, and the form is taken in place if nothing is typed. Otherwise "Save" stays held back.
 */

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
const ASSET = '11111111-2222-4333-8444-555555555555'
const FILE = 'aaaaaaaa-2222-4333-8444-555555555555'
const OTHER = '22222222-2222-4333-8444-555555555555'

type FileStatus = 'stored' | 'processed' | 'failed'

let fileIs: FileStatus | null = null

const fileOnServer = (fileId: string, status: FileStatus, assetId: string) => ({
  ...assetFile(fileId, status, { asset: assetId }),
  _resourceName: 'imageFile',
  imageAttributes: { width: 800, height: 450, ratioWidth: 16, ratioHeight: 9, mostDominantColor: '#cccccc' },
  mainRoute: null,
})

/** The server fills in the metadata of an asset created empty from its first file while processing it. */
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
const answered = () => vi.advanceTimersByTimeAsync(1_000)

const reads = () => server.assetReads(ASSET)

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
    queues: {
      slots: [queueRow({ type: 'slotFile', status: 'processing', assetId: ASSET, fileId: FILE, slotName: 'default' })],
    },
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
  const { initAppNotificationListeners } = await import('@/domains/system/composables/appNotificationListeners')
  initAppNotificationListeners()
  const View = (await import('@/domains/coreDam/asset/components/list/AssetListView.vue')).default
  ui.router.addRoute({ path: LIST, name: '/(coreDam)/assets', component: View })

  return ui
}

type Ui = Awaited<ReturnType<typeof start>>

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
    save: () => ({
      heldBack: buttonsNamed(form()!, 'Save')[0]?.disabled,
      saysWhy: [STILL_PROCESSED, PROCESSED_OPEN_AGAIN].some((line) => form()!.textContent?.includes(line)),
    }),
    says: (text: string) => !!form()!.textContent?.includes(text),
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

/*
 * The upload queue wrote the processed file into the detail and nothing read the
 * asset. The form stayed the one read before the file, empty, and "Save" was free.
 * A save then overwrote what the server had filled in.
 */
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

  // The form was read before the server filled in the metadata, so saving it would overwrite them.
  it.each(ofTheList)(
    'keeps what was typed into it in %s, and "Save" held back: only its file is as the server has it',
    async (_where, place) => {
      const form = await openForm(place)
      const typedInto = await form.typeTitle()
      expect(form.save()).toEqual(FREE)

      await notify('processed')
      await answered()

      expect([form.title() === typedInto, typedInto.isConnected, typedInto.value]).toEqual([true, true, TYPED])
      expect([form.save(), await form.cardOffers(), form.ui.alerts()]).toEqual([HELD_BACK, ['Make public'], []])
    }
  )

  it('is read anew once the upload queue has read the asset with its first file processed', async () => {
    const form = await openForm(inTheDetailOfTheList)
    const before = reads()

    fileIs = 'processed'
    await form.ui.store.refreshQueueItem(form.ui.rows.slots[0])
    await eventually(() => expect(form.title()?.value).toBe(FROM_FILE))

    expect([reads() > before + 1, form.save(), form.ui.alerts()]).toEqual([true, FREE, []])
  })

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

  // The server can have saved metadata from a file that it failed afterwards, so this is handled like a processed file.
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

  it('is not read for a file the server has processed of another asset', async () => {
    const form = await openForm(inThePanelBesideTheList)
    await answered()
    const before = reads()

    await notify('processed', OTHER, 'file-of-other')
    await answered()

    expect([reads(), form.title()?.value, form.save(), form.says(WITHOUT_FILE)]).toEqual([before, '', FREE, true])
  })
})
