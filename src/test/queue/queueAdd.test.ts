import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { assetDetail, assetFile, createFakeDam, seedDamConfig, stubFileReader } from '@/test/support/fakeDam'
import type { FakeDam } from '@/test/support/fakeDam'

/* The four ways a row gets into a queue, and what the row is when it does: files picked for upload, files picked
 * for a slot of an asset, assets picked for mass edit, and assets of an external provider. The real store over a
 * fake server; the ext system knows jpeg and png images, mp3 audio, mp4 video and pdf documents. */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))
vi.mock('@/domains/coreDam/asset/composables/currentExtSystem', () => ({
  useCurrentAssetLicence: () => ({ currentAssetLicenceId: { value: 7 } }),
  useCurrentExtSystem: () => ({ currentExtSystemId: { value: 1 } }),
}))
vi.mock('@/domains/coreDam/asset/composables/externalProviders', () => ({
  useExternalProviders: () => ({ activeExternalProvider: { value: 'unsplash' } }),
}))
vi.mock('@/domains/coreDam/author/composables/cachedAuthors', () => ({
  useCachedAuthors: () => ({ addToCachedAuthors: vi.fn(), fetchCachedAuthors: vi.fn() }),
}))
vi.mock('@/domains/coreDam/keyword/composables/cachedKeywords', () => ({
  useCachedKeywords: () => ({ addToCachedKeywords: vi.fn(), fetchCachedKeywords: vi.fn() }),
}))

const load = async (extSystemId = 1) => {
  vi.resetModules()
  setActivePinia(createPinia())
  const { useDamConfigStore } = await import('@anzusystems/common-admin')
  seedDamConfig(useDamConfigStore(), 1024, extSystemId)
  const { useUploadQueuesStore } = await import('@/domains/coreDam/asset/store/uploadQueuesStore')

  return useUploadQueuesStore()
}

const file = (name: string, type: string) => new File(['abc'], name, { type })

