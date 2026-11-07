import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { RouterView } from 'vue-router'

import { assetDetail, assetFile, createFakeDam, queueRow } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamAnswer } from '@/test/support/fakeDam'
import { buttonsNamed, customField, eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/*
 * The server holds an asset as a draft until it has processed a file of
 * it, also while the main file is on its way, failed or a duplicate.
 * A detail that took the main file under typed text keeps the asset
 * state it was read with (draft), even once the file is processed.
 * The box above the form says the asset has no file only while it has no main file.
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
const STILL_PROCESSED = 'The file is still being processed.'
const WITHOUT_FILE = 'Asset is without file'
const FAILED = 'Asset file processing failed'
const DUPLICATE = 'Asset main file is duplicate'

const LIST = '/assets'
const ASSET = '11111111-2222-4333-8444-555555555555'
const FILE = 'aaaaaaaa-2222-4333-8444-555555555555'
const OTHER = '22222222-2222-4333-8444-555555555555'

type FileStatus = 'stored' | 'processed' | 'failed' | 'duplicate'

let fileIs: FileStatus | null = null
let inQueue = true

const fileOnServer = (fileId: string, status: FileStatus, assetId: string) => ({
  ...assetFile(fileId, status, { asset: assetId, originAssetFile: status === 'duplicate' ? 'file-origin' : null }),
  _resourceName: 'imageFile',
  imageAttributes: { width: 800, height: 450, ratioWidth: 16, ratioHeight: 9, mostDominantColor: '#cccccc' },
  mainRoute: null,
})

const onServer = (id: string) => {
  const status = id === ASSET ? fileIs : 'processed'

  return {
    ...assetDetail(id, {
      attributes: { assetType: 'image', assetStatus: status === 'processed' ? 'with_file' : 'draft' },
      licence: 1,
      flags: { described: false, visible: true },
      mainFile: status ? fileOnServer(id === ASSET ? FILE : 'file-of-other', status, id) : null,
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

const processed = async () => {
  fileIs = 'processed'
  listeners.forEach((listener) => listener({ name: 'asset_file_processed', data: { asset: ASSET, id: FILE } }))
  await settled()
}

const dialogOfList = () => document.body.querySelector<HTMLElement>('.dam-image-detail-dialog.v-overlay--active')
const panel = () => document.body.querySelector<HTMLElement>('.v-navigation-drawer--right')!

const start = async () => {
  const ui = await startUploadUi({
    server,
    grants: ['dam_asset_update', 'dam_image_update', 'dam_image_delete'],
    extSystem: { image: { slots: ['default'] } },
    customForm: { image: [customField('title')] },
    queues: inQueue
      ? {
          slots: [
            queueRow({ type: 'slotFile', status: 'processing', assetId: ASSET, fileId: FILE, slotName: 'default' }),
          ],
        }
      : {},
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
  ['the detail of the list', inTheDetailOfTheList],
  ['the panel beside the list', inThePanelBesideTheList],
]
const everywhere: Array<[string, Place]> = [...ofTheList, ['the page of the asset', onThePageOfTheAsset]]

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
    saveHeldBack: () => buttonsNamed(form()!, 'Save')[0]?.disabled,
    says: (text: string) => !!form()!.textContent?.includes(text),
  }
}

beforeEach(() => {
  listeners.length = 0
  server = createFakeDam()
  fileIs = null
  inQueue = true
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
  server.on('DELETE', /^\/adm\/v1\/image\/([^/]+)$/, () => {
    fileIs = null

    return { status: 204 }
  })
  server.fileBy('image', 'file-origin', () => ({
    ...fileOnServer('file-origin', 'processed', OTHER),
    id: 'file-origin',
  }))
  // The window is one for the whole file, and so is its address.
  window.history.replaceState(null, '', LIST)
})

afterEach(() => {
  stopUploadUi()
})

/*
 * The box said "Asset is without file" for every draft.
 * That was wrong once the first file was processed under typed text, and
 * for a main file on its way or a duplicate, while the file card showed it.
 */
describe('the box above the form of an asset with a main file', () => {
  it.each(ofTheList)(
    'says nothing of an asset without a file in %s once its first file is processed under what was typed',
    async (_where, place) => {
      const form = await openForm(place)
      expect(form.says(WITHOUT_FILE)).toBe(true)
      const typedInto = await form.typeTitle()
      const before = server.assetReads(ASSET)

      await processed()
      await eventually(() => expect(server.assetReads(ASSET)).toBe(before + 1))
      await answered()

      expect([form.title() === typedInto, typedInto.value, form.saveHeldBack()]).toEqual([true, TYPED, true])
      expect([form.says(WITHOUT_FILE), form.ui.alerts()]).toEqual([false, []])
    }
  )

  it('says nothing of an asset without a file once the upload queue has read its first file on its way under what was typed', async () => {
    const form = await openForm(inThePanelBesideTheList)
    await form.typeTitle()

    fileIs = 'stored'
    await form.ui.store.refreshQueueItem(form.ui.rows.slots[0])
    await eventually(() => expect(form.says(STILL_PROCESSED)).toBe(true))

    expect([form.says(WITHOUT_FILE), form.ui.alerts()]).toEqual([false, []])
  })

  it.each(everywhere)(
    'says nothing of an asset without a file in %s while its main file is on its way',
    async (_where, place) => {
      fileIs = 'stored'

      const form = await openForm(place)

      expect([form.says(STILL_PROCESSED), form.says(WITHOUT_FILE)]).toEqual([true, false])
    }
  )

  it('says only that the main file is a duplicate', async () => {
    fileIs = 'duplicate'

    const form = await openForm(inThePanelBesideTheList)

    expect([form.says(DUPLICATE), form.says(WITHOUT_FILE)]).toEqual([true, false])
  })

  it('says only that the main file failed', async () => {
    fileIs = 'failed'

    const form = await openForm(inThePanelBesideTheList)

    expect([form.says(FAILED), form.says(WITHOUT_FILE)]).toEqual([true, false])
  })
})

/*
 * Under typed text the detail took the main file the server has by now, but kept the asset state as it was read.
 * So the picture of a first processed file was not drawn, and an
 * asset whose only file was deleted was not said to have none.
 */
describe('the detail of an asset whose main file changed under what was typed', () => {
  it('draws the picture of its first file once that is processed', async () => {
    const form = await openForm(inTheDetailOfTheList)
    const picture = () => ({
      drawn: !!dialogOfList()?.querySelector('.dam-image-detail__left .asset-image--component'),
      placeholder: !!dialogOfList()?.querySelector('.dam-image-detail__left .mdi-image-off'),
    })
    expect(picture()).toEqual({ drawn: false, placeholder: true })
    const typedInto = await form.typeTitle()
    const before = server.assetReads(ASSET)

    await processed()
    await eventually(() => expect(server.assetReads(ASSET)).toBe(before + 1))
    await answered()

    expect([form.title() === typedInto, typedInto.value, picture()]).toEqual([
      true,
      TYPED,
      { drawn: true, placeholder: false },
    ])
  })

  it('says the asset has no file once its only file is deleted in the Slots tab', async () => {
    fileIs = 'processed'
    inQueue = false
    const form = await openForm(inTheDetailOfTheList)
    expect(form.says(WITHOUT_FILE)).toBe(false)
    await form.typeTitle()
    const tab = async (dataCy: string) => {
      dialogOfList()!.querySelector<HTMLElement>(`[data-cy="${dataCy}"]`)!.click()
      await settled()
    }
    await tab('button-slots')
    const row = () =>
      Array.from(dialogOfList()!.querySelectorAll<HTMLElement>('.pa-4.pb-8')).find((slot) =>
        slot.querySelector('.font-weight-bold')?.textContent?.trim().startsWith('default')
      )
    await eventually(() => expect(row()).toBeTruthy())

    row()!.querySelector('[data-cy="button-slot-actions"]')!.closest('button')!.click()
    const remove = await eventually(() => {
      const item = Array.from(
        document.body.querySelectorAll<HTMLElement>('.v-menu.v-overlay--active .v-list-item')
      ).find((listed) => listed.textContent?.trim() === 'Remove')
      expect(item).toBeTruthy()

      return item!
    })
    remove.click()
    const confirm = await eventually(() => {
      const button = document.body.querySelector<HTMLButtonElement>('.v-dialog [data-cy="button-remove"]')
      expect(button).not.toBeNull()

      return button!
    })
    const before = server.assetReads(ASSET)
    confirm.click()
    await eventually(() => expect(server.assetReads(ASSET)).toBe(before + 1))
    await answered()
    await tab('button-meta')
    await eventually(() => expect(form.title()).not.toBeNull())

    expect([form.title()?.value, form.says(WITHOUT_FILE), form.ui.alerts()]).toEqual([TYPED, true, []])
  })
})

describe('the box above the form of an asset without a main file', () => {
  it.each(everywhere)('says the asset has no file in %s', async (_where, place) => {
    const form = await openForm(place)

    expect(form.says(WITHOUT_FILE)).toBe(true)
  })
})
