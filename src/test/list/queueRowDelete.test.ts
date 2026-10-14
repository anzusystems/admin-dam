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

/* The bin of a row of the mass-edit queue deletes the asset of the row. The list behind the queue and the panel beside
 * it are told, as a delete in the detail tells them: the tile of the asset is marked as being deleted, the panel that
 * holds the asset says so and offers no "Save" of it, and what was typed into it is no longer asked about. The real
 * page of the list with its panel, its detail and the mass-edit queue, the application around it as it starts; the
 * server is a fake, and so is the address the page asks about a new version of the application. */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const SEARCH = /^\/adm\/v1\/asset\/licence\/1(\/search)?$/
const DELETE_ASSET = /^\/adm\/v1\/asset\/([^/]+)$/

const LIST = '/assets'
const TYPED = 'typed and not saved'
const DELETE = 'Delete'
const BEING_DELETED = 'Asset will be removed soon'
const UNSAVED = 'Unsaved changes'

/** An asset the server has: a processed image, its title is its id. */
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

/** The detail open over the list, or null with none open. */
const detail = () => document.body.querySelector<HTMLElement>('.dam-image-detail-dialog.v-overlay--active')
const panel = () => document.body.querySelector<HTMLElement>('.v-navigation-drawer--right')!

/** The page of the list with three assets, the second of them in the panel with something typed into it, and picked
 * for the mass edit. */
const openList = async () => {
  const ui = await startUploadUi({
    server,
    grants: ['dam_asset_update', 'dam_asset_delete', 'dam_image_update'],
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
  ui.router.addRoute({ path: '/assets/:id', name: '/(coreDam)/assets/[id]', component: View })
  await ui.router.push(LIST)
  const page = await ui.mount(async () => ({ default: RouterView }))
  const tiles = () => Array.from(page.querySelectorAll<HTMLElement>('.dam-image-grid__item'))
  await eventually(() => expect(tiles()).toHaveLength(3))

  // The second asset in the panel, typed into.
  tiles()[1].click()
  const title = () => panel().querySelector<HTMLTextAreaElement>('textarea')
  await eventually(() => expect(title()).not.toBeNull())
  title()!.value = TYPED
  title()!.dispatchEvent(new Event('input'))
  await nextTick()

  return {
    ...ui,
    tiles,
    /** Which tiles are drawn as of an asset being deleted. */
    deleting: () => tiles().map((tile) => !!tile.querySelector('.mdi-trash-can')),
    /** What the panel shows: whether it says its asset is being deleted, and whether its "Save" is disabled. */
    panelShows: () => ({
      beingDeleted: !!panel().textContent?.includes(BEING_DELETED),
      saveDisabled: buttonsNamed(panel(), 'Save')[0]?.disabled,
    }),
    /** The tile toggled for the mass edit, and the mass-edit queue drawn over the whole page. */
    pickAndEdit: async (index: number) => {
      tiles()[index].querySelectorAll<HTMLButtonElement>('.detail-icon')[0].click()
      await settled()
      buttonsNamed(document.body, 'Edit')[0].click()
      await eventually(() => expect(rows()).toHaveLength(1))
    },
    /** The bin of the row, pressed and its question answered. */
    deleteRow: async (index: number) => {
      buttonsNamed(rows()[index], DELETE)[0].click()
      await eventually(() => expect(dialogButton(DELETE)).not.toBeNull())
      dialogButton(DELETE)!.click()
      await settled()
    },
    /** The mass-edit queue put away into its strip under the list. */
    putQueueAway: async () => {
      queue()!.querySelector('.mdi-chevron-down')!.closest('button')!.click()
      await eventually(() => expect(queue()).toBeNull())
    },
    /** The ids of the assets the mass-edit queue holds. */
    queued: () => ui.store.getQueueItems('edit').map((row) => row.assetId),
    /** Whether the page asks about the unsaved metadata. */
    asks: () => !!document.body.querySelector('.v-dialog')?.textContent?.includes(UNSAVED),
  }
}

/** The mass-edit queue drawn over the whole page, or null while it is not, and its rows. */
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

/* The bin deleted the asset and told nobody: the tile stood as before, and the panel held the deleted asset with what
 * was typed into it and "Save" enabled. */
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
    // What was typed has nowhere to be saved: another tile is read without a question.
    await list.putQueueAway()
    list.tiles()[0].click()
    await settled()
    expect([list.asks(), list.panelShows()]).toEqual([false, { beingDeleted: false, saveDisabled: false }])
  })

  // The queue can be put away while the delete is on its way: what the row did after it was lost with the row.
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

  // The guard: a delete that failed changes nothing.
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

/* The panel offered "Save" of an asset deleted in the detail too: it is the same panel, holding the same asset. */
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