/** Holds every upload at its first request, so that a row can be looked at as it was added. */
const holdUploads = () => {
  server.on('POST', /./, () => new Promise(() => undefined))
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
  stubFileReader()
  server = createFakeDam()
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('files picked for upload', () => {
  it('become one row each, of the asset type the ext system gives their format, under the current licence', async () => {
    const store = await load()
    holdUploads()
    const picked = [
      file('photo.jpg', 'image/jpeg'),
      file('song.mp3', 'audio/mpeg'),
      file('clip.mp4', 'video/mp4'),
      file('paper.pdf', 'application/pdf'),
    ]

    await store.addByFiles('global', picked)

    const rows = store.getQueueItems('global')
    expect(rows.map((row) => [row.type, row.assetType, row.displayTitle, row.licenceId])).toEqual([
      ['file', 'image', 'photo.jpg', 7],
      ['file', 'audio', 'song.mp3', 7],
      ['file', 'video', 'clip.mp4', 7],
      ['file', 'document', 'paper.pdf', 7],
    ])
    expect(rows.map((row) => row.file)).toEqual(picked)
    // No asset yet, no metadata, nothing wrong.
    expect(rows.map((row) => [row.assetId, row.fileId, row.canEditMetadata, row.error.hasError])).toEqual(
      Array(4).fill([null, null, false, false])
    )
    // Two are sent at once, the others wait their turn.
    expect(rows.map((row) => row.status)).toEqual(['uploading', 'uploading', 'waiting', 'waiting'])
    expect(server.requests.map((request) => request.url)).toEqual([
      '/adm/v1/image/licence/7',
      '/adm/v1/audio/licence/7',
    ])
    expect([store.getQueueProcessedCount('global'), store.getQueueTotalCount('global')]).toEqual([0, 4])
    expect(store.getQueueItemsTypes('global')).toEqual(['image', 'audio', 'video', 'document'])
  })

  // A file name is not unique, and the key is what the list tells its tiles apart by.
  it('get a key of their own, also when two of them share a name', async () => {
    const store = await load()
    holdUploads()

    await store.addByFiles('global', [file('photo.jpg', 'image/jpeg'), file('photo.jpg', 'image/jpeg')])
    await store.addByFiles('global', [file('photo.jpg', 'image/jpeg')])

    const keys = store.getQueueItems('global').map((row) => row.key)
    expect(new Set(keys).size).toBe(3)
  })

  it('are left out when the ext system does not know their format', async () => {
    const store = await load()
    holdUploads()

    await store.addByFiles('global', [file('notes.txt', 'text/plain'), file('photo.png', 'image/png')])

    expect(store.getQueueItems('global').map((row) => row.displayTitle)).toEqual(['photo.png'])
  })

  it('create no queue at all when none of them is taken', async () => {
    const store = await load()

    await store.addByFiles('global', [file('notes.txt', 'text/plain')])

    expect(store.getQueue('global')).toBeNull()
    expect(store.getQueueFileInputKey('global')).toBe(-1)
  })

  it('are refused while the ext system of the user is not loaded', async () => {
    // The configuration is there for another ext system than the current one.
    const store = await load(2)

    await expect(store.addByFiles('global', [file('photo.jpg', 'image/jpeg')])).rejects.toThrow(
      'Ext system must be initialised.'
    )
    expect(store.getQueue('global')).toBeNull()
  })

  it('go to their own queue, each queue sending two at a time', async () => {
    const store = await load()
    holdUploads()
    const three = () => [file('a.jpg', 'image/jpeg'), file('b.jpg', 'image/jpeg'), file('c.jpg', 'image/jpeg')]

    await store.addByFiles('global', three())
    await store.addByFiles('other', three())

    expect(store.getQueueItems('global').map((row) => row.status)).toEqual(['uploading', 'uploading', 'waiting'])
    expect(store.getQueueItems('other').map((row) => row.status)).toEqual(['uploading', 'uploading', 'waiting'])
  })
})

describe('files picked for a slot of an asset', () => {
  it('become slot rows of that asset and slot, of the type of the asset', async () => {
    const store = await load()
    holdUploads()
    const picked = [file('song.mp3', 'audio/mpeg')]

    await store.addByFilesAsSlotUpload('slots', picked, 'asset-9', 'bonus', 'audio')

    const [row] = store.getQueueItems('slots')
    expect([row.type, row.assetType, row.assetId, row.slotName]).toEqual(['slotFile', 'audio', 'asset-9', 'bonus'])
    expect([row.displayTitle, row.licenceId, row.fileId, row.file]).toEqual(['song.mp3', 7, null, picked[0]])
    expect(row.status).toBe('uploading')
    expect(server.requests.map((request) => request.url)).toEqual(['/adm/v1/audio/asset/asset-9/slot-name/bonus'])
    // The slot the detail of the asset looks the upload up by.
    expect(store.getQueueItemForSlotItem('slots', 'bonus', 'asset-9')?.item).toBe(row)
  })

  // The type is the asset's, whatever the file is: the server is left to refuse it.
  it('are taken whatever their format', async () => {
    const store = await load()
    holdUploads()

    await store.addByFilesAsSlotUpload('slots', [file('notes.txt', 'text/plain')], 'asset-9', 'bonus', 'audio')

    expect(store.getQueueItems('slots').map((row) => [row.assetType, row.displayTitle])).toEqual([
      ['audio', 'notes.txt'],
    ])
    expect(JSON.parse(server.requests[0].data as string)).toEqual({ mimeType: 'text/plain', size: 3 })
  })
})

describe('assets picked for mass edit', () => {
  const listed = (id: string, over: Record<string, unknown> = {}) => ({
    id,
    attributes: { assetType: 'image', assetStatus: 'with_file' },
    texts: { displayTitle: 'title of ' + id },
    mainFile: {
      id: 'file-of-' + id,
      links: { image_list: { url: 'https://dam.test/' + id + '/list.jpg', width: 200, height: 100 } },
    },
    mainFileSingleUse: true,
    ...over,
  })

  it('become rows that load, with what the list already knows about the asset', async () => {
    const store = await load()
    // The read of their metadata is still on the wire.
    server.on('GET', /^\/adm\/v1\/asset\//, () => new Promise(() => undefined))

    await store.addByAssets('edit', [
      listed('asset-a'),
      listed('asset-b', {
        mainFile: null,
        mainFileSingleUse: null,
        attributes: { assetType: 'video', assetStatus: 'draft' },
      }),
    ] as never)

    const [first, second] = store.getQueueItems('edit')
    expect([first.type, first.status, first.assetType, first.assetStatus]).toEqual([
      'asset',
      'loading',
      'image',
      'with_file',
    ])
    expect([first.assetId, first.fileId, first.displayTitle, first.licenceId]).toEqual([
      'asset-a',
      'file-of-asset-a',
      'title of asset-a',
      7,
    ])
    // Or the switch of the form shows a `true` as off.
    expect(first.mainFileSingleUse).toBe(true)
    expect(first.imagePreview).toEqual({ url: 'https://dam.test/asset-a/list.jpg', width: 200, height: 100 })
    expect(first.canEditMetadata).toBe(false)
    // An asset with no file yet has none of that.
    expect([second.assetType, second.assetStatus, second.fileId, second.mainFileSingleUse]).toEqual([
      'video',
      'draft',
      null,
      null,
    ])
    expect(second.imagePreview).toBeUndefined()
    // Nothing is uploaded for them.
    expect(server.sent('POST')).toEqual([])
    expect([store.getQueueProcessedCount('edit'), store.getQueueTotalCount('edit')]).toEqual([0, 2])
  })

  it('are given their metadata and their form by one read of them all', async () => {
    const store = await load()
    server.asset(
      assetDetail('asset-a', {
        mainFileSingleUse: false,
        metadata: {
          customData: { title: 'a' },
          authorSuggestions: { 'Known Author': ['author-a', 'author-b'] },
          keywordSuggestions: {},
        },
      })
    )
    server.asset(assetDetail('asset-b', { keywords: [], authors: [], mainFile: assetFile('file-b') }))

    await store.addByAssets('edit', [listed('asset-a'), listed('asset-b')] as never)
    await vi.advanceTimersByTimeAsync(0)

    // One request for the lot, under the current licence.
    expect(server.sent('GET').map((request) => request.url)).toEqual(['/adm/v1/asset/licence/7/ids/asset-a,asset-b'])
    const [first, second] = store.getQueueItems('edit')
    expect([first.status, first.canEditMetadata]).toEqual(['uploaded', true])
    expect([first.keywords, first.authors, first.customData]).toEqual([
      ['keyword-server'],
      ['author-server'],
      { title: 'a' },
    ])
    // The switch as the detail says it, over what the list said.
    expect(first.mainFileSingleUse).toBe(false)
    expect(first.authorConflicts).toEqual(['author-a', 'author-b'])
    expect([second.status, second.canEditMetadata, second.keywords]).toEqual(['uploaded', true, []])
    expect([store.getQueueProcessedCount('edit'), store.getQueueTotalCount('edit')]).toEqual([2, 2])
  })
})

describe('assets of an external provider', () => {
  const provided = (id: string) => ({
    id,
    texts: { displayTitle: 'title of ' + id },
    attributes: { assetType: 'image' },
    url: 'https://provider.test/' + id + '.jpg',
    metadata: { width: 800 },
  })

  it('become settled rows when they are only picked, with nothing asked of the server', async () => {
    const store = await load()

    await store.addByExternalProviderAsset('edit', [provided('photo-1'), provided('photo-2')] as never)

    const [row] = store.getQueueItems('edit')
    expect([row.type, row.status, row.assetType, row.assetStatus]).toEqual([
      'externalProviderAsset',
      'uploaded',
      'image',
      'with_file',
    ])
    expect([row.externalProviderAssetId, row.externalProviderName, row.externalProviderMetadata]).toEqual([
      'photo-1',
      'unsplash',
      { width: 800 },
    ])
    expect([row.displayTitle, row.licenceId, row.assetId, row.fileId]).toEqual(['title of photo-1', 7, null, null])
    // The provider's own picture stands in for a preview.
    expect(row.imagePreview?.url).toBe('https://provider.test/photo-1.jpg')
    expect(server.requests).toEqual([])
    expect([store.getQueueProcessedCount('edit'), store.getQueueTotalCount('edit')]).toEqual([2, 2])
  })

  it('become waiting rows that the queue imports when they are to be imported', async () => {
    const store = await load()

    await store.addByExternalProviderAsset('global', [provided('photo-1')] as never, true)
    await vi.advanceTimersByTimeAsync(0)

    const [row] = store.getQueueItems('global')
    expect(server.requests.map((request) => [request.method, request.url])).toEqual([
      ['POST', '/adm/v1/image/licence/7/external-provider'],
    ])
    expect(JSON.parse(server.requests[0].data as string)).toEqual({ id: 'photo-1', externalProvider: 'unsplash' })
    // The asset and the file the server made for it; from here the server works on the file.
    expect([row.status, row.assetId, row.fileId]).toEqual(['processing', 'asset-1', 'file-1'])
  })
})
