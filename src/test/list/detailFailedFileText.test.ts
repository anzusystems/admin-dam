import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { RouterView } from 'vue-router'

import { assetDetail, assetFile, createFakeDam } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamAnswer } from '@/test/support/fakeDam'
import {
  buttonsNamed,
  customField,
  dialogButton,
  eventually,
  startUploadUi,
  stopUploadUi,
} from '@/test/support/uploadUi'

/* Under what was typed, a main file the server failed holds "Save" back as a processed one does: the server can have
 * filled in the metadata from it before it failed. Nothing is left to be processed then, and the line under "Save" says
 * so - the file failed, and "Save" comes with opening the asset again; it does, once what was typed is left. A main file
 * still on its way keeps the line it had. The real pages - the list with its dialog and its panel, the page of an asset
 * - the real listener of the notifications, and the application around them as it starts; the server is a fake, and
 * so are the connection its notifications come by and the address the page asks about a new version of the
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

const TYPED = 'typed and not saved'
const FROM_SERVER = 'from the server'
const STILL_PROCESSED = 'The file is still being processed.'
const FAILED_OPEN_AGAIN = 'Processing of the file failed. You can save after opening the asset again.'
const FAILED = 'Asset file processing failed'
const UNSAVED = 'Unsaved changes'
const LEAVE = 'Leave anyway'
const DELETE = 'Delete'
const BEING_DELETED = 'Asset will be removed soon'

const LIST = '/assets'
/** The asset whose main file the server is processing, and that file; another asset of the list. */
const ASSET = '11111111-2222-4333-8444-555555555555'
const FILE = 'aaaaaaaa-2222-4333-8444-555555555555'
const OTHER = '22222222-2222-4333-8444-555555555555'

/** How far the server is with the main file of the asset. */
let fileIs: 'stored' | 'failed' = 'stored'

const fileOnServer = (fileId: string, assetId: string) => ({
  ...assetFile(fileId, fileId === FILE ? fileIs : 'processed', { asset: assetId }),
  _resourceName: 'imageFile',
  imageAttributes: { width: 800, height: 450, ratioWidth: 16, ratioHeight: 9, mostDominantColor: '#cccccc' },
  mainRoute: null,
})

/** An asset as the server holds it now: an image of the licence of the user, not described. */
const onServer = (id: string) => ({
  ...assetDetail(id, {
    attributes: { assetType: 'image', assetStatus: id === ASSET ? 'draft' : 'with_file' },
    licence: 1,
    flags: { described: false, visible: true },
    mainFile: fileOnServer(id === ASSET ? FILE : 'file-of-other', id),
  }),
  keywords: [],
  authors: [],
})

const settled = () => vi.advanceTimersByTimeAsync(100)
/** Long enough for whatever the news sets off to have answered. */
const answered = () => vi.advanceTimersByTimeAsync(1_000)

/** The server says by its notification that the main file failed, having failed it. */
const failed = async () => {
  fileIs = 'failed'
  listeners.forEach((listener) =>
    listener({ name: 'asset_file_failed', data: { asset: ASSET, id: FILE, failReason: 'unknown' } })
  )
  await settled()
}

const dialogOfList = () => document.body.querySelector<HTMLElement>('.dam-image-detail-dialog.v-overlay--active')
const panel = () => document.body.querySelector<HTMLElement>('.v-navigation-drawer--right')!

/** The open question about what was typed, answered "Leave anyway". */
const leave = async () => {
  await eventually(() => expect(buttonsNamed(document.body, LEAVE)).toHaveLength(1))
  expect(document.body.textContent).toContain(UNSAVED)
  buttonsNamed(document.body, LEAVE)[0].click()
  await settled()
}

