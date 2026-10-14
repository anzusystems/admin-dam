import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { RouterView } from 'vue-router'

import { assetDetail, assetFile, createFakeDam, httpError } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamAnswer } from '@/test/support/fakeDam'
import { buttonsNamed, customField, eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/* The server says that it has processed the main file of the asset a detail holds, opened while it was on its way:
 * the asset is read again. The read is not one the user started, and comes at any moment: whatever the user is doing
 * in the detail then - typing into its form, a dialog open over it with what was typed there, a save on its way -
 * stays as it is. The real pages - the list with its dialog and its panel, the page of an asset, the page of the
 * asset of a file - the real listener of the notifications, and the application around them as it starts; the server
 * is a fake, and so are the connection its notifications come by and the address the page asks about a new version
 * of the application. */

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
const BULK = /^\/adm\/v1\/asset\/metadata-bulk-update$/

const TYPED = 'typed and not saved'
const FROM_SERVER = 'from the server'
/** The title the server fills in from the file as it processes it. */
const FROM_FILE = 'filled in from the file'
const STILL_PROCESSED = 'The file is still being processed.'
const SYSTEM_ERROR = 'System error, try again later or contact administrator'

const LIST = '/assets'
/** The audio whose main file the server is processing, and that file. */
const ASSET = '11111111-2222-4333-8444-555555555555'
const FILE = 'aaaaaaaa-2222-4333-8444-555555555555'
/** A file in another slot of the audio, processed, and another asset of the list. */
const IN_SLOT = 'bbbbbbbb-2222-4333-8444-555555555555'
const OTHER = '22222222-2222-4333-8444-555555555555'

/** How far the server is with the main file, and whether the asset is described. */
let processedYet = false
let described = false

const fileOnServer = (fileId: string, assetId = ASSET) => ({
  ...assetFile(fileId, fileId !== FILE || processedYet ? 'processed' : 'stored', { asset: assetId }),
  _resourceName: 'audioFile',
  audioAttributes: { duration: 1000, bitrate: 1000, codecName: 'mp3' },
  mainRoute: null,
})

/** An asset as the server holds it now: an audio of the licence of the user, its title filled in from the file. */
const onServer = (id: string) => ({
  ...assetDetail(id, {
    attributes: { assetType: 'audio', assetStatus: 'with_file' },
    licence: 1,
    flags: { described, visible: true },
    mainFile: fileOnServer(id === ASSET ? FILE : 'file-of-other', id),
    metadata: {
      customData: { title: processedYet ? FROM_FILE : FROM_SERVER },
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
const processed = async () => {
  processedYet = true
  listeners.forEach((listener) => listener({ name: 'asset_file_processed', data: { asset: ASSET, id: FILE } }))
  await settled()
}

const menu = () => document.body.querySelector('.v-menu.v-overlay--active')
const dialogOfList = () => document.body.querySelector<HTMLElement>('.dam-image-detail-dialog.v-overlay--active')
const panel = () => document.body.querySelector<HTMLElement>('.v-navigation-drawer--right')!
/** A dialog open over the detail. */
const dialogOver = () =>
  document.body.querySelector<HTMLElement>('.v-dialog.v-overlay--active:not(.dam-image-detail-dialog)')

const start = async () => {
  const ui = await startUploadUi({
    server,
    grants: ['dam_asset_update', 'dam_audio_update'],
    extSystem: { audio: { slots: ['default', 'extra'] } },
    customForm: { audio: [customField('title')] },
  })
  // The user as the bar of the page draws them, and as the picker of the sibling of an audio asks about them.
  const { useAuth } = await import('@/domains/system/auth/auth')
  const { currentUser, setCurrentUser } = useAuth().useCurrentUser('dam')
  setCurrentUser({
    ...currentUser.value,
    email: 'user@dam.test',
    person: { firstName: 'Test', lastName: 'User', fullName: 'Test User' },
    avatar: { color: '', text: 'TU' },
    adminToExtSystems: [],
    userToExtSystems: [1],
    resolvedAssetLicences: [],
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

const places: Array<[string, Place]> = [
  ['the detail of the list', inTheDetailOfTheList],
  ['the panel beside the list', inThePanelBesideTheList],
  [
    'the page of an asset',
    () =>
      onPage(
        '/(coreDam)/assets/[id]',
        '/assets/:id',
        () => import('@/domains/coreDam/asset/components/detail/AssetDetailView.vue'),
        '/assets/' + ASSET
      ),
  ],
  [
    'the page of the asset of a file',
    () =>
      onPage(
        '/(coreDam)/assets/file/[id]',
        '/assets/file/:id',
        () => import('@/domains/coreDam/asset/components/detail/AssetFileDetailView.vue'),
        '/assets/file/' + FILE
      ),
  ],
]

/** The form of the asset, opened in the place and drawn: what a case reads of it. */
const openForm = async (place: Place) => {
  const { ui, form } = await place()
  const title = () => form()?.querySelector<HTMLTextAreaElement>('textarea') ?? null
  await eventually(() => expect(title()).not.toBeNull())

  return {
    ui,
    form,
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
  }
}

/** Whether the form holds metadata that were not saved, as leaving the asset asks about them. */
const touched = async () => {
  const { useAssetDetailStore } = await import('@/domains/coreDam/asset/store/assetDetailStore')

  return useAssetDetailStore().metadataAreTouched
}

const HELD_BACK = { heldBack: true, saysWhy: true }
const FREE = { heldBack: false, saysWhy: false }

beforeEach(() => {
  listeners.length = 0
  server = createFakeDam()
  processedYet = false
  described = false
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
  server.on('GET', /^\/adm\/v1\/podcast-episode\/asset\/[^/]+$/, empty)
  // The window is one for the whole file, and so is its address.
  window.history.replaceState(null, '', LIST)
})

afterEach(() => {
  stopUploadUi()
})

/* With nothing typed into the form the asset was read whole as after a change the user made: behind the loader of the
 * detail, which unmounted the form, its tabs and every dialog open over it, with what was typed there. */
describe('a form opened while the main file of its asset was being processed, once the server says it is processed', () => {
  it.each(places)(
    'takes the asset in its place in %s: no loader goes over it, and "Save" comes free',
    async (_where, place) => {
      const form = await openForm(place)
      const field = form.title()!
      expect([field.value, form.save(), reads()]).toEqual([FROM_SERVER, HELD_BACK, 1])

      await processed()
      await eventually(() => expect(form.save()).toEqual(FREE))

      // Read once, whole, and taken into the very field drawn before.
      expect([reads(), form.title() === field, field.isConnected, field.value, form.ui.alerts()]).toEqual([
        2,
        true,
        true,
        FROM_FILE,
        [],
      ])
      expect(await touched()).toBe(false)
    }
  )

  it('keeps a dialog open over the detail as it is, with what was typed into it, while the form behind becomes new', async () => {
    const form = await openForm(inTheDetailOfTheList)
    dialogOfList()!.querySelector<HTMLElement>('[data-cy="button-slots"]')!.click()
    const routeMenuOfExtra = await eventually(() => {
      const row = Array.from(dialogOfList()!.querySelectorAll<HTMLElement>('.sidebar-info__content .pa-4.pb-8')).find(
        (listed) => listed.querySelector('.font-weight-bold')?.textContent?.trim().startsWith('extra')
      )
      const button = row?.querySelector('.mdi-dots-vertical')?.closest('button')
      expect(button).toBeTruthy()

      return button!
    })
    routeMenuOfExtra.click()
    const makePublic = await eventually(() => {
      const item = Array.from(menu()?.querySelectorAll<HTMLElement>('.v-list-item') ?? []).find(
        (listed) => listed.textContent?.trim() === 'Make public'
      )
      expect(item).toBeTruthy()

      return item!
    })
    makePublic.click()
    const slug = await eventually(() => {
      const input = dialogOver()?.querySelector<HTMLInputElement>('input')
      expect(input).toBeTruthy()

      return input!
    })
    slug.value = 'typed-slug'
    slug.dispatchEvent(new Event('input'))
    await nextTick()

    await processed()
    await eventually(() => expect(reads()).toBe(2))
    await settled()

    expect([dialogOver()?.querySelector('input') === slug, slug.isConnected, slug.value, form.ui.alerts()]).toEqual([
      true,
      true,
      'typed-slug',
      [],
    ])
    // Behind it the form is the one of the asset as the server has it now.
    buttonsNamed(dialogOver()!, 'Cancel')[0].click()
    await eventually(() => expect(dialogOver()).toBeNull())
    dialogOfList()!.querySelector<HTMLElement>('[data-cy="button-meta"]')!.click()
    await eventually(() => expect(form.title()?.value).toBe(FROM_FILE))
    expect([form.save(), reads()]).toEqual([FREE, 2])
  })
})

/* What was typed is kept as it is, and so is "Save" held back: the form is the one read before the server was done
 * with the file. Also when it was typed while the asset was being read, or when a save of it was on its way - an
 * answer read before that save could be from before it. */
describe('a form typed into while the server says the main file is processed', () => {
  it('keeps what was typed while the asset was being read, and "Save" held back', async () => {
    const form = await openForm(inTheDetailOfTheList)
    const letRead = holdNextRead()
    await processed()
    expect(reads()).toBe(2)

    const typedInto = await form.typeTitle()
    await letRead()

    expect([form.title() === typedInto, typedInto.isConnected, typedInto.value, form.save()]).toEqual([
      true,
      true,
      TYPED,
      HELD_BACK,
    ])
    expect([await touched(), form.ui.alerts()]).toEqual([true, []])
  })

  it.each<[string, Place]>([
    ['the detail of the list', inTheDetailOfTheList],
    ['the panel beside the list', inThePanelBesideTheList],
  ])(
    'keeps what was typed in %s when its save was on its way, and not saved once the save is refused',
    async (_where, place) => {
      // Described: "Save" goes while the file is being processed.
      described = true
      let refuse: () => void = () => undefined
      server.on(
        'PATCH',
        BULK,
        () => new Promise<FakeDamAnswer>((_resolve, reject) => (refuse = () => reject(httpError(500))))
      )
      const form = await openForm(place)
      const typedInto = await form.typeTitle()
      buttonsNamed(form.form()!, 'Save')[0].click()
      await settled()
      expect(server.sent('PATCH', BULK)).toHaveLength(1)

      await processed()
      await eventually(() => expect(reads()).toBe(2))
      await settled()
      refuse()
      await eventually(() => expect(form.ui.alerts()).toEqual([SYSTEM_ERROR]))

      expect([form.title() === typedInto, typedInto.isConnected, typedInto.value, await touched()]).toEqual([
        true,
        true,
        TYPED,
        true,
      ])
    }
  )
})
