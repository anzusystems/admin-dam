import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { RouterView } from 'vue-router'

import { assetDetail, assetFile, createFakeDam } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamAnswer } from '@/test/support/fakeDam'
import { buttonsNamed, customField, eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/*
 * Under typed metadata, a main file the server has ended holds "Save" back until the
 * asset is read whole, because the server can have filled in the metadata from it.
 * The line under "Save" says why: still on its way, failed, or
 * processed. For processed, "Save" comes with opening the detail again.
 * "Edit more" of the panel opens it so, once nothing typed waits to be saved.
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
const BULK = /^\/adm\/v1\/asset\/metadata-bulk-update$/

const TYPED = 'typed and not saved'
const STILL_PROCESSED = 'The file is still being processed.'
const FAILED_OPEN_AGAIN = 'Processing of the file failed. You can save after opening the asset again.'
const PROCESSED_OPEN_AGAIN = 'The file is processed. Saving becomes possible after the detail is opened again.'
const UPDATED = 'Record was updated'

const LIST = '/assets'
const ASSET = '11111111-2222-4333-8444-555555555555'
const FILE = 'aaaaaaaa-2222-4333-8444-555555555555'
const EXTRA = 'bbbbbbbb-2222-4333-8444-555555555555'
const OTHER = '22222222-2222-4333-8444-555555555555'

let fileIs: 'stored' | 'processed' | 'failed' = 'stored'

const fileOnServer = (fileId: string, assetId: string) => ({
  ...assetFile(fileId, fileId === FILE ? fileIs : 'processed', { asset: assetId }),
  _resourceName: 'imageFile',
  imageAttributes: { width: 800, height: 450, ratioWidth: 16, ratioHeight: 9, mostDominantColor: '#cccccc' },
  mainRoute: null,
})

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
const answered = () => vi.advanceTimersByTimeAsync(1_000)

const ended = async (as: 'processed' | 'failed') => {
  fileIs = as
  listeners.forEach((listener) =>
    listener(
      as === 'processed'
        ? { name: 'asset_file_processed', data: { asset: ASSET, id: FILE } }
        : { name: 'asset_file_failed', data: { asset: ASSET, id: FILE, failReason: 'unknown' } }
    )
  )
  await settled()
  await answered()
}

const dialogOfList = () => document.body.querySelector<HTMLElement>('.dam-image-detail-dialog.v-overlay--active')
const panel = () => document.body.querySelector<HTMLElement>('.v-navigation-drawer--right')!

const start = async () => {
  const ui = await startUploadUi({
    server,
    grants: ['dam_asset_update', 'dam_image_update'],
    extSystem: { image: { slots: ['default'] } },
    customForm: { image: [customField('title')] },
  })
  const { useAuth } = await import('@/domains/system/auth/auth')
  const { currentUser, setCurrentUser } = useAuth().useCurrentUser('dam')
  setCurrentUser({
    ...currentUser.value,
    email: 'user@dam.test',
    person: { firstName: 'Test', lastName: 'User', fullName: 'Test User' },
    avatar: { color: '', text: 'TU' },
  } as never)
  vi.stubGlobal('fetch', async () => ({
    ok: true,
    headers: { get: () => 'application/json' },
    json: async () => ({ appVersion: '' }),
  }))
  const { initAppNotificationListeners } = await import('@/domains/system/composables/appNotificationListeners')
  initAppNotificationListeners()

  return ui
}

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

type Place = () => Promise<{ ui: Awaited<ReturnType<typeof start>>; form: () => HTMLElement | null }>

const places: Array<[string, Place]> = [
  [
    'the detail of the list',
    async () => {
      const { ui, tiles } = await listOpened()
      tiles()[0].querySelectorAll<HTMLButtonElement>('.detail-icon')[1].click()

      return { ui, form: dialogOfList }
    },
  ],
  [
    'the panel beside the list',
    async () => {
      const { ui, tiles } = await listOpened()
      tiles()[0].click()

      return { ui, form: panel }
    },
  ],
  [
    'the page of the asset',
    async () => {
      const ui = await start()
      const View = (await import('@/domains/coreDam/asset/components/detail/AssetDetailView.vue')).default
      ui.router.addRoute({ path: '/assets/:id', name: '/(coreDam)/assets/[id]', component: View })
      await ui.router.push('/assets/' + ASSET)
      const page = await ui.mount(async () => ({ default: RouterView }))

      return { ui, form: () => page }
    },
  ],
]

const saveIn = (form: HTMLElement) => ({
  heldBack: buttonsNamed(form, 'Save')[0]?.disabled,
  stillProcessed: !!form.textContent?.includes(STILL_PROCESSED),
  failedOpenAgain: !!form.textContent?.includes(FAILED_OPEN_AGAIN),
  processedOpenAgain: !!form.textContent?.includes(PROCESSED_OPEN_AGAIN),
})

const typeInto = async (form: () => HTMLElement | null) => {
  const title = () => form()?.querySelector<HTMLTextAreaElement>('textarea') ?? null
  await eventually(() => expect(title()).not.toBeNull())
  title()!.value = TYPED
  title()!.dispatchEvent(new Event('input'))
  await nextTick()

  return title
}

beforeEach(() => {
  listeners.length = 0
  server = createFakeDam()
  fileIs = 'stored'
  server.assetBy(ASSET, () => ({
    ...onServer(ASSET),
    metadata: { customData: { title: 'from the server' }, authorSuggestions: {}, keywordSuggestions: {} },
  }))
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
  server.on('PATCH', BULK, (request) => ({ status: 200, data: JSON.parse(request.data as string) }))
  window.history.replaceState(null, '', LIST)
})

afterEach(() => {
  stopUploadUi()
})

/*
 * The line said the file was still being processed after the server said it was processed.
 * "Save" stays held back because the form is older than what the
 * server filled in from the file. Opening the detail again frees it.
 */
describe('the line under "Save" held back under what was typed, once the main file is processed', () => {
  it.each(places)(
    'says in %s that the file is processed and that saving comes with opening the detail again',
    async (_where, place) => {
      const { form } = await place()
      const title = await typeInto(form)
      expect(saveIn(form()!)).toEqual({
        heldBack: true,
        stillProcessed: true,
        failedOpenAgain: false,
        processedOpenAgain: false,
      })

      await ended('processed')

      expect([title()?.value, saveIn(form()!)]).toEqual([
        TYPED,
        { heldBack: true, stillProcessed: false, failedOpenAgain: false, processedOpenAgain: true },
      ])
    }
  )
})

/*
 * "Save" was held back under a save on its way: another slot's file was processed meanwhile
 * and the main one had failed. Nothing typed was left once that save went through.
 * The line said "Save" would come with opening the asset again,
 * but "Edit more" opened it over the same form, still held back.
 */
describe('"Edit more" of the panel beside the list', () => {
  it('reads the asset whole once nothing typed waits to be saved, and "Save" comes free', async () => {
    fileIs = 'failed'
    let saved: () => void = () => undefined
    server.on(
      'PATCH',
      BULK,
      (request) =>
        new Promise<FakeDamAnswer>(
          (resolve) => (saved = () => resolve({ status: 200, data: JSON.parse(request.data as string) }))
        )
    )
    const { ui, tiles } = await listOpened()
    tiles()[0].click()
    await typeInto(panel)
    buttonsNamed(panel(), 'Save')[0].click()
    await settled()
    listeners.forEach((listener) => listener({ name: 'asset_file_processed', data: { asset: ASSET, id: EXTRA } }))
    await settled()
    await answered()
    saved()
    await settled()
    expect([ui.alerts(), saveIn(panel())]).toEqual([
      [UPDATED],
      { heldBack: true, stillProcessed: false, failedOpenAgain: true, processedOpenAgain: false },
    ])
    const before = server.assetReads(ASSET)

    buttonsNamed(panel(), 'Edit more')[0].click()
    await settled()

    await eventually(() => expect(dialogOfList()?.querySelector('textarea')).toBeTruthy())
    expect([server.assetReads(ASSET) - before, saveIn(dialogOfList()!)]).toEqual([
      1,
      { heldBack: false, stillProcessed: false, failedOpenAgain: false, processedOpenAgain: false },
    ])
  })
})
