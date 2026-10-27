import type { UploadQueueItem } from '@anzusystems/common-admin'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { assetDetail, createFakeDam } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamAnswer } from '@/test/support/fakeDam'
import { eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/*
 * A batch sent while a save of the asset is in flight may be
 * answered from before or after that save, and the order is unknown.
 * The row must not take or keep data by answer order alone.
 */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const BULK = /^\/adm\/v1\/asset\/metadata-bulk-update$/
const BATCH_READ = /^\/adm\/v1\/asset\/licence\/1\/ids\/.+$/
const EDIT = 'edit'

const onServer = (keywords: string[]) =>
  assetDetail('asset-1', {
    keywords,
    flags: { described: true },
    metadata: { customData: { title: 'from the server' }, authorSuggestions: {}, keywordSuggestions: {} },
  })

const listed = {
  id: 'asset-1',
  attributes: { assetType: 'image', assetStatus: 'with_file' },
  texts: { displayTitle: 'asset-1' },
  mainFile: { id: 'file-of-asset-1', links: {} },
  mainFileSingleUse: null,
}

const start = async () => {
  const ui = await startUploadUi({ server })
  const api = await import('@/domains/coreDam/asset/api/assetApi')
  const { queueRowBaseline } = await import('@/domains/coreDam/shared/services/upload/queueRowBaseline')
  const row = () => ui.store.getQueueItems(EDIT)[0]
  const pick = async () => {
    await ui.store.addByAssets(EDIT, [listed] as never)
    await eventually(() => expect([row()?.status, row()?.canEditMetadata]).toEqual(['uploaded', true]))
  }

  return {
    ...ui,
    row,
    pick,
    save: () => api.bulkUpdateAssetsMetadata(ui.store.getQueueItems(EDIT)),
    held: () => [row().keywords, queueRowBaseline(row() as UploadQueueItem)?.keywords],
  }
}

const batchReads = () => server.sent('GET', BATCH_READ).length

beforeEach(() => {
  server = createFakeDam()
  server.asset(onServer(['before']))
  server.on('GET', /^\/adm\/v1\/(keyword|author)\//, () => ({ status: 200, data: { data: [] } }))
})

afterEach(() => {
  stopUploadUi()
})

describe('a mass-edit row whose asset is saved while its batch is on its way', () => {
  it('picked again during the bulk save of it: holds what the server has after the save, and sends nothing', async () => {
    const ui = await start()
    await ui.pick()
    ui.row().keywords = ['typed']
    let answerSave: () => void = () => undefined
    server.on(
      'PATCH',
      BULK,
      (request) =>
        new Promise<FakeDamAnswer>((resolve) => {
          answerSave = () => {
            server.asset(onServer(['typed']))
            resolve({ status: 200, data: JSON.parse(request.data as string) })
          }
        })
    )
    const saving = ui.save()
    await eventually(() => expect(server.sent('PATCH', BULK)).toHaveLength(1))

    await ui.store.removeByAssetId(EDIT, 'asset-1')
    await ui.pick()
    expect(ui.held()).toEqual([['before'], ['before']])
    answerSave()
    await saving

    await eventually(() => expect(ui.held()).toEqual([['typed'], ['typed']]))
    expect(batchReads()).toBe(3)
    await ui.save()
    expect(server.sent('PATCH', BULK)).toHaveLength(1)
  })

  it('read during a save of the panel: holds what another editor saved after it', async () => {
    const ui = await start()
    const { useAssetDetailStore } = await import('@/domains/coreDam/asset/store/assetDetailStore')
    const detail = useAssetDetailStore()
    detail.setAsset(onServer(['before']) as never)
    let answerBatch: () => void = () => undefined
    let batches = 0
    server.on('GET', BATCH_READ, () => {
      batches++
      if (batches > 1) return { status: 200, data: { data: [onServer(['of another editor'])] } }

      return new Promise<FakeDamAnswer>(
        (resolve) => (answerBatch = () => resolve({ status: 200, data: { data: [onServer(['of the panel'])] } }))
      )
    })
    const saveAnswered = detail.saveSent(detail.asset!)
    await ui.store.addByAssets(EDIT, [listed] as never)
    await eventually(() => expect(batches).toBe(1))
    ui.store.updateAssetMetadata(onServer(['of the panel']) as never)
    saveAnswered(false)

    answerBatch()

    await eventually(() => expect(ui.held()).toEqual([['of another editor'], ['of another editor']]))
    expect(batches).toBe(2)
  })

  it('read with no save on its way: is read once', async () => {
    const ui = await start()

    await ui.pick()

    expect([ui.held(), batchReads()]).toEqual([[['before'], ['before']], 1])
  })
})