const start = async () => {
  const ui = await startUploadUi({
    server,
    grants: ['dam_asset_update', 'dam_asset_delete', 'dam_image_update'],
    extSystem: { image: { slots: ['default'] } },
    customForm: { image: [customField('title')] },
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

  return ui
}

type Ui = Awaited<ReturnType<typeof start>>

/** A place the form of the asset is drawn in: opened, it answers the element the form is drawn in, and what opens the
 * asset there again. */
type Place = () => Promise<{ ui: Ui; form: () => HTMLElement | null; openAgain: () => Promise<void> }>

const listOpened = async () => {
  const ui = await start()
  const View = (await import('@/domains/coreDam/asset/components/list/AssetListView.vue')).default
  ui.router.addRoute({ path: LIST, name: '/(coreDam)/assets', component: View })
  await ui.router.push(LIST)
  const page = await ui.mount(async () => ({ default: RouterView }))
  const tiles = () => Array.from(page.querySelectorAll<HTMLElement>('.dam-image-grid__item'))
  await eventually(() => expect(tiles()).toHaveLength(2))

  return { ui, tiles }
}

const inTheDetailOfTheList: Place = async () => {
  const { ui, tiles } = await listOpened()
  const pencil = () => tiles()[0].querySelectorAll<HTMLButtonElement>('.detail-icon')[1].click()
  pencil()

  return {
    ui,
    form: dialogOfList,
    // Closed, and opened by the pencil of the tile again.
    openAgain: async () => {
      dialogOfList()!.querySelector('.mdi-close')!.closest('button')!.click()
      await eventually(() => expect(dialogOfList()).toBeNull())
      pencil()
      await leave()
      await eventually(() => expect(dialogOfList()?.querySelector('textarea')).toBeTruthy())
    },
  }
}

const inThePanelBesideTheList: Place = async () => {
  const { ui, tiles } = await listOpened()
  tiles()[0].click()

  return {
    ui,
    form: panel,
    // Its tile clicked again.
    openAgain: async () => {
      tiles()[0].click()
      await leave()
    },
  }
}

const onThePageOfTheAsset: Place = async () => {
  const ui = await start()
  const View = (await import('@/domains/coreDam/asset/components/detail/AssetDetailView.vue')).default
  ui.router.addRoute({ path: '/assets/:id', name: '/(coreDam)/assets/[id]', component: View })
  await ui.router.push('/assets/' + ASSET)
  const page = await ui.mount(async () => ({ default: RouterView }))

  return { ui, form: () => page, openAgain: async () => undefined }
}

const ofTheList: Array<[string, Place]> = [
  ['the detail of the list', inTheDetailOfTheList],
  ['the panel beside the list', inThePanelBesideTheList],
]

/** The form of the asset, opened in the place and drawn, with what was typed into it: what a case reads of it. */
const openTypedForm = async (place: Place) => {
  const { ui, form, openAgain } = await place()
  const title = () => form()?.querySelector<HTMLTextAreaElement>('textarea') ?? null
  await eventually(() => expect(title()).not.toBeNull())
  const typedInto = title()!
  typedInto.value = TYPED
  typedInto.dispatchEvent(new Event('input'))
  await nextTick()

  return {
    ui,
    title,
    typedInto,
    openAgain,
    /** "Save" of the form: whether it is held back, and which line under it says why. */
    save: () => ({
      heldBack: buttonsNamed(form()!, 'Save')[0]?.disabled,
      stillProcessed: !!form()!.textContent?.includes(STILL_PROCESSED),
      failedOpenAgain: !!form()!.textContent?.includes(FAILED_OPEN_AGAIN),
    }),
    /** Whether the form says the text. */
    says: (text: string) => !!form()!.textContent?.includes(text),
  }
}

const HELD_FOR_FAILED = { heldBack: true, stillProcessed: false, failedOpenAgain: true }

/** "Save" of the form drawn in the element: whether it is held back, and which line under it says why. */
const saveIn = (form: HTMLElement) => ({
  heldBack: buttonsNamed(form, 'Save')[0]?.disabled,
  stillProcessed: !!form.textContent?.includes(STILL_PROCESSED),
  failedOpenAgain: !!form.textContent?.includes(FAILED_OPEN_AGAIN),
})

/** Whether the server holds the asset as being deleted: once its delete was answered. */
let deletedOnServer = false

/** The asset as a read of it answers: as the server holds it when it is asked. */
const assetOnServer = () => ({
  ...onServer(ASSET),
  ...(deletedOnServer ? { attributes: { assetType: 'image', assetStatus: 'deleting' } } : {}),
  metadata: { customData: { title: FROM_SERVER }, authorSuggestions: {}, keywordSuggestions: {} },
})

/** The reads of the asset held, until `stop`: each answered, in the order asked, as the server held the asset when it
 * was asked. */
let heldReads: Array<() => void> | null = null
const holdReads = () => {
  heldReads = []

  return {
    waiting: () => heldReads?.length ?? 0,
    answerNext: async () => {
      await eventually(() => expect(heldReads).not.toHaveLength(0))
      heldReads!.shift()!()
      await settled()
    },
    stop: () => {
      heldReads = null
    },
  }
}

beforeEach(() => {
  listeners.length = 0
  server = createFakeDam()
  fileIs = 'stored'
  heldReads = null
  deletedOnServer = false
  server.assetBy(ASSET, () => {
    const asRead = assetOnServer()
    if (!heldReads) return asRead
    const waiting = heldReads

    return new Promise((resolve) => waiting.push(() => resolve(asRead)))
  })
  server.assetBy(OTHER, () => onServer(OTHER))
  server.slotsBy(ASSET, () => ({
    data: [
      { id: 'slot-default', slotName: 'default', default: true, main: true, assetFile: fileOnServer(FILE, ASSET) },
    ],
    totalCount: 1,
  }))
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
  server.fileBy('image', FILE, () => fileOnServer(FILE, ASSET))
  // The window is one for the whole file, and so is its address.
  window.history.replaceState(null, '', LIST)
})

afterEach(() => {
  stopUploadUi()
})

/* The line said the file was still being processed and "Save" would come once it was, while the card said it had
 * failed: nothing was left to wait for. */
describe('the line under "Save" held back under what was typed, once the main file has failed', () => {
  it.each<[string, Place]>([...ofTheList, ['the page of the asset', onThePageOfTheAsset]])(
    'says in %s that the file failed and that "Save" comes with opening the asset again',
    async (_where, place) => {
      const form = await openTypedForm(place)

      await failed()
      await eventually(() => expect(form.says(FAILED)).toBe(true))
      await answered()

      expect([form.title() === form.typedInto, form.typedInto.value, form.save(), form.ui.alerts()]).toEqual([
        true,
        TYPED,
        HELD_FOR_FAILED,
        [],
      ])
    }
  )

  // What the line says holds: the asset read whole, once what was typed is left, frees "Save".
  it.each(ofTheList)('goes with the asset opened again in %s, and "Save" comes free', async (_where, place) => {
    const form = await openTypedForm(place)
    await failed()
    await eventually(() => expect(form.says(FAILED)).toBe(true))
    await answered()
    const before = server.assetReads(ASSET)

    await form.openAgain()
    await eventually(() => expect(form.title()?.value).toBe(FROM_SERVER))

    expect([server.assetReads(ASSET), form.save(), form.says(FAILED), form.ui.alerts()]).toEqual([
      before + 1,
      { heldBack: false, stillProcessed: false, failedOpenAgain: false },
      true,
      [],
    ])
  })

  // The guard: a main file on its way keeps the line it had.
  it.each(ofTheList)(
    'says in %s that the file is still being processed while it is on its way',
    async (_where, place) => {
      const form = await openTypedForm(place)
      await answered()

      expect(form.save()).toEqual({ heldBack: true, stillProcessed: true, failedOpenAgain: false })
    }
  )

  /* A read of the asset asked before the news of the failure and answered after it is stamped as the asset fetched a
   * moment ago, and the quiet read the news sets off holds "Save" back after that: a click on the tile within five
   * seconds of the stamp read nothing, and "Save" stayed held back under the line that said opening would free it. */
  it('goes with a click on the tile within five seconds of a read answered between the news and the hold', async () => {
    const { tiles } = await listOpened()
    tiles()[0].click()
    const title = () => panel().querySelector<HTMLTextAreaElement>('textarea')
    await eventually(() => expect(title()).not.toBeNull())
    await vi.advanceTimersByTimeAsync(6_000)
    const reads = holdReads()
    // Read whole by its tile, behind the loader; the news comes while that read is on its way.
    tiles()[0].click()
    await eventually(() => expect(reads.waiting()).toBe(1))
    await failed()
    await reads.answerNext()
    // The quiet read the news set off, typed under.
    await eventually(() => expect(reads.waiting()).toBe(1))
    await eventually(() => expect(title()).not.toBeNull())
    title()!.value = TYPED
    title()!.dispatchEvent(new Event('input'))
    await nextTick()
    await reads.answerNext()
    expect(saveIn(panel())).toEqual(HELD_FOR_FAILED)
    reads.stop()
    const before = server.assetReads(ASSET)

    tiles()[0].click()
    await leave()
    await eventually(() => expect(title()?.value).toBe(FROM_SERVER))

    expect([server.assetReads(ASSET), saveIn(panel())]).toEqual([
      before + 1,
      { heldBack: false, stillProcessed: false, failedOpenAgain: false },
    ])
  })
})

/* Deleted, the asset had the card say its file failed, and the line under the disabled "Save" say opening it again
 * would free it. The detail closes over the asset deleted in it, and the panel beside the list holds it; "Edit more"
 * opens it again, read as the server holds it by then. */
describe('the form of an asset being deleted, whose main file failed under what was typed', () => {
  it('says the asset is being deleted, with no line under "Save", in the panel beside the list and in the detail', async () => {
    const form = await openTypedForm(inTheDetailOfTheList)
    await failed()
    await eventually(() => expect(form.says(FAILED)).toBe(true))
    await answered()
    expect(form.save()).toEqual(HELD_FOR_FAILED)
    let answer: () => void = () => undefined
    server.on(
      'DELETE',
      /^\/adm\/v1\/asset\/([^/]+)$/,
      () =>
        new Promise<FakeDamAnswer>(
          (resolve) =>
            (answer = () => {
              deletedOnServer = true
              resolve({ status: 204 })
            })
        )
    )

    // Deleted from the detail, with another tab opened before the answer: the detail closes over it all the same.
    buttonsNamed(dialogOfList()!, DELETE)[0].click()
    await eventually(() => expect(dialogButton(DELETE)).not.toBeNull())
    dialogButton(DELETE)!.click()
    await settled()
    dialogOfList()!.querySelector<HTMLElement>('[data-cy="button-slots"]')!.click()
    await settled()
    answer()
    await eventually(() => expect(dialogOfList()).toBeNull())

    const NOTHING_UNDER = { heldBack: true, stillProcessed: false, failedOpenAgain: false }
    expect([
      panel().textContent?.includes(BEING_DELETED),
      panel().textContent?.includes(FAILED),
      saveIn(panel()),
    ]).toEqual([true, false, NOTHING_UNDER])
    // Opened on the tab it was left at.
    buttonsNamed(panel(), 'Edit more')[0].click()
    await eventually(() => expect(dialogOfList()?.querySelector('[data-cy="button-meta"]')).toBeTruthy())
    dialogOfList()!.querySelector<HTMLElement>('[data-cy="button-meta"]')!.click()
    await eventually(() => expect(form.title()).not.toBeNull())
    expect([form.says(BEING_DELETED), form.says(FAILED), saveIn(dialogOfList()!)]).toEqual([true, false, NOTHING_UNDER])
  })
})
