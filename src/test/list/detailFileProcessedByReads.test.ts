import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RouterView } from 'vue-router'

import { assetDetail, assetFile, createFakeDam } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamAnswer } from '@/test/support/fakeDam'
import { buttonsNamed, customField, eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/* The panel beside the list can be opened while the server is still processing the main file of the asset; "Save" of
 * an asset that is not described is held back then. Two reads of the page learn how far the server is with the file
 * though they are made for something else: the list read anew, and the read of the metadata of the rows picked for
 * the mass edit. What they bring of a main file the server is done with is told to the detail as its notification
 * is: the panel reads the asset with no loader. No notification comes here. The real page of the list with its panel
 * and its mass edit, the application around it as it starts; the server is a fake, and so is the address the page
 * asks about a new version of the application. */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const SEARCH = /^\/adm\/v1\/asset\/licence\/1(\/search)?$/
const BY_IDS = /^\/adm\/v1\/asset\/licence\/1\/ids\/.+$/

const FROM_SERVER = 'from the server'
const STILL_PROCESSED = 'The file is still being processed.'

const LIST = '/assets'
/** The asset whose main file the server is processing, and that file; another asset of the list. */
const ASSET = '11111111-2222-4333-8444-555555555555'
const FILE = 'aaaaaaaa-2222-4333-8444-555555555555'
const OTHER = '22222222-2222-4333-8444-555555555555'

/** How far the server is with the main file of the asset. */
let fileIs: 'stored' | 'processed' = 'stored'

const fileOnServer = (fileId: string, assetId: string) => ({
  ...assetFile(fileId, assetId === ASSET ? fileIs : 'processed', { asset: assetId }),
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

/** Long enough for whatever a read sets off to have answered. */
const answered = () => vi.advanceTimersByTimeAsync(1_000)

/** How many times the asset was read by itself: the panel's reads. */
const reads = () => server.sent('GET').filter((request) => request.url === '/adm/v1/asset/' + ASSET).length

const panel = () => document.body.querySelector<HTMLElement>('.v-navigation-drawer--right')!

/** The page of the list, the asset in the panel beside it with "Save" held back, nothing typed. */
const openPanel = async () => {
  const ui = await startUploadUi({
    server,
    grants: ['dam_asset_update', 'dam_image_update'],
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
  const View = (await import('@/domains/coreDam/asset/components/list/AssetListView.vue')).default
  ui.router.addRoute({ path: LIST, name: '/(coreDam)/assets', component: View })
  await ui.router.push(LIST)
  const page = await ui.mount(async () => ({ default: RouterView }))
  const tiles = () => Array.from(page.querySelectorAll<HTMLElement>('.dam-image-grid__item'))
  await eventually(() => expect(tiles()).toHaveLength(2))
  tiles()[0].click()
  await eventually(() => expect(panel().querySelector('textarea')).not.toBeNull())

  return {
    ...ui,
    /** "Save" of the panel: whether it is held back, and whether the panel says why. */
    save: () => ({
      heldBack: buttonsNamed(panel(), 'Save')[0]?.disabled,
      saysWhy: !!panel().textContent?.includes(STILL_PROCESSED),
    }),
    title: () => panel().querySelector<HTMLTextAreaElement>('textarea')?.value,
    /** The list read anew by its "Refresh". */
    readListAnew: async () => {
      page.querySelector('.mdi-refresh')!.closest('button')!.click()
      await answered()
    },
    /** The tile of the asset picked for the mass edit: the metadata of its row are read. */
    pickForMassEdit: async () => {
      tiles()[0].querySelectorAll<HTMLButtonElement>('.detail-icon')[0].click()
      await answered()
    },
  }
}

const HELD_BACK = { heldBack: true, saysWhy: true }
const FREE = { heldBack: false, saysWhy: false }

beforeEach(() => {
  server = createFakeDam()
  fileIs = 'stored'
  server.assetBy(ASSET, () => onServer(ASSET))
  server.assetBy(OTHER, () => onServer(OTHER))
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
  server.on('GET', /^\/adm\/v1\/asset-slot\/asset\/[^/]+$/, () => ({ status: 200, data: { data: [], totalCount: 0 } }))
  // The window is one for the whole file, and so is its address.
  window.history.replaceState(null, '', LIST)
})

afterEach(() => {
  stopUploadUi()
})

/* The two reads brought the file as processed and told nobody: "Save" of the panel stayed held back until a
 * notification came, or the asset was opened again. */
describe('the panel beside the list, its main file processed since it was read', () => {
  it('is read anew once the list read anew brings the file as processed', async () => {
    const list = await openPanel()
    expect([list.save(), reads()]).toEqual([HELD_BACK, 1])

    fileIs = 'processed'
    await list.readListAnew()
    await eventually(() => expect(list.save()).toEqual(FREE))

    expect([reads(), list.title(), list.alerts()]).toEqual([2, FROM_SERVER, []])
  })

  it('is read anew once the read of the rows of the mass edit brings the file as processed', async () => {
    const list = await openPanel()

    fileIs = 'processed'
    await list.pickForMassEdit()
    await eventually(() => expect(list.save()).toEqual(FREE))

    expect([server.sent('GET', BY_IDS).length, reads(), list.title(), list.alerts()]).toEqual([1, 2, FROM_SERVER, []])
  })

  // The guard: nothing new, nothing read.
  it('is not read again by a list that brings the file as it holds it, still on its way or processed', async () => {
    const list = await openPanel()

    await list.readListAnew()
    expect([list.save(), reads()]).toEqual([HELD_BACK, 1])

    fileIs = 'processed'
    await list.readListAnew()
    await eventually(() => expect(list.save()).toEqual(FREE))
    await list.readListAnew()
    await list.pickForMassEdit()

    expect(reads()).toBe(2)
  })
})
