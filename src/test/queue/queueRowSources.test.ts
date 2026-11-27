import type { UploadQueueItem } from '@anzusystems/common-admin'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { formMetadataOfAsset } from '@/domains/coreDam/shared/services/upload/queueRowBaseline'
import { assetDetail, createFakeDam, queueRow } from '@/test/support/fakeDam'
import type { FakeDam } from '@/test/support/fakeDam'
import { eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'
import type { UploadUiSetup } from '@/test/support/uploadUi'

/*
 * Sources are authors flagged as source. The ext system enables them per asset type, as it does authors.
 * Only a row of such a type shows them, sends them and takes them from a mass operation.
 */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const BULK = /^\/adm\/v1\/asset\/metadata-bulk-update$/
const SEARCH = /^\/adm\/v1\/(keyword|author)\/ext-system\/1\/search$/
const EDIT = 'edit'
const QUEUE = 'global'
const SOURCES_ON: Partial<UploadUiSetup> = {
  extSystem: {
    image: {
      sources: {
        enabled: true,
        required: false,
        creditFormat: '{sources}/{authors}',
        creditSourcesSeparator: '/',
        creditAuthorsSeparator: ', ',
      },
    },
  },
}

const saved = () => server.sent('PATCH', BULK).map((request) => JSON.parse(request.data as string))

const onServer = (id: string, over: Record<string, unknown> = {}) =>
  assetDetail(id, {
    flags: { described: true },
    sources: [],
    metadata: { customData: { title: 'from the server' }, authorSuggestions: {}, keywordSuggestions: {} },
    ...over,
  })

const listed = (id: string, assetType: string) => ({
  id,
  attributes: { assetType, assetStatus: 'with_file' },
  texts: { displayTitle: id },
  mainFile: { id: 'file-of-' + id, links: {} },
  mainFileSingleUse: null,
})

const pickedForMassEdit = async (assets: Array<ReturnType<typeof assetDetail>>, setup: Partial<UploadUiSetup> = {}) => {
  assets.forEach((asset) => server.asset(asset))
  const ui = await startUploadUi({ server, ...setup })
  const api = await import('@/domains/coreDam/asset/api/assetApi')
  await ui.store.addByAssets(
    EDIT,
    assets.map((asset) => listed(asset.id, (asset.attributes as { assetType: string }).assetType)) as never
  )
  await eventually(() =>
    expect(ui.store.getQueueItems(EDIT).every((row) => row.status === 'uploaded' && row.canEditMetadata)).toBe(true)
  )

  return {
    ...ui,
    api,
    rows: ui.store.getQueueItems(EDIT),
    save: () => api.bulkUpdateAssetsMetadata(ui.store.getQueueItems(EDIT)),
  }
}

const mountQueue = async (rows: UploadQueueItem[], setup: Partial<UploadUiSetup> = {}) => {
  const ui = await startUploadUi({ server, queues: { [QUEUE]: rows }, ...setup })
  const list = await ui.mount(() => import('@/domains/coreDam/asset/components/queue/AssetQueueEditable.vue'), {
    queueId: QUEUE,
    massOperations: false,
  })
  const card = list.querySelector<HTMLElement>('.dam-upload-queue__item')!
  const labels = () =>
    Array.from(card.querySelectorAll<HTMLElement>('.v-autocomplete')).map((input) =>
      input.querySelector('label')?.textContent?.trim()
    )

  return { ...ui, card, labels }
}

beforeEach(() => {
  server = createFakeDam()
  server.on('GET', SEARCH, () => ({ status: 200, data: { data: [] } }))
  server.on('PATCH', BULK, (request) => ({ status: 200, data: JSON.parse(request.data as string) }))
})

afterEach(() => {
  stopUploadUi()
})

describe('the sources of a queue row', () => {
  it('are a field beside the authors only where the ext system has sources for the type of the row', async () => {
    const withSources = await mountQueue([queueRow({ status: 'uploaded', canEditMetadata: true })], SOURCES_ON)
    expect(withSources.labels()).toEqual(['Keywords', 'Sources', 'Authors'])
    stopUploadUi()

    const without = await mountQueue([queueRow({ status: 'uploaded', canEditMetadata: true })])
    expect(without.labels()).toEqual(['Keywords', 'Authors'])
  })

  it('offer only sources, and no merged ones', async () => {
    const { card, asked } = await mountQueue([queueRow({ status: 'uploaded', canEditMetadata: true })], SOURCES_ON)
    const field = Array.from(card.querySelectorAll<HTMLElement>('.v-autocomplete')).find(
      (input) => input.querySelector('label')?.textContent?.trim() === 'Sources'
    )!
    const input = field.querySelector<HTMLInputElement>('input[type="text"]')!
    input.focus()
    input.value = 'Agen'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await vi.advanceTimersByTimeAsync(1000)

    const searched = asked.filter((url) => url.includes('text=Agen'))
    expect(searched).toHaveLength(1)
    expect(searched[0]).toContain('source=true')
    expect(searched[0]).toContain('canBeCurrentAuthor=true')
  })
})

describe('the bulk save of the sources', () => {
  it('sends the sources changed in a row of a type with sources, and nothing else of it', async () => {
    const { rows, save } = await pickedForMassEdit([onServer('asset-1'), onServer('asset-2')], SOURCES_ON)

    rows[0].sources = ['source-typed']
    await save()

    expect(saved()).toEqual([[{ id: 'asset-1', described: true, sources: ['source-typed'] }]])
  })

  it('sends nothing of the sources a second time: what the first save sent is what the server has', async () => {
    const { rows, save } = await pickedForMassEdit([onServer('asset-1')], SOURCES_ON)

    rows[0].sources = ['source-typed']
    await save()
    await save()

    expect(saved()).toEqual([[{ id: 'asset-1', described: true, sources: ['source-typed'] }]])
  })

  it('takes the sources the server has, in a new list, as no change', async () => {
    const { rows, save } = await pickedForMassEdit([onServer('asset-1', { sources: ['source-1'] })], SOURCES_ON)

    expect(rows[0].sources).toEqual(['source-1'])
    rows[0].sources = ['source-1']
    await save()

    expect(server.sent('PATCH')).toEqual([])
  })

  it('sends no sources of a type without them, so a row whose only change they are is not sent', async () => {
    const { rows, save } = await pickedForMassEdit([onServer('asset-1')])

    rows[0].sources = ['source-typed']
    await save()

    expect(server.sent('PATCH')).toEqual([])
  })

  it('fills the sources of a mass operation only into the rows of a type with sources', async () => {
    const { store, rows, save } = await pickedForMassEdit(
      [onServer('asset-1'), onServer('asset-2', { attributes: { assetType: 'audio', assetStatus: 'with_file' } })],
      SOURCES_ON
    )

    store.queueItemsReplaceEmptySources(EDIT, ['source-filled'])

    expect(rows.map((row) => row.sources)).toEqual([['source-filled'], []])
    await save()
    expect(saved()).toEqual([[{ id: 'asset-1', described: true, sources: ['source-filled'] }]])
  })

  it('fills only empty sources, unless told to replace them', async () => {
    const { store, rows } = await pickedForMassEdit(
      [onServer('asset-1', { sources: ['source-1'] }), onServer('asset-2')],
      SOURCES_ON
    )

    store.queueItemsReplaceEmptySources(EDIT, ['source-filled'])
    expect(rows.map((row) => row.sources)).toEqual([['source-1'], ['source-filled']])

    store.queueItemsReplaceEmptySources(EDIT, ['source-other'], true)
    expect(rows.map((row) => row.sources)).toEqual([['source-other'], ['source-other']])
  })
})

describe('the save of the asset detail', () => {
  const detailSave = async (setup: Partial<UploadUiSetup>) => {
    await startUploadUi({ server, ...setup })
    const api = await import('@/domains/coreDam/asset/api/assetApi')
    const asset = onServer('asset-1', { sources: ['source-1'] }) as never
    // Nothing known of the server: everything is sent.
    await api.updateAssetMetadata(asset, formMetadataOfAsset(asset), undefined)

    return saved()[0][0]
  }

  it('sends the sources where the ext system has them for the type of the asset', async () => {
    expect(await detailSave(SOURCES_ON)).toEqual(expect.objectContaining({ id: 'asset-1', sources: ['source-1'] }))
  })

  it('sends no sources where it does not', async () => {
    expect(await detailSave({})).not.toHaveProperty('sources')
  })
})
