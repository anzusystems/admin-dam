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

/* The bin of a row of the mass-edit queue deletes the asset of the row, one delete of it at a time: while its delete is
 * on its way the bin is disabled - also on the row drawn anew when the queue was put away and shown again meanwhile -
 * and once the delete has failed it works again. The real page of the list with its panel and the mass-edit queue, the
 * application around it as it starts; the server is a fake, and so is the address the page asks about a new version
 * of the application. */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const SEARCH = /^\/adm\/v1\/asset\/licence\/1(\/search)?$/
const DELETE_ASSET = /^\/adm\/v1\/asset\/([^/]+)$/

const LIST = '/assets'
const DELETE = 'Delete'

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

/** Every delete of an asset is held from now on: each answered, in the order sent, by what this gives back. */
const holdDeletes = () => {
  const waiting: Array<() => void> = []
  server.on(
    'DELETE',
    DELETE_ASSET,
    () => new Promise<FakeDamAnswer>((resolve) => waiting.push(() => resolve({ status: 204 })))
  )

  return async () => {
    await eventually(() => expect(waiting).not.toHaveLength(0))
    waiting.shift()!()
    await settled()
  }
}

/** The mass-edit queue drawn over the whole page, or null while it is not, and its rows. */
const queue = () => document.body.querySelector<HTMLElement>('.overlay--sidebar')
const rows = () => Array.from(queue()?.querySelectorAll<HTMLElement>('.dam-upload-queue__item') ?? [])
/** The bin of a row of the queue. */
const bin = (index: number) => buttonsNamed(rows()[index], DELETE)[0]

/** The page of the list with three assets, the tiles of those at the indexes picked for the mass edit, and the mass-edit
 * queue drawn over the whole page. */
const openQueue = async (picked: number[]) => {
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
  for (const index of picked) {
    tiles()[index].querySelectorAll<HTMLButtonElement>('.detail-icon')[0].click()
    await settled()
  }

  /** The mass-edit queue drawn over the whole page from the strip under the list. */
  const showQueue = async () => {
    buttonsNamed(document.body, 'Edit')[0].click()
    await eventually(() => expect(rows()).toHaveLength(picked.length))
  }
  await showQueue()

  return {
    ...ui,
    showQueue,
    /** Which tiles are drawn as of an asset being deleted. */
    deleting: () => tiles().map((tile) => !!tile.querySelector('.mdi-trash-can')),
    /** The bin of the row pressed, and its question answered. */
    deleteRow: async (index: number) => {
      bin(index).click()
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
  }
}

/** The deletes the server was sent, by the address. */
const deletesSent = () => server.sent('DELETE').map((request) => request.url)

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

/* A second press of the bin while the delete of the row was on its way sent a second delete: the server answered it as
 * one more delete - a second "deleted" - or, the asset gone by then, with an error the page showed. */
describe('the bin of a row of the mass-edit queue', () => {
  it('is disabled while its delete is on its way, and the asset is deleted once', async () => {
    const answer = holdDeletes()
    const queued = await openQueue([1])

    await queued.deleteRow(0)
    expect([deletesSent(), bin(0).disabled]).toEqual([['/adm/v1/asset/asset-2'], true])
    await answer()

    expect([deletesSent().length, queued.queued(), queued.deleting(), queued.alerts().length]).toEqual([
      1,
      [],
      [false, true, false],
      1,
    ])
  })

  // The queue put away and shown again draws its rows anew: what the row knew went with the row before.
  it('stays disabled on the row drawn anew when the queue was put away and shown again before the answer', async () => {
    const answer = holdDeletes()
    const queued = await openQueue([1])
    await queued.deleteRow(0)

    await queued.putQueueAway()
    await queued.showQueue()
    expect(bin(0).disabled).toBe(true)
    await answer()

    expect([deletesSent().length, queued.queued(), queued.alerts().length]).toEqual([1, [], 1])
  })

  it('works again once its delete has failed, and pressed again deletes the asset', async () => {
    let fails = true
    server.on('DELETE', DELETE_ASSET, () => {
      if (fails) throw httpError(500)

      return { status: 204 }
    })
    const queued = await openQueue([1])
    await queued.deleteRow(0)
    await eventually(() => expect(queued.alerts()).toHaveLength(1))
    expect([bin(0).disabled, queued.queued()]).toEqual([false, ['asset-2']])

    fails = false
    await queued.deleteRow(0)

    expect([deletesSent().length, queued.queued(), queued.deleting()]).toEqual([2, [], [false, true, false]])
  })

  // The guard: the delete of one asset leaves the bin of another as it is.
  it('leaves the bin of the row of another asset working while the delete of one is on its way', async () => {
    const answer = holdDeletes()
    const queued = await openQueue([0, 1])

    await queued.deleteRow(0)
    expect(bin(1).disabled).toBe(false)
    await queued.deleteRow(1)
    await answer()
    await answer()

    expect([deletesSent(), queued.queued()]).toEqual([['/adm/v1/asset/asset-1', '/adm/v1/asset/asset-2'], []])
  })
})

/* The bin and "Delete" of the detail go by it; a press that comes while one is on its way all the same sends nothing. */
describe('the delete of an asset once', () => {
  it('sends no second delete of the asset while one is on its way, and sends one again once that is answered', async () => {
    const answer = holdDeletes()
    await startUploadUi({ server })
    const { assetDeleteOnItsWay, deleteAssetOnce } = await import('@/domains/coreDam/asset/composables/assetDeleteOnce')

    const first = deleteAssetOnce('asset-1')
    await nextTick()
    expect([await deleteAssetOnce('asset-1'), assetDeleteOnItsWay('asset-1'), assetDeleteOnItsWay('asset-2')]).toEqual([
      false,
      true,
      false,
    ])
    await answer()
    expect([await first, assetDeleteOnItsWay('asset-1'), deletesSent().length]).toEqual([true, false, 1])

    const again = deleteAssetOnce('asset-1')
    await answer()

    expect([await again, deletesSent().length]).toEqual([true, 2])
  })
})
