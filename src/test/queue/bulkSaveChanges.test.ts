import type { UploadQueueItem } from '@anzusystems/common-admin'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { VLayout } from 'vuetify/components'

import { assetDetail, assetFile, createFakeDam, httpError, queueRow, validationError } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamAnswer } from '@/test/support/fakeDam'
import { buttonsNamed, customField, eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'
import type { UploadUiSetup } from '@/test/support/uploadUi'

/*
 * The bulk save sends only the keywords, authors, custom data and single-use
 * switch changed since the row last got them from the server or saved them.
 * A field sent as loaded would overwrite what another editor saved meanwhile.
 * A row with nothing to write is not sent, and with no such rows there is no request.
 */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const BULK = /^\/adm\/v1\/asset\/metadata-bulk-update$/
const BATCH_READ = /^\/adm\/v1\/asset\/licence\/1\/ids\/.+$/
const EDIT = 'edit'
const UPLOADS = 'global'

const saved = () => server.sent('PATCH', BULK).map((request) => JSON.parse(request.data as string))

const onServer = (id: string, over: Record<string, unknown> = {}) =>
  assetDetail(id, {
    flags: { described: true },
    metadata: { customData: { title: 'from the server', note: 'kept' }, authorSuggestions: {}, keywordSuggestions: {} },
    ...over,
  })
const notDescribed = { flags: { described: false } }

const listed = (id: string, assetType = 'image') => ({
  id,
  attributes: { assetType, assetStatus: 'with_file' },
  texts: { displayTitle: id },
  mainFile: { id: 'file-of-' + id, links: {} },
  mainFileSingleUse: null,
})

const start = async (queues: Record<string, UploadQueueItem[]> = {}, setup: Partial<UploadUiSetup> = {}) => {
  const ui = await startUploadUi({ server, queues, ...setup })
  const api = await import('@/domains/coreDam/asset/api/assetApi')
  const { queueRowBaseline } = await import('@/domains/coreDam/shared/services/upload/queueRowBaseline')

  return {
    ...ui,
    save: (queueId: string) => api.bulkUpdateAssetsMetadata(ui.store.getQueueItems(queueId)),
    baseline: (row: UploadQueueItem) => queueRowBaseline(row),
  }
}

const pickedForMassEdit = async (assets: Array<ReturnType<typeof assetDetail>>, setup: Partial<UploadUiSetup> = {}) => {
  assets.forEach((asset) => server.asset(asset))
  const ui = await start({}, setup)
  await ui.store.addByAssets(
    EDIT,
    assets.map((asset) => listed(asset.id, (asset.attributes as { assetType: string }).assetType)) as never
  )
  await eventually(() =>
    expect(ui.store.getQueueItems(EDIT).every((row) => row.status === 'uploaded' && row.canEditMetadata)).toBe(true)
  )

  return { ...ui, rows: ui.store.getQueueItems(EDIT), save: () => ui.save(EDIT) }
}

beforeEach(() => {
  server = createFakeDam()
  server.on('GET', /^\/adm\/v1\/(keyword|author)\//, () => ({ status: 200, data: { data: [] } }))
  server.on('PATCH', BULK, (request) => ({ status: 200, data: JSON.parse(request.data as string) }))
})

afterEach(() => {
  stopUploadUi()
})

describe('the bulk save of assets picked for mass edit', () => {
  /*
   * A row sent with its id alone would be reported to every listener as a change of the asset.
   * core-dam treats the custom data and authors a row leaves out as a change.
   */
  it('does not send a row nobody changed, of an asset that is described', async () => {
    const { rows, save } = await pickedForMassEdit([onServer('asset-1'), onServer('asset-2'), onServer('asset-3')])

    rows[1].keywords = ['keyword-typed']
    await save()

    expect(saved()).toEqual([[{ id: 'asset-2', described: true, keywords: ['keyword-typed'] }]])
  })

  it('makes no request, and is done, when no row has anything to send', async () => {
    const { save } = await pickedForMassEdit([onServer('asset-1'), onServer('asset-2')])

    await expect(save()).resolves.toBeUndefined()

    expect(server.sent('PATCH')).toEqual([])
  })

  it('sends a row nobody changed, of an asset that is not described, to mark it described - once', async () => {
    const { save } = await pickedForMassEdit([onServer('asset-1', notDescribed), onServer('asset-2')])

    await save()
    await save()

    expect(saved()).toEqual([[{ id: 'asset-1', described: true }]])
  })

  it.each<[string, (row: UploadQueueItem) => void, Record<string, unknown>]>([
    [
      'the keywords',
      (row) => (row.keywords = ['keyword-server', 'keyword-added']),
      { keywords: ['keyword-server', 'keyword-added'] },
    ],
    ['the keywords, emptied', (row) => (row.keywords = []), { keywords: [] }],
    ['the authors', (row) => (row.authors = ['author-other']), { authors: ['author-other'] }],
    // The server treats a form field that is left out as emptied, so the custom data are sent whole.
    [
      'one custom field, with the others',
      (row) => (row.customData = { ...row.customData, title: 'typed' }),
      { customData: { title: 'typed', note: 'kept' } },
    ],
    [
      'a custom field emptied, with the others',
      (row) => (row.customData = { ...row.customData, note: null }),
      { customData: { title: 'from the server', note: null } },
    ],
    ['the single-use switch', (row) => (row.mainFileSingleUse = true), { mainFileSingleUse: true }],
  ])('sends of a row only what was changed in it: %s', async (_field, change, sent) => {
    const { rows, save } = await pickedForMassEdit([onServer('asset-1'), onServer('asset-2', notDescribed)])

    change(rows[0])
    await save()

    expect(saved()).toEqual([
      [
        { id: 'asset-1', described: true, ...sent },
        { id: 'asset-2', described: true },
      ],
    ])
  })

  // Compared by value: forms and mass operations write new lists and objects into a row.
  it('takes the same values in a new list or object as no change, and another order of a list as a change', async () => {
    const { rows, save } = await pickedForMassEdit([
      onServer('asset-1', { keywords: ['keyword-a', 'keyword-b'] }),
      onServer('asset-2', { keywords: ['keyword-a', 'keyword-b'] }),
    ])

    rows[0].keywords = ['keyword-a', 'keyword-b']
    rows[0].authors = [...rows[0].authors]
    // A key without a value is not sent, so it is not a change.
    rows[0].customData = { note: 'kept', title: 'from the server', caption: undefined }
    rows[1].keywords = ['keyword-b', 'keyword-a']
    await save()

    expect(saved()).toEqual([[{ id: 'asset-2', described: true, keywords: ['keyword-b', 'keyword-a'] }]])
  })

  it('sends what a mass operation wrote into the rows, of the rows it wrote into', async () => {
    const { store, save } = await pickedForMassEdit([
      onServer('asset-1', { keywords: [], authors: [] }),
      onServer('asset-2'),
    ])

    store.queueItemsReplaceEmptyKeywords(EDIT, ['keyword-filled'])
    store.queueItemsReplaceEmptyAuthors(EDIT, ['author-filled'])
    store.queueItemsReplaceEmptyCustomDataValue(
      EDIT,
      { assetType: 'image', elementProperty: 'title', value: 'replaced' },
      true
    )
    await save()

    expect(saved()).toEqual([
      [
        {
          id: 'asset-1',
          described: true,
          keywords: ['keyword-filled'],
          authors: ['author-filled'],
          customData: { title: 'replaced', note: 'kept' },
        },
        { id: 'asset-2', described: true, customData: { title: 'replaced', note: 'kept' } },
      ],
    ])
  })

  it('sends nothing of a row with the second save: what the first sent is what the server has', async () => {
    const { rows, save } = await pickedForMassEdit([onServer('asset-1', notDescribed)])
    rows[0].keywords = ['keyword-typed']
    rows[0].mainFileSingleUse = true

    await save()
    await save()

    expect(saved()).toEqual([
      [{ id: 'asset-1', described: true, keywords: ['keyword-typed'], mainFileSingleUse: true }],
    ])
  })

  it.each<[string, ReturnType<typeof assetDetail>, (row: UploadQueueItem) => void, Record<string, unknown>]>([
    [
      'a changed row',
      onServer('asset-1'),
      (row) => (row.keywords = ['keyword-typed']),
      { id: 'asset-1', described: true, keywords: ['keyword-typed'] },
    ],
    [
      'an unchanged row of an asset that is not described',
      onServer('asset-1', notDescribed),
      () => undefined,
      { id: 'asset-1', described: true },
    ],
  ])('sends %s again after a save that failed', async (_which, asset, change, body) => {
    const { rows, save } = await pickedForMassEdit([asset])
    change(rows[0])
    server.on('PATCH', BULK, () => {
      throw httpError(500)
    })

    await expect(save()).rejects.toBeDefined()
    server.on('PATCH', BULK, (request) => ({ status: 200, data: JSON.parse(request.data as string) }))
    await save()

    expect(saved()).toEqual([[body], [body]])
  })

  // The batch on the wire is made when the save begins. Text typed after that is sent by the next save.
  it('sends with the next save what was typed into a row while its save was on the wire', async () => {
    const { rows, save } = await pickedForMassEdit([onServer('asset-1')])
    let answer = () => undefined as void
    server.on(
      'PATCH',
      BULK,
      () => new Promise<FakeDamAnswer>((resolve) => (answer = () => resolve({ status: 200, data: [] })))
    )
    rows[0].keywords = ['keyword-first']

    const first = save()
    await eventually(() => expect(saved()).toHaveLength(1))
    rows[0].keywords = ['keyword-second']
    answer()
    await first
    server.on('PATCH', BULK, () => ({ status: 200, data: [] }))
    await save()

    expect(saved()).toEqual([
      [{ id: 'asset-1', described: true, keywords: ['keyword-first'] }],
      [{ id: 'asset-1', described: true, keywords: ['keyword-second'] }],
    ])
  })

  describe('in requests of ten rows', () => {
    const many = Array.from({ length: 23 }, (_value, index) => onServer('asset-' + index))
    const ids = (batch: Array<{ id: string }>) => batch.map((row) => row.id)

    it('counts the rows that are sent: twelve changed among twenty-three go as ten and two', async () => {
      const { rows, save } = await pickedForMassEdit(many)
      const changed = rows.filter((_row, index) => index % 2 === 0)
      changed.forEach((row) => (row.keywords = ['keyword-typed']))

      await save()

      expect(saved().map((batch) => batch.length)).toEqual([10, 2])
      expect(saved().flatMap(ids)).toEqual(changed.map((row) => row.assetId))
      expect(saved()[1][1]).toEqual({ id: 'asset-22', described: true, keywords: ['keyword-typed'] })
    })

    it('sends all of them, ten to a request, when all were changed', async () => {
      const { store, save } = await pickedForMassEdit(many)
      store.queueItemsReplaceEmptyKeywords(EDIT, ['keyword-replaced'], true)

      await save()

      expect(saved().map((batch) => batch.length)).toEqual([10, 10, 3])
      expect(saved().flatMap(ids)).toEqual(many.map((asset) => asset.id))
    })

    it('sends with the next save the rows of the request that failed and of those after it, not of those before', async () => {
      const { store, save } = await pickedForMassEdit(many)
      store.queueItemsReplaceEmptyKeywords(EDIT, ['keyword-replaced'], true)
      let requests = 0
      server.on('PATCH', BULK, (request) => {
        if (++requests === 2) throw httpError(500)

        return { status: 200, data: JSON.parse(request.data as string) }
      })

      await expect(save()).rejects.toBeDefined()
      await save()

      expect(saved().map((batch) => batch.length)).toEqual([10, 10, 10, 3])
      expect(saved().slice(2).flatMap(ids)).toEqual(many.slice(10).map((asset) => asset.id))
      expect(saved()[3][2]).toEqual({ id: 'asset-22', described: true, keywords: ['keyword-replaced'] })
    })

    // The server names a refused field by its place in the request, not by the row's place in the queue.
    it('names a refused field by the row the request held at that place, when rows before it were not sent', async () => {
      const titled = (name: string) => ({ ...customField('title'), name })
      const { rows, save } = await pickedForMassEdit(
        [onServer('asset-1'), onServer('asset-2', { attributes: { assetType: 'video', assetStatus: 'with_file' } })],
        { customForm: { image: [titled('Title of the photo')], video: [titled('Title of the video')] } }
      )
      rows[1].customData = { ...rows[1].customData, title: '' }
      server.on('PATCH', BULK, () => {
        throw validationError({ '[0].customData.title': ['error_field_empty'] })
      })

      const refused = await save().then(
        () => undefined,
        (error: { named?: Array<{ field: string }> }) => error
      )

      expect(saved()[0].map((row: { id: string }) => row.id)).toEqual(['asset-2'])
      expect(refused?.named?.map((one) => one.field)).toEqual(['Title of the video'])
    })
  })
})

describe('the bulk save of a row of which it is not known what the server has', () => {
  // No app path puts a row in like this. It is the fallback should one appear.
  const unknown = (over: Partial<UploadQueueItem> = {}) =>
    queueRow({
      type: 'asset',
      status: 'uploaded',
      canEditMetadata: true,
      keywords: ['keyword-1'],
      authors: ['author-1'],
      customData: { title: 'x' },
      ...over,
    })
  const whole = { described: true, keywords: ['keyword-1'], authors: ['author-1'], customData: { title: 'x' } }

  it('sends it whole, and the single-use switch once that is known', async () => {
    const { save } = await start({
      [EDIT]: [unknown(), unknown({ assetId: 'asset-2', mainFileSingleUse: false })],
    })

    await save(EDIT)

    expect(saved()).toEqual([
      [
        { id: 'asset-1', ...whole },
        { id: 'asset-2', ...whole, mainFileSingleUse: false },
      ],
    ])
  })

  it('knows after that save what the server has of it: nothing goes out until it is changed, then the change', async () => {
    const { save, store } = await start({ [EDIT]: [unknown()] })

    await save(EDIT)
    await save(EDIT)
    store.getQueueItems(EDIT)[0].authors = ['author-2']
    await save(EDIT)

    expect(saved()).toEqual([
      [{ id: 'asset-1', ...whole }],
      [{ id: 'asset-1', described: true, authors: ['author-2'] }],
    ])
  })

  it('sends whole a row whose asset the server did not say of whether it is described', async () => {
    const { save } = await pickedForMassEdit([onServer('asset-1', { flags: undefined })])

    await save()

    expect(saved()).toEqual([
      [
        {
          id: 'asset-1',
          described: true,
          keywords: ['keyword-server'],
          authors: ['author-server'],
          customData: { title: 'from the server', note: 'kept' },
          mainFileSingleUse: false,
        },
      ],
    ])
  })
})

describe('what the bulk save takes for the metadata the server has of a row', () => {
  // That save always marks the asset described, whatever the asset it was made from says.
  it('what the detail or the panel of the list saved of its asset, which is described from then on', async () => {
    const { store, save } = await pickedForMassEdit([onServer('asset-1', notDescribed)])

    store.updateAssetMetadata(
      onServer('asset-1', { ...notDescribed, keywords: ['keyword-of-the-detail'], mainFileSingleUse: true }) as never
    )
    await save()

    expect(server.sent('PATCH')).toEqual([])
  })

  /*
   * During an upload the metadata notification comes while the file is still being sent.
   * The first load fills only what is empty on the row, so earlier mass-operation values stay and count as a change.
   */
  const uploading = (over: Partial<UploadQueueItem> = {}) => queueRow({ status: 'uploading', ...over })
  const notified = async (store: Awaited<ReturnType<typeof start>>['store']) => {
    const read = store.queueItemMetadataProcessed('asset-1')
    await vi.advanceTimersByTimeAsync(5000)
    await read
  }

  it('what the notification of its metadata loaded into an upload, not what the row held before it', async () => {
    server.asset(onServer('asset-1', { ...notDescribed, keywords: [], mainFile: assetFile('file-1', 'uploading') }))
    const { store, save } = await start({ [UPLOADS]: [uploading()] })
    store.queueItemsReplaceEmptyKeywords(UPLOADS, ['keyword-filled-before'])

    await notified(store)
    const [row] = store.getQueueItems(UPLOADS)
    expect([row.canEditMetadata, row.authors, row.customData]).toEqual([
      true,
      ['author-server'],
      { title: 'from the server', note: 'kept' },
    ])
    await save(UPLOADS)

    expect(saved()).toEqual([[{ id: 'asset-1', described: true, keywords: ['keyword-filled-before'] }]])
  })

  it.each([
    ['is not described yet: the row is sent to mark it', notDescribed, [[{ id: 'asset-1', described: true }]]],
    ['is described: the row is not sent', {}, []],
  ])('what the refresh button of a row loaded into it, of an asset that %s', async (_which, flags, sent) => {
    server.asset(onServer('asset-1', flags))
    const { store, save } = await start({ [UPLOADS]: [queueRow({ status: 'processing' })] })

    await store.refreshQueueItem(store.getQueueItems(UPLOADS)[0])
    expect(store.getQueueItems(UPLOADS)[0].canEditMetadata).toBe(true)
    await save(UPLOADS)

    expect(saved()).toEqual(sent)
  })

  /*
   * A row gets its metadata once. A later read of its asset leaves the row as it is.
   * Treating it as new data would send the row's keywords over ones saved meanwhile.
   */
  it('not a later read of the asset, which does not load the row again', async () => {
    server.asset(onServer('asset-1', { keywords: ['keyword-at-first'], mainFile: assetFile('file-1', 'uploading') }))
    const { store, save } = await start({ [UPLOADS]: [uploading()] })
    await notified(store)
    const [row] = store.getQueueItems(UPLOADS)
    expect(row.keywords).toEqual(['keyword-at-first'])

    server.asset(onServer('asset-1', { keywords: ['keyword-of-another-editor'] }))
    await store.refreshQueueItem(row)
    expect([row.status, row.keywords]).toEqual(['uploaded', ['keyword-at-first']])
    row.authors = ['author-typed']
    await save(UPLOADS)

    expect(saved()).toEqual([[{ id: 'asset-1', described: true, authors: ['author-typed'] }]])
  })

  it('what a mass-edit row had before its file failed, once the file is processed after all', async () => {
    const { store, rows, save } = await pickedForMassEdit([onServer('asset-1', notDescribed)])
    store.queueItemFailed('asset-1', 'unknown', 'file-of-asset-1')
    expect(rows[0].canEditMetadata).toBe(false)

    void store.queueItemProcessed('asset-1', 'file-of-asset-1')
    await vi.advanceTimersByTimeAsync(1000)
    expect(rows[0].canEditMetadata).toBe(true)
    await save()

    expect(saved()).toEqual([[{ id: 'asset-1', described: true }]])
  })
})

/*
 * Reads and saves of a row's metadata have an order.
 * An answer asked for before the row was last given its metadata
 * is older than what the row holds, however late it arrives.
 * Taking it would revert the row and the known server state, and the next save would undo the previous one.
 */
describe('a mass-edit row whose metadata are read twice', () => {
  const customData = (title: string) => ({ title, note: 'kept' })
  const answered = (keyword: string, title = 'from the server', over: Record<string, unknown> = {}) =>
    onServer('asset-1', {
      keywords: [keyword],
      metadata: { customData: customData(title), authorSuggestions: {}, keywordSuggestions: {} },
      ...over,
    })

  const twiceRead = async () => {
    const answers: Array<(asset: ReturnType<typeof assetDetail>) => void> = []
    server.on(
      'GET',
      BATCH_READ,
      () =>
        new Promise<FakeDamAnswer>((resolve) =>
          answers.push((asset) => resolve({ status: 200, data: { data: [asset] } }))
        )
    )
    const ui = await start()
    await ui.store.addByAssets(EDIT, [listed('asset-1')] as never)
    await ui.store.removeByAssetId(EDIT, 'asset-1')
    await ui.store.addByAssets(EDIT, [listed('asset-1')] as never)
    await eventually(() => expect(answers).toHaveLength(2))
    const row = () => ui.store.getQueueItems(EDIT)[0]
    const answer = async (read: 'older' | 'newer', asset: ReturnType<typeof assetDetail>) => {
      answers[read === 'older' ? 0 : 1](asset)
      await vi.advanceTimersByTimeAsync(0)
      await eventually(() => expect(row().status).toBe('uploaded'))
    }
    const held = () => ({
      row: [row().keywords, row().customData],
      baseline: [ui.baseline(row())?.keywords, ui.baseline(row())?.customData],
    })

    return { ...ui, row, answer, held, save: () => ui.save(EDIT) }
  }

  it('takes the newer answer when the older one came first and nobody changed the row', async () => {
    const { answer, held, save } = await twiceRead()

    await answer('older', answered('keyword-older', 'older'))
    expect(held().row).toEqual([['keyword-older'], customData('older')])
    await answer('newer', answered('keyword-newer', 'newer'))

    expect(held()).toEqual({
      row: [['keyword-newer'], customData('newer')],
      baseline: [['keyword-newer'], customData('newer')],
    })
    await save()
    expect(server.sent('PATCH')).toEqual([])
  })

  it('keeps the newer answer when the older one comes after it', async () => {
    const { answer, held, save } = await twiceRead()

    await answer('newer', answered('keyword-newer', 'newer'))
    await answer('older', answered('keyword-older', 'older'))

    expect(held()).toEqual({
      row: [['keyword-newer'], customData('newer')],
      baseline: [['keyword-newer'], customData('newer')],
    })
    await save()
    expect(server.sent('PATCH')).toEqual([])
  })

  it('keeps what was typed into it after the older answer, and sends that', async () => {
    const { row, answer, held, save } = await twiceRead()

    await answer('older', answered('keyword-older', 'older'))
    row().keywords = ['keyword-typed']
    await answer('newer', answered('keyword-newer', 'newer'))

    expect(held()).toEqual({
      row: [['keyword-typed'], customData('older')],
      baseline: [['keyword-older'], customData('older')],
    })
    await save()
    expect(saved()).toEqual([[{ id: 'asset-1', described: true, keywords: ['keyword-typed'] }]])
  })

  /*
   * Typed and saved between the two answers, the row holds what the server has again.
   * A "nobody changed it" check would accept the newer read, which was sent before the save.
   */
  it('keeps what was saved between the two answers, and the next save sends only what is typed after it', async () => {
    const { row, answer, held, save } = await twiceRead()
    await answer('older', answered('keyword-older', 'older'))
    row().customData = { ...row().customData, title: 'typed' }
    await save()

    await answer('newer', answered('keyword-newer', 'newer'))

    expect(held()).toEqual({
      row: [['keyword-older'], customData('typed')],
      baseline: [['keyword-older'], customData('typed')],
    })
    row().customData = { ...row().customData, note: 'typed later' }
    await save()
    expect(saved()).toEqual([
      [{ id: 'asset-1', described: true, customData: customData('typed') }],
      [{ id: 'asset-1', described: true, customData: { title: 'typed', note: 'typed later' } }],
    ])
  })

  it('keeps what the detail or the panel saved of the asset between the two answers', async () => {
    const { store, answer, held, save } = await twiceRead()
    await answer('older', answered('keyword-older', 'older'))
    store.updateAssetMetadata(answered('keyword-of-the-detail', 'of the detail') as never)

    await answer('newer', answered('keyword-newer', 'newer'))

    expect(held()).toEqual({
      row: [['keyword-of-the-detail'], customData('of the detail')],
      baseline: [['keyword-of-the-detail'], customData('of the detail')],
    })
    await save()
    expect(server.sent('PATCH')).toEqual([])
  })

  /*
   * The save of an unchanged row sends only that its asset is now described.
   * The newer read answers while it is on the wire and the row takes it.
   * The save answer must not restore what the row held at the click.
   */
  it('keeps the newer answer a row took while its save was on the wire, and the next save sends nothing', async () => {
    const { answer, held, save } = await twiceRead()
    await answer('older', answered('keyword-older', 'older', notDescribed))
    let answerSave = () => undefined as void
    server.on(
      'PATCH',
      BULK,
      () => new Promise<FakeDamAnswer>((resolve) => (answerSave = () => resolve({ status: 200, data: [] })))
    )

    const saving = save()
    await eventually(() => expect(saved()).toHaveLength(1))
    await answer('newer', answered('keyword-newer', 'newer', notDescribed))
    answerSave()
    await saving

    expect(held()).toEqual({
      row: [['keyword-newer'], customData('newer')],
      baseline: [['keyword-newer'], customData('newer')],
    })
    await save()
    expect(saved()).toEqual([[{ id: 'asset-1', described: true }]])
  })
})

describe('a mass-edit row saved from the detail while its bulk save is on the wire', () => {
  // The bulk save answer writes what it sent, not the whole row as it was at the click.
  it('does not send with the next bulk save what the detail saved and nobody changed since', async () => {
    const { store, rows, save, baseline } = await pickedForMassEdit([onServer('asset-1')])
    rows[0].keywords = ['keyword-typed']
    let answerSave = () => undefined as void
    server.on(
      'PATCH',
      BULK,
      () => new Promise<FakeDamAnswer>((resolve) => (answerSave = () => resolve({ status: 200, data: [] })))
    )
    const ofTheDetail = { title: 'of the detail', note: 'kept' }

    const saving = save()
    await eventually(() => expect(saved()).toHaveLength(1))
    store.updateAssetMetadata(
      onServer('asset-1', {
        keywords: ['keyword-typed'],
        metadata: { customData: ofTheDetail, authorSuggestions: {}, keywordSuggestions: {} },
      }) as never
    )
    answerSave()
    await saving

    expect([rows[0].customData, baseline(rows[0])?.customData, baseline(rows[0])?.keywords]).toEqual([
      ofTheDetail,
      ofTheDetail,
      ['keyword-typed'],
    ])
    await save()
    expect(saved()).toEqual([[{ id: 'asset-1', described: true, keywords: ['keyword-typed'] }]])
  })
})

/*
 * The asset open in the side panel can be part of a shift-click range,
 * so its mass-edit row may still be loading when the panel saves.
 * The save writes into that row, and the picking read may answer with the asset from before the save.
 */
describe('an asset saved from the panel of the list while its mass-edit row is still loading', () => {
  const opened = async () => {
    // Made anew for each answer, because the detail writes into the asset it is given.
    const before = () => [onServer('asset-1'), onServer('asset-2')]
    before().forEach((asset) => server.asset(asset))
    let answerRead = () => undefined as void
    server.on(
      'GET',
      BATCH_READ,
      () =>
        new Promise<FakeDamAnswer>((resolve) => {
          answerRead = () => resolve({ status: 200, data: { data: before() } })
        })
    )
    let answerSave: (() => void) | undefined = undefined
    const held = { save: false }
    server.on('PATCH', BULK, () => {
      if (!held.save) return { status: 200, data: [] }

      return new Promise<FakeDamAnswer>((resolve) => (answerSave = () => resolve({ status: 200, data: [] })))
    })
    const ui = await start({}, { customForm: { image: [customField('title'), customField('note')] } })
    const { useAssetListStore } = await import('@/domains/coreDam/asset/store/assetListStore')
    useAssetListStore().setList(before() as never, [])
    const tiles = await ui.mount(
      () => import('@/domains/coreDam/asset/components/list/components/AssetListTilesView.vue')
    )
    const Panel = (await import('@/domains/coreDam/asset/components/list/components/AssetListSidebarMetadata.vue'))
      .default
    const panel = await ui.mount(async () => ({
      default: defineComponent({ setup: () => () => h(VLayout, null, () => h(Panel)) }),
    }))
    const tile = (index: number) => tiles.querySelectorAll<HTMLElement>('.dam-image-grid__item')[index]
    tile(0).click()
    await eventually(() => expect(panel.querySelector('textarea')).not.toBeNull())
    const title = panel.querySelector<HTMLTextAreaElement>('textarea')!
    title.value = 'typed in the panel'
    title.dispatchEvent(new Event('input'))
    await nextTick()
    const row = () => ui.store.getQueueItems(EDIT)[0]

    return {
      ...ui,
      row,
      pickBoth: async () => {
        tile(1).dispatchEvent(new MouseEvent('click', { bubbles: true, shiftKey: true }))
        await eventually(() => expect(server.sent('GET', BATCH_READ)).toHaveLength(1))
      },
      holdSave: () => (held.save = true),
      startSave: async () => {
        buttonsNamed(panel, 'Save')[0].click()
        await eventually(() => expect(saved()).toHaveLength(1))
      },
      saveAnswered: async () => {
        answerSave?.()
        await eventually(() => expect(ui.alerts()).toEqual(['Record was updated']))
      },
      readAnswered: async () => {
        answerRead()
        await vi.advanceTimersByTimeAsync(0)
        await eventually(() => expect(row().status).toBe('uploaded'))
      },
    }
  }
  const savedInThePanel = { title: 'typed in the panel', note: 'kept' }

  it.each<[string, Array<'pickBoth' | 'startSave'>]>([
    ['was sent before the save started', ['pickBoth', 'startSave']],
    // The read may still be answered from before the save. The save counts from where it is answered.
    ['was sent while the save was on the wire', ['startSave', 'pickBoth']],
  ])('keeps in the row what the panel saved when the read of the picking %s', async (_when, steps) => {
    const ui = await opened()
    ui.holdSave()
    for (const step of steps) await ui[step]()
    expect([ui.row().status, ui.row().canEditMetadata]).toEqual(['loading', false])

    await ui.saveAnswered()
    await ui.readAnswered()

    expect([ui.row().canEditMetadata, ui.row().customData, ui.baseline(ui.row())?.customData]).toEqual([
      true,
      savedInThePanel,
      savedInThePanel,
    ])
    expect(ui.store.getQueueItems(EDIT)[1].customData).toEqual({ title: 'from the server', note: 'kept' })
    await ui.save(EDIT)
    expect(saved()).toHaveLength(1)
  })
})

describe('a mass-edit row that gets its form from the notification while its read is on its way', () => {
  const notifiedBeforeItsRead = async () => {
    let answerRead: (asset: ReturnType<typeof assetDetail>) => void = () => undefined
    server.on(
      'GET',
      BATCH_READ,
      () =>
        new Promise<FakeDamAnswer>((resolve) => {
          answerRead = (asset) => resolve({ status: 200, data: { data: [asset] } })
        })
    )
    server.asset(onServer('asset-1', { keywords: ['keyword-notified'] }))
    const ui = await start()
    await ui.store.addByAssets(EDIT, [listed('asset-1')] as never)
    const notified = ui.store.queueItemMetadataProcessed('asset-1')
    await vi.advanceTimersByTimeAsync(5000)
    await notified
    const row = () => ui.store.getQueueItems(EDIT)[0]
    expect([row().canEditMetadata, row().keywords]).toEqual([true, ['keyword-notified']])

    return {
      ...ui,
      row,
      answerRead: async () => {
        answerRead(onServer('asset-1', { keywords: ['keyword-of-the-read'] }))
        await vi.advanceTimersByTimeAsync(0)
        await eventually(() => expect(row().status).toBe('uploaded'))
      },
      held: () => [row().keywords, ui.baseline(row())?.keywords],
      save: () => ui.save(EDIT),
    }
  }

  // The picking read was sent before the notification's read, so its answer is older, changed row or not.
  it('keeps what the notification read when the read of its picking answers after it', async () => {
    const { answerRead, held, save } = await notifiedBeforeItsRead()

    await answerRead()

    expect(held()).toEqual([['keyword-notified'], ['keyword-notified']])
    await save()
    expect(server.sent('PATCH')).toEqual([])
  })

  it('keeps what was typed and saved after the notification when the read of its picking answers after the save', async () => {
    const { row, answerRead, held, save } = await notifiedBeforeItsRead()
    row().keywords = ['keyword-typed']
    await save()

    await answerRead()

    expect(held()).toEqual([['keyword-typed'], ['keyword-typed']])
    row().authors = ['author-typed']
    await save()
    expect(saved()).toEqual([
      [{ id: 'asset-1', described: true, keywords: ['keyword-typed'] }],
      [{ id: 'asset-1', described: true, authors: ['author-typed'] }],
    ])
  })
})

describe('one asset in a row of the upload queue and in a row of the mass edit', () => {
  it('is changed by a mass operation only in the queue the operation was made in', async () => {
    const { store, save } = await start({
      [UPLOADS]: [queueRow({ status: 'uploaded', canEditMetadata: true })],
      [EDIT]: [queueRow({ type: 'asset', status: 'uploaded', canEditMetadata: true })],
    })
    store.updateAssetMetadata(onServer('asset-1') as never)

    store.queueItemsReplaceEmptyCustomDataValue(
      EDIT,
      { assetType: 'image', elementProperty: 'title', value: 'replaced' },
      true
    )
    await save(UPLOADS)
    await save(EDIT)

    expect(store.getQueueItems(UPLOADS)[0].customData).toEqual({ title: 'from the server', note: 'kept' })
    expect(saved()).toEqual([[{ id: 'asset-1', described: true, customData: { title: 'replaced', note: 'kept' } }]])
  })
})
