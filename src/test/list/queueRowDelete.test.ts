import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { RouterView } from 'vue-router'

import { assetDetail, assetFile, createFakeDam, httpError } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamAnswer } from '@/test/support/fakeDam'
import {
  buttonsNamed,
  customField,
  dialogButton,
  eventually,
  startUploadUi,
  stopUploadUi,
} from '@/test/support/uploadUi'

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const SEARCH = /^\/adm\/v1\/asset\/licence\/1(\/search)?$/
const DELETE_ASSET = /^\/adm\/v1\/asset\/([^/]+)$/

const LIST = '/assets'
const TYPED = 'typed and not saved'
const DELETE = 'Delete'
const BEING_DELETED = 'Asset will be removed soon'
const UNSAVED = 'Unsaved changes'

const onServer = (id: string) => ({
  ...assetDetail(id, {
    attributes: { assetType: 'image', assetStatus: 'with_file' },
    licence: 1,
    flags: { described: true, visible: true },
    mainFile: assetFile('file-' + id, 'processed', { asset: id }),
  }),
  keywords: [],
  authors: [],
})

const settled = () => vi.advanceTimersByTimeAsync(100)

const detail = () => document.body.querySelector<HTMLElement>('.dam-image-detail-dialog.v-overlay--active')
const panel = () => document.body.querySelector<HTMLElement>('.v-navigation-drawer--right')!

const openList = async () => {
  const ui = await startUploadUi({
    server,
    grants: ['dam_asset_update', 'dam_asset_delete', 'dam_image_update'],
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
  ui.router.addRoute({ path: '/assets/:id', name: '/(coreDam)/assets/[id]', component: View })
  await ui.router.push(LIST)
  const page = await ui.mount(async () => ({ default: RouterView }))
  const tiles = () => Array.from(page.querySelectorAll<HTMLElement>('.dam-image-grid__item'))
  await eventually(() => expect(tiles()).toHaveLength(3))

  tiles()[1].click()
  const title = () => panel().querySelector<HTMLTextAreaElement>('textarea')
  await eventually(() => expect(title()).not.toBeNull())
  title()!.value = TYPED
  title()!.dispatchEvent(new Event('input'))
  await nextTick()

  return {
    ...ui,
    tiles,
    deleting: () => tiles().map((tile) => !!tile.querySelector('.mdi-trash-can')),
    panelShows: () => ({
      beingDeleted: !!panel().textContent?.includes(BEING_DELETED),
      saveDisabled: buttonsNamed(panel(), 'Save')[0]?.disabled,
    }),
    pickAndEdit: async (index: number) => {
      tiles()[index].querySelectorAll<HTMLButtonElement>('.detail-icon')[0].click()
      await settled()
      buttonsNamed(document.body, 'Edit')[0].click()
      await eventually(() => expect(rows()).toHaveLength(1))
    },
    deleteRow: async (index: number) => {
      buttonsNamed(rows()[index], DELETE)[0].click()
      await eventually(() => expect(dialogButton(DELETE)).not.toBeNull())
      dialogButton(DELETE)!.click()
      await settled()
    },
    putQueueAway: async () => {
      queue()!.querySelector('.mdi-chevron-down')!.closest('button')!.click()
      await eventually(() => expect(queue()).toBeNull())
    },
    queued: () => ui.store.getQueueItems('edit').map((row) => row.assetId),
    asks: () => !!document.body.querySelector('.v-dialog')?.textContent?.includes(UNSAVED),
  }
}

const queue = () => document.body.querySelector<HTMLElement>('.overlay--sidebar')
const rows = () => Array.from(queue()?.querySelectorAll<HTMLElement>('.dam-upload-queue__item') ?? [])

beforeEach(() => {
  server = createFakeDam()
  for (const id of ['asset-1', 'asset-2', 'asset-3']) server.asset(onServer(id))
  const empty = (): FakeDamAnswer => ({ status: 200, data: { data: [] } })
  server.on('GET', SEARCH, () => ({
    status: 200,
    data: { data: ['asset-1', 'asset-2', 'asset-3'].map(onServer), hasNextPage: false },
  }))
  server.on('GET', /^\/adm\/v1\/asset-licence\/1$/, () => ({ status: 200, data: { id: 1, name: 'Licence' } }))
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
 * Regression: the bin deleted the asset without any sign. The tile looked unchanged.
 * The panel kept the deleted asset, with the typed text and "Save" enabled.
 */
describe('the bin of a row of the mass-edit queue', () => {
  it('marks the tile of the asset it deleted, and the panel that holds it offers no "Save" and asks nothing', async () => {
    server.on('DELETE', DELETE_ASSET, () => ({ status: 204 }))
    const list = await openList()
    await list.pickAndEdit(1)

    await list.deleteRow(0)
    await eventually(() => expect(list.queued()).toEqual([]))

    expect(server.sent('DELETE').map((request) => request.url)).toEqual(['/adm/v1/asset/asset-2'])
    expect([list.deleting(), list.panelShows()]).toEqual([
      [false, true, false],
      { beingDeleted: true, saveDisabled: true },
    ])
    // The typed text can no longer be saved, so reading another tile asks no question.
    await list.putQueueAway()
    list.tiles()[0].click()
    await settled()
    expect([list.asks(), list.panelShows()]).toEqual([false, { beingDeleted: false, saveDisabled: false }])
  })

  // The queue can be put away while the delete is in flight.
  // What the row did after the delete was lost with the row.
  it('does all that, and takes its row out, when the queue was put away before the delete was answered', async () => {
    let answer: () => void = () => undefined
    server.on('DELETE', DELETE_ASSET, () => new Promise((resolve) => (answer = () => resolve({ status: 204 }))))
    const list = await openList()
    await list.pickAndEdit(1)
    await list.deleteRow(0)
    await list.putQueueAway()

    answer()
    await settled()

    expect([list.queued(), list.deleting(), list.panelShows()]).toEqual([
      [],
      [false, true, false],
      { beingDeleted: true, saveDisabled: true },
    ])
  })

  it('leaves the tile, the panel and its row as they were when the delete fails', async () => {
    server.on('DELETE', DELETE_ASSET, () => {
      throw httpError(500)
    })
    const list = await openList()
    await list.pickAndEdit(1)

    await list.deleteRow(0)
    await eventually(() => expect(list.alerts()).toHaveLength(1))

    expect([list.queued(), list.deleting(), list.panelShows()]).toEqual([
      ['asset-2'],
      [false, false, false],
      { beingDeleted: false, saveDisabled: false },
    ])
  })
})

/*
 * Regression: the panel also offered "Save" for an asset deleted in the detail.
 * It is the same panel holding the same asset.
 */
describe('the panel beside the list, once the detail has deleted its asset', () => {
  it('says the asset is being deleted and offers no "Save" of it', async () => {
    server.on('DELETE', DELETE_ASSET, () => ({ status: 204 }))
    const list = await openList()
    buttonsNamed(panel(), 'Edit more')[0].click()
    await eventually(() => expect(detail()).not.toBeNull())

    buttonsNamed(detail()!, DELETE)[0].click()
    await eventually(() => expect(dialogButton(DELETE)).not.toBeNull())
    dialogButton(DELETE)!.click()
    await eventually(() => expect(detail()).toBeNull())

    expect([list.deleting(), list.panelShows()]).toEqual([
      [false, true, false],
      { beingDeleted: true, saveDisabled: true },
    ])
  })
})
