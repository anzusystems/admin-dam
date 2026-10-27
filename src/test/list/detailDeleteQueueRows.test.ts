import type { UploadQueueItem } from '@anzusystems/common-admin'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RouterView } from 'vue-router'

import { assetDetail, assetFile, createFakeDam, httpError, queueRow, stubFileReader } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamAnswer, FakeDamRequest } from '@/test/support/fakeDam'
import {
  buttonsNamed,
  customField,
  dialogButton,
  eventually,
  startUploadUi,
  stopUploadUi,
} from '@/test/support/uploadUi'

/*
 * Deleting an asset in the detail takes every row of it out of the mass-edit queue and the upload queue, as
 * the bin of a row does. A leftover row would send a second delete or metadata to an asset that is going.
 * A running upload is stopped and its chunk aborted. A failed
 * delete, or the delete of another asset, takes out nothing.
 * An asset being deleted is not picked again, a running bulk save skips
 * it, and the mass-edit strip is not left standing with nothing picked.
 */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const SEARCH = /^\/adm\/v1\/asset\/licence\/1(\/search)?$/
const DELETE_ASSET = /^\/adm\/v1\/asset\/([^/]+)$/
const BULK = /^\/adm\/v1\/asset\/metadata-bulk-update$/

const LIST = '/assets'
const DELETE = 'Delete'
const EDIT_MORE = 'Edit more'

let deletingOnServer: string | null = null
let listed: string[] = []

/**
 * Not described: the bulk save sends its row.
 */
const onServer = (id: string) => ({
  ...assetDetail(id, {
    attributes: { assetType: 'image', assetStatus: id === deletingOnServer ? 'deleting' : 'with_file' },
    licence: 1,
    flags: { described: false, visible: true },
    mainFile: assetFile('file-' + id, 'processed', { asset: id }),
  }),
  keywords: [],
  authors: [],
})

const settled = () => vi.advanceTimersByTimeAsync(100)

const detail = () => document.body.querySelector<HTMLElement>('.dam-image-detail-dialog.v-overlay--active')
const panel = () => document.body.querySelector<HTMLElement>('.v-navigation-drawer--right')!
const queue = () => document.body.querySelector<HTMLElement>('.overlay--sidebar')
const rows = () => Array.from(queue()?.querySelectorAll<HTMLElement>('.dam-upload-queue__item') ?? [])
const strip = () => document.body.querySelector<HTMLElement>('.asset-footer__selected')

const editable = (assetId: string) =>
  queueRow({ status: 'uploaded', canEditMetadata: true, assetId, fileId: 'file-' + assetId })

