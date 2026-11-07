import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RouterView } from 'vue-router'

import { assetDetail, assetFile, createFakeDam } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamAnswer } from '@/test/support/fakeDam'
import { buttonsNamed, customField, eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/*
 * The panel beside the list can be opened while the server is still processing
 * the main file; "Save" is held back then for an asset that is not described.
 * Two page reads reveal the file state: the list read anew, and the metadata read for rows picked for mass edit.
 * When they show the main file as processed, the panel reads the asset with
 * no loader, as it does for a notification. No notification comes here.
 */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const SEARCH = /^\/adm\/v1\/asset\/licence\/1(\/search)?$/
const BY_IDS = /^\/adm\/v1\/asset\/licence\/1\/ids\/.+$/

const FROM_SERVER = 'from the server'
const STILL_PROCESSED = 'The file is still being processed.'

const LIST = '/assets'
const ASSET = '11111111-2222-4333-8444-555555555555'
const FILE = 'aaaaaaaa-2222-4333-8444-555555555555'
const OTHER = '22222222-2222-4333-8444-555555555555'

let fileIs: 'stored' | 'processed' = 'stored'

const fileOnServer = (fileId: string, assetId: string) => ({
  ...assetFile(fileId, assetId === ASSET ? fileIs : 'processed', { asset: assetId }),
  _resourceName: 'imageFile',
  imageAttributes: { width: 800, height: 450, ratioWidth: 16, ratioHeight: 9, mostDominantColor: '#cccccc' },
  mainRoute: null,
})

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

const answered = () => vi.advanceTimersByTimeAsync(1_000)

const reads = () => server.sent('GET').filter((request) => request.url === '/adm/v1/asset/' + ASSET).length

const panel = () => document.body.querySelector<HTMLElement>('.v-navigation-drawer--right')!

const openPanel = async () => {
  const ui = await startUploadUi({
    server,
    grants: ['dam_asset_update', 'dam_image_update'],
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
    save: () => ({
      heldBack: buttonsNamed(panel(), 'Save')[0]?.disabled,
      saysWhy: !!panel().textContent?.includes(STILL_PROCESSED),
    }),
    title: () => panel().querySelector<HTMLTextAreaElement>('textarea')?.value,
    readListAnew: async () => {
      page.querySelector('.mdi-refresh')!.closest('button')!.click()
      await answered()
    },
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

/*
 * The two reads brought the file as processed and told nobody. "Save" of the
 * panel stayed held back until a notification came or the asset was opened again.
 */
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