const start = async (queues: Record<string, UploadQueueItem[]> = {}) => {
  const ui = await startUploadUi({
    server,
    grants: ['dam_asset_update', 'dam_asset_delete', 'dam_image_update'],
    customForm: { image: [customField('title')] },
    queues,
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

  return ui
}

const openList = async (picked: number[], uploads: UploadQueueItem[] = []) => {
  const ui = await start(uploads.length ? { global: uploads } : {})
  const uploadView = (await import('@/domains/coreDam/asset/composables/assetFooterUpload')).useAssetFooterUploadView()
  const assetListStore = (await import('@/domains/coreDam/asset/store/assetListStore')).useAssetListStore()
  const View = (await import('@/domains/coreDam/asset/components/list/AssetListView.vue')).default
  ui.router.addRoute({ path: LIST, name: '/(coreDam)/assets', component: View })
  ui.router.addRoute({ path: '/assets/:id', name: '/(coreDam)/assets/[id]', component: View })
  await ui.router.push(LIST)
  const page = await ui.mount(async () => ({ default: RouterView }))
  const tiles = () => Array.from(page.querySelectorAll<HTMLElement>('.dam-image-grid__item'))
  await eventually(() => expect(tiles()).toHaveLength(listed.length))
  for (const index of picked) {
    tiles()[index].querySelectorAll<HTMLButtonElement>('.detail-icon')[0].click()
    await settled()
  }

  return {
    ...ui,
    tiles,
    showQueue: async () => {
      buttonsNamed(document.body, 'Edit')[0].click()
      await eventually(() => expect(queue()).not.toBeNull())
      await settled()
    },
    openDetail: async (index: number) => {
      tiles()[index].querySelectorAll<HTMLButtonElement>('.detail-icon')[1].click()
      await eventually(() => expect(detail()?.querySelector('textarea')).toBeTruthy())
    },
    pressDelete: async () => {
      buttonsNamed(detail()!, DELETE)[0].click()
      await eventually(() => expect(dialogButton(DELETE)).not.toBeNull())
      dialogButton(DELETE)!.click()
      await settled()
    },
    showUploads: async () => {
      uploadView.setFullUpload()
      await eventually(() => expect(queue()).not.toBeNull())
      await settled()
    },
    putQueueAway: async () => {
      queue()!.querySelector('.mdi-chevron-down')!.closest('button')!.click()
      await eventually(() => expect(queue()).toBeNull())
      await settled()
    },
    deleteRow: async (index: number) => {
      buttonsNamed(rows()[index], DELETE)[0].click()
      await eventually(() => expect(dialogButton(DELETE)).not.toBeNull())
      dialogButton(DELETE)!.click()
      await settled()
    },
    clickWith: async (index: number, key: 'ctrlKey' | 'shiftKey') => {
      tiles()[index].dispatchEvent(new MouseEvent('click', { bubbles: true, [key]: true }))
      await settled()
    },
    picked: () => assetListStore.list.map((tile) => tile.selected),
    queued: () => ui.store.getQueueItems('edit').map((row) => row.assetId),
    uploading: () => ui.store.getQueueItems('global').map((row) => row.assetId),
  }
}

const deletesSent = () => server.sent('DELETE').map((request) => request.url)

beforeEach(() => {
  server = createFakeDam()
  deletingOnServer = null
  listed = ['asset-1', 'asset-2', 'asset-3']
  for (const id of ['asset-1', 'asset-2', 'asset-3']) server.asset(onServer(id))
  const empty = (): FakeDamAnswer => ({ status: 200, data: { data: [] } })
  server.on('GET', SEARCH, () => ({
    status: 200,
    data: { data: listed.map(onServer), hasNextPage: false },
  }))
  server.on('GET', /^\/adm\/v1\/asset-licence\/1$/, () => ({
    status: 200,
    data: { id: 1, name: 'Licence', extSystem: 1 },
  }))
  server.on('GET', /^\/adm\/v1\/ext-system\/1$/, () => ({ status: 200, data: { id: 1, name: 'Ext system' } }))
  server.on('GET', /^\/adm\/v1\/distribution\/asset(-file)?\/[^/]+$/, empty)
  server.on('GET', /^\/adm\/v1\/(keyword|author)\/ext-system\/1\/search$/, empty)
  server.on('GET', /^\/adm\/v1\/asset-slot\/asset\/[^/]+$/, () => ({ status: 200, data: { data: [], totalCount: 0 } }))
  server.on('PATCH', BULK, (request) => ({ status: 200, data: JSON.parse(request.data as string) }))
  // The window is one for the whole file, and so is its address.
  window.history.replaceState(null, '', LIST)
})

afterEach(() => {
  stopUploadUi()
})

/*
 * Guards a bug: the detail deleted the asset but the queues kept its rows. The bin of such a row sent the
 * delete again (a second "deleted", or an error if the asset was gone), and the bulk save sent its metadata.
 */
describe('a delete in the detail over the list', () => {
  it('takes out the row of the mass-edit queue whose "Edit more" opened the detail', async () => {
    server.on('DELETE', DELETE_ASSET, () => ({ status: 204 }))
    const list = await openList([1])
    await list.showQueue()
    buttonsNamed(rows()[0], EDIT_MORE)[0].click()
    await eventually(() => expect(detail()?.querySelector('textarea')).toBeTruthy())

    await list.pressDelete()
    await eventually(() => expect(detail()).toBeNull())

    expect([deletesSent(), list.queued(), rows().length, list.alerts().length]).toEqual([
      ['/adm/v1/asset/asset-2'],
      [],
      0,
      1,
    ])
  })

  it('takes out the row of the asset when the detail was opened by the pencil of its tile, and the bulk save sends the rest', async () => {
    server.on('DELETE', DELETE_ASSET, () => ({ status: 204 }))
    const list = await openList([0, 1])
    await list.openDetail(1)

    await list.pressDelete()
    await eventually(() => expect(detail()).toBeNull())
    expect([list.queued(), list.picked()]).toEqual([['asset-1'], [true, false, false]])

    await list.showQueue()
    expect(rows()).toHaveLength(1)
    queue()!.querySelector('.mdi-content-save')!.closest('button')!.click()
    await eventually(() => expect(server.sent('PATCH', BULK)).toHaveLength(1))

    const saved = JSON.parse(server.sent('PATCH', BULK)[0].data as string) as Array<{ id: string }>
    expect([saved.map((item) => item.id), deletesSent()]).toEqual([['asset-1'], ['/adm/v1/asset/asset-2']])
  })

  it('takes out the row of the asset when the detail was opened by "Edit more" of the panel beside the list', async () => {
    server.on('DELETE', DELETE_ASSET, () => ({ status: 204 }))
    const list = await openList([1])
    list.tiles()[1].click()
    await eventually(() => expect(panel().querySelector('textarea')).not.toBeNull())
    buttonsNamed(panel(), EDIT_MORE)[0].click()
    await eventually(() => expect(detail()?.querySelector('textarea')).toBeTruthy())

    await list.pressDelete()
    await eventually(() => expect(detail()).toBeNull())

    expect([deletesSent(), list.queued()]).toEqual([['/adm/v1/asset/asset-2'], []])
  })

  it('takes out the row of the upload queue whose upload still runs: its chunk on the wire is aborted', async () => {
    stubFileReader()
    const chunks: FakeDamRequest[] = []
    server.on('POST', /\/chunk$/, (request) => {
      chunks.push(request)

      return new Promise(() => undefined)
    })
    server.on('DELETE', DELETE_ASSET, () => ({ status: 204 }))
    const upload = queueRow({
      status: 'waiting',
      assetId: null,
      fileId: null,
      displayTitle: 'photo.jpg',
      file: new File([new Uint8Array(2000)], 'photo.jpg', { type: 'image/jpeg' }),
    })
    const other = queueRow({ status: 'uploaded', canEditMetadata: true, assetId: 'asset-3', fileId: 'file-asset-3' })
    const list = await openList([], [upload, other])
    list.store.processUpload('global')
    await eventually(() => expect(chunks).toHaveLength(1))
    expect([list.uploading(), list.rows.global[0].status]).toEqual([['asset-1', 'asset-3'], 'uploading'])
    await list.openDetail(0)

    await list.pressDelete()
    await eventually(() => expect(detail()).toBeNull())

    expect([list.uploading(), list.rows.global[0].status, chunks[0].config.signal?.aborted]).toEqual([
      ['asset-3'],
      'stop',
      true,
    ])
  })

  it('takes out nothing when the delete fails', async () => {
    server.on('DELETE', DELETE_ASSET, () => {
      throw httpError(500)
    })
    const list = await openList([1])
    await list.openDetail(1)

    await list.pressDelete()
    await eventually(() => expect(list.alerts()).toHaveLength(1))
    await list.showQueue()

    expect([list.queued(), rows().length, buttonsNamed(rows()[0], DELETE)[0].disabled]).toEqual([['asset-2'], 1, false])
  })

  it('leaves the row of another asset in the queue', async () => {
    server.on('DELETE', DELETE_ASSET, () => ({ status: 204 }))
    const list = await openList([0])
    await list.openDetail(1)

    await list.pressDelete()
    await eventually(() => expect(detail()).toBeNull())

    expect([deletesSent(), list.queued()]).toEqual([['/adm/v1/asset/asset-2'], ['asset-1']])
  })
})

describe('a delete in the detail over the list, with two rows of the asset in one queue', () => {
  it('takes out both rows', async () => {
    server.on('DELETE', DELETE_ASSET, () => ({ status: 204 }))
    const list = await openList([], [editable('asset-2'), editable('asset-2'), editable('asset-3')])
    await list.openDetail(1)

    await list.pressDelete()
    await eventually(() => expect(detail()).toBeNull())

    expect(list.uploading()).toEqual(['asset-3'])
  })
})

/*
 * Guards a bug: the page of an asset sent the user back to the list, but its row in the upload queue
 * outlives the page. Its bin deleted the asset again, and its form and the bulk save sent metadata to it.
 */
describe('a delete on the page of a detail', () => {
  const ASSET = '11111111-2222-4333-8444-555555555555'
  const FILE = 'aaaaaaaa-2222-4333-8444-555555555555'
  const pageAsset = () => ({ ...onServer(ASSET), mainFile: assetFile(FILE, 'processed', { asset: ASSET }) })

  beforeEach(() => {
    server.asset(pageAsset())
    server.on('GET', new RegExp('^/adm/v1/asset/asset-file/' + FILE + '$'), () => ({ status: 200, data: pageAsset() }))
  })

  it.each<[string, string, string, () => Promise<{ default: unknown }>, string]>([
    [
      'the page of the asset',
      '/(coreDam)/assets/[id]',
      '/assets/:id',
      () => import('@/domains/coreDam/asset/components/detail/AssetDetailView.vue'),
      '/assets/' + ASSET,
    ],
    [
      'the page of the asset of a file',
      '/(coreDam)/assets/file/[id]',
      '/assets/file/:id',
      () => import('@/domains/coreDam/asset/components/detail/AssetFileDetailView.vue'),
      '/assets/file/' + FILE,
    ],
  ])('takes the rows of the asset out of both queues, on %s', async (_where, name, path, load, address) => {
    server.on('DELETE', DELETE_ASSET, () => ({ status: 204 }))
    const ui = await start({
      global: [editable(ASSET), editable('asset-3')],
      edit: [queueRow({ type: 'asset', status: 'uploaded', canEditMetadata: true, assetId: ASSET })],
    })
    ui.router.addRoute({ path: LIST, name: '/(coreDam)/assets', component: { render: () => null } })
    ui.router.addRoute({ path, name, component: (await load()).default as never })
    await ui.router.push(address)
    const page = await ui.mount(async () => ({ default: RouterView }))
    await eventually(() => expect(page.querySelector('textarea')).toBeTruthy())

    buttonsNamed(page, DELETE)[0].click()
    await eventually(() => expect(dialogButton(DELETE)).not.toBeNull())
    dialogButton(DELETE)!.click()
    await eventually(() => expect(ui.alerts()).toHaveLength(1))

    expect([
      deletesSent(),
      ui.store.getQueueItems('global').map((row) => row.assetId),
      ui.store.getQueueItems('edit').map((row) => row.assetId),
    ]).toEqual([['/adm/v1/asset/' + ASSET], ['asset-3'], []])
  })
})

/*
 * Guards a bug: the bin of a row took out only its own row. The row of that asset in the
 * other queue kept its bin, form and place in the bulk save, and its tile stayed picked.
 */
describe('the bin of a row of the upload queue', () => {
  it('takes the row of its asset out of the mass edit too, and the tile is no longer picked', async () => {
    server.on('DELETE', DELETE_ASSET, () => ({ status: 204 }))
    const list = await openList([1], [editable('asset-2')])
    await list.showUploads()

    await list.deleteRow(0)
    await eventually(() => expect(list.uploading()).toEqual([]))

    expect([deletesSent(), list.queued(), list.picked()]).toEqual([
      ['/adm/v1/asset/asset-2'],
      [],
      [false, false, false],
    ])
  })
})

/*
 * Guards a bug: the mass edit was emptied while the upload queue covered the page
 * in place of its strip. The strip then came back saying "Selected files: 0".
 */
describe('the strip of the mass edit', () => {
  it('is not drawn with nothing picked once the upload queue over the whole page is put away', async () => {
    server.on('DELETE', DELETE_ASSET, () => ({ status: 204 }))
    const list = await openList([1], [editable('asset-2')])
    expect(strip()?.className).toContain('asset-footer__selected--compact')
    await list.showUploads()
    buttonsNamed(rows()[0], EDIT_MORE)[0].click()
    await eventually(() => expect(detail()?.querySelector('textarea')).toBeTruthy())
    await list.pressDelete()
    await eventually(() => expect(detail()).toBeNull())

    await list.putQueueAway()

    expect([list.queued(), strip()?.className]).toEqual([[], expect.stringContaining('asset-footer__selected--hidden')])
  })
})

/*
 * Guards a bug: a tile marked as being deleted could be picked again.
 * Its new row offered the bin, which deleted the asset once more.
 */
describe('picking an asset being deleted for the mass edit', () => {
  it('picks no tile of an asset deleted in the detail, by its checkbox or by a click with ctrl', async () => {
    server.on('DELETE', DELETE_ASSET, () => ({ status: 204 }))
    const list = await openList([])
    await list.openDetail(1)
    await list.pressDelete()
    await eventually(() => expect(detail()).toBeNull())

    list.tiles()[1].querySelectorAll<HTMLButtonElement>('.detail-icon')[0].click()
    await settled()
    expect([list.queued(), list.picked()]).toEqual([[], [false, false, false]])
    await list.clickWith(1, 'ctrlKey')

    expect([list.queued(), list.picked()]).toEqual([[], [false, false, false]])
  })

  it('marks every tile of the asset deleted in the detail, and picks none of them', async () => {
    server.on('DELETE', DELETE_ASSET, () => ({ status: 204 }))
    listed = ['asset-1', 'asset-2', 'asset-3', 'asset-2']
    const list = await openList([])
    await list.openDetail(1)
    await list.pressDelete()
    await eventually(() => expect(detail()).toBeNull())

    list.tiles()[3].querySelectorAll<HTMLButtonElement>('.detail-icon')[0].click()
    await settled()

    expect([list.tiles().map((tile) => !!tile.querySelector('.mdi-trash-can')), list.queued()]).toEqual([
      [false, true, false, true],
      [],
    ])
  })

  // A page asked for before the delete and answered after it brings the asset as it was before the delete.
  it('marks the tile a page answered after the delete brings of the asset deleted in the detail, and picks it not', async () => {
    server.on('DELETE', DELETE_ASSET, () => ({ status: 204 }))
    let searches = 0
    let answerNextPage: () => void = () => undefined
    server.on('GET', SEARCH, () => {
      searches++
      if (searches === 1) return { status: 200, data: { data: listed.map(onServer), hasNextPage: true } }
      const asked = { status: 200, data: { data: ['asset-2'].map(onServer), hasNextPage: false } }

      return new Promise<FakeDamAnswer>((resolve) => (answerNextPage = () => resolve(asked)))
    })
    const list = await openList([])
    const { useAssetListActions } = await import('@/domains/coreDam/asset/components/list/composables/assetListActions')
    const nextPage = useAssetListActions().fetchNextPage()
    await eventually(() => expect(searches).toBe(2))
    await list.openDetail(1)
    await list.pressDelete()
    await eventually(() => expect(detail()).toBeNull())

    answerNextPage()
    await nextPage
    await eventually(() => expect(list.tiles()).toHaveLength(4))
    list.tiles()[3].querySelectorAll<HTMLButtonElement>('.detail-icon')[0].click()
    await settled()

    expect([list.tiles().map((tile) => !!tile.querySelector('.mdi-trash-can')), list.queued()]).toEqual([
      [false, true, false, true],
      [],
    ])
  })

  it('skips an asset the server lists as being deleted in a range', async () => {
    deletingOnServer = 'asset-2'
    const list = await openList([])
    list.tiles()[0].click()
    await settled()

    await list.clickWith(2, 'shiftKey')

    expect([list.queued(), list.picked()]).toEqual([
      ['asset-1', 'asset-3'],
      [true, false, true],
    ])
  })
})

/*
 * A bulk save sends its batches one after the other. Guards a bug: an asset
 * deleted while a batch was on the wire was still sent in a later batch.
 */
describe('a bulk save on its way', () => {
  const picked = (count: number) =>
    Array.from({ length: count }, (_, index) =>
      queueRow({ type: 'asset', status: 'uploaded', canEditMetadata: true, assetId: 'asset-' + (index + 1) })
    )
  const batches = () =>
    server
      .sent('PATCH', BULK)
      .map((request) => (JSON.parse(request.data as string) as Array<{ id: string }>).map((item) => item.id))

  const saveHeld = async (count: number) => {
    let letGo: () => void = () => undefined
    let first = true
    server.on('PATCH', BULK, () => {
      if (!first) return { status: 200 }
      first = false

      return new Promise<FakeDamAnswer>((resolve) => (letGo = () => resolve({ status: 200 })))
    })
    await start()
    const { bulkUpdateAssetsMetadata } = await import('@/domains/coreDam/asset/api/assetApi')
    const { deleteAssetOnce } = await import('@/domains/coreDam/asset/composables/assetDeleteOnce')
    const saving = bulkUpdateAssetsMetadata(picked(count))
    await eventually(() => expect(batches()).toHaveLength(1))

    return { saving, deleteAssetOnce, letGo: () => letGo() }
  }

  it('leaves out of the batches still to come an asset deleted meanwhile, and sends one whose delete failed', async () => {
    server.on('DELETE', DELETE_ASSET, (_request, match) => {
      if (match[1] === 'asset-11') throw httpError(500)

      return { status: 204 }
    })
    const save = await saveHeld(12)
    await save.deleteAssetOnce('asset-12')
    await save.deleteAssetOnce('asset-11').catch(() => undefined)

    save.letGo()
    await save.saving

    expect(batches().map((batch) => batch.length)).toEqual([10, 1])
    expect(batches()[1]).toEqual(['asset-11'])
  })

  it('sends no batch that is left with nothing', async () => {
    server.on('DELETE', DELETE_ASSET, () => ({ status: 204 }))
    const save = await saveHeld(11)
    await save.deleteAssetOnce('asset-11')

    save.letGo()
    await save.saving

    expect(batches().map((batch) => batch.length)).toEqual([10])
  })
})
