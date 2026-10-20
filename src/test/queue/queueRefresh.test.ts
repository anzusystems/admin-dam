import { AssetFileFailReason } from '@anzusystems/common-admin'
import type { UploadQueueItem } from '@anzusystems/common-admin'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick } from 'vue'
import type { App } from 'vue'
import { createI18n } from 'vue-i18n'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'

import en from '@/locales/en'
import sk from '@/locales/sk'
import {
  assetDetail,
  assetFile,
  createFakeDam,
  httpError,
  queueRow,
  seedDamConfig,
  seedQueue,
  stubFileReader,
} from '@/test/support/fakeDam'
import type { FakeDam } from '@/test/support/fakeDam'

/* The refresh button of a queue row: the one way out the user has for a row nothing else settles. The list is
 * mounted over the real store, the row itself is a stand-in with only the button, and the server is a fake. */

let server: FakeDam
const showWarningT = vi.fn()

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))
vi.mock('@anzusystems/common-admin', async (importOriginal) => ({
  ...((await importOriginal()) as Record<string, unknown>),
  useAlerts: () => ({ showWarningT, showError: vi.fn() }),
}))
vi.mock('@/domains/coreDam/asset/composables/currentExtSystem', () => ({
  useCurrentAssetLicence: () => ({ currentAssetLicenceId: { value: 1 } }),
  useCurrentExtSystem: () => ({ currentExtSystemId: { value: 1 } }),
}))
vi.mock('@/domains/coreDam/asset/composables/externalProviders', () => ({
  useExternalProviders: () => ({ activeExternalProvider: { value: null } }),
}))
vi.mock('@/domains/coreDam/author/composables/cachedAuthors', () => ({
  useCachedAuthors: () => ({ addToCachedAuthors: vi.fn(), fetchCachedAuthors: vi.fn() }),
}))
vi.mock('@/domains/coreDam/keyword/composables/cachedKeywords', () => ({
  useCachedKeywords: () => ({ addToCachedKeywords: vi.fn(), fetchCachedKeywords: vi.fn() }),
}))
// What the row is to the list here: the button that asks for a refresh, disabled while the list says so.
vi.mock('@/domains/coreDam/asset/components/queue/AssetQueueItemEditable.vue', async () => {
  const { defineComponent, h } = await import('vue')

  return {
    default: defineComponent({
      inheritAttrs: false,
      props: {
        item: { type: Object, required: true },
        index: { type: Number, required: true },
        refreshDisabled: { type: Boolean, required: true },
      },
      emits: ['refreshItem'],
      setup(props, { emit }) {
        return () =>
          h('button', {
            'data-refresh': props.item.key,
            disabled: props.refreshDisabled,
            onClick: () => emit('refreshItem', { index: props.index, assetId: props.item.assetId, item: props.item }),
          })
      },
    }),
  }
})
vi.mock('@/domains/coreDam/asset/components/queue/AssetQueueSelectedSidebar.vue', () => ({
  default: { render: () => null },
}))

const AssetQueueEditable = (await import('@/domains/coreDam/asset/components/queue/AssetQueueEditable.vue')).default
const { useUploadQueuesStore } = await import('@/domains/coreDam/asset/store/uploadQueuesStore')
const { useDamConfigStore } = await import('@anzusystems/common-admin')

const QUEUE = 'global'
const REFRESH_FAILED = 'common.damImage.queueItem.refreshFailed'
const ASSET_GONE = 'common.damImage.queueItem.assetGone'

let app: App | undefined

/** Mounts the list over a queue holding the rows and answers the rows and the refresh button of each. */
const mountQueue = async (rows: UploadQueueItem[], otherQueues: Record<string, UploadQueueItem[]> = {}) => {
  const pinia = createPinia()
  setActivePinia(pinia)
  const store = useUploadQueuesStore()
  const seeded = seedQueue(store, QUEUE, rows)
  const others = Object.entries(otherQueues).map(([queueId, items]) => seedQueue(store, queueId, items))
  const root = document.createElement('div')
  document.body.appendChild(root)
  app = createApp(AssetQueueEditable, { queueId: QUEUE, massOperations: false })
  app.use(pinia)
  app.use(createVuetify({ components }))
  app.mount(root)
  await nextTick()
  const button = (row: UploadQueueItem) => {
    const found = root.querySelector<HTMLButtonElement>(`button[data-refresh="${row.key}"]`)
    if (!found) throw new Error('the row has no refresh button')

    return found
  }

  return { store, rows: seeded, others, button }
}

/** Presses the button and waits until the list lets it be pressed again. */
const refresh = async (button: HTMLButtonElement) => {
  button.click()
  await nextTick()
  await vi.waitFor(() => expect(button.disabled).toBe(false))
}

beforeEach(() => {
  vi.clearAllMocks()
  server = createFakeDam()
})

afterEach(() => {
  app?.unmount()
  app = undefined
  document.body.innerHTML = ''
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('the refresh of a row whose asset has its file', () => {
  it('settles the row and gives it its metadata and its form', async () => {
    const { store, rows, button } = await mountQueue([queueRow({ status: 'processing' })])
    server.asset(assetDetail('asset-1', { mainFileSingleUse: true }))

    await refresh(button(rows[0]))

    expect(server.assetReads('asset-1')).toBeGreaterThan(0)
    expect(rows[0].status).toBe('uploaded')
    expect(rows[0].assetStatus).toBe('with_file')
    expect(rows[0].imagePreview).toEqual({ url: 'https://dam.test/file-1/detail.jpg', width: 800, height: 450 })
    expect(rows[0].canEditMetadata).toBe(true)
    expect(rows[0].keywords).toEqual(['keyword-server'])
    expect(rows[0].authors).toEqual(['author-server'])
    expect(rows[0].customData).toEqual({ title: 'from the server' })
    expect(rows[0].mainFileSingleUse).toBe(true)
    expect(rows[0].error).toEqual({ hasError: false, message: '', assetFileFailReason: 'none' })
    expect([store.getQueueProcessedCount(QUEUE), store.getQueueTotalCount(QUEUE)]).toEqual([1, 1])
    expect(showWarningT).not.toHaveBeenCalled()
  })

  it('leaves what the user typed into a row that already has its metadata', async () => {
    const { rows, button } = await mountQueue([
      queueRow({
        status: 'processing',
        canEditMetadata: true,
        keywords: ['typed'],
        customData: { title: 'typed' },
        mainFileSingleUse: true,
      }),
    ])
    server.asset(assetDetail('asset-1', { mainFileSingleUse: false }))

    await refresh(button(rows[0]))

    expect(rows[0].status).toBe('uploaded')
    expect(rows[0].canEditMetadata).toBe(true)
    expect(rows[0].keywords).toEqual(['typed'])
    expect(rows[0].customData).toEqual({ title: 'typed' })
    // The switch is a field of the form too.
    expect(rows[0].mainFileSingleUse).toBe(true)
  })

  it('takes back the text the poll left on a row it had given up on', async () => {
    const { rows, button } = await mountQueue([
      queueRow({
        status: 'processing',
        error: { hasError: true, message: 'system.uploadErrors.processingTooLong', assetFileFailReason: 'none' },
      }),
    ])
    server.asset(assetDetail('asset-1'))

    await refresh(button(rows[0]))

    // The text told the user to press the button, and they did.
    expect(rows[0].status).toBe('uploaded')
    expect(rows[0].error).toEqual({ hasError: false, message: '', assetFileFailReason: 'none' })
    expect(rows[0].canEditMetadata).toBe(true)
  })

  it('gives an uploaded row the metadata it is still missing', async () => {
    const { rows, button } = await mountQueue([queueRow({ status: 'uploaded', assetStatus: 'with_file' })])
    server.asset(assetDetail('asset-1'))

    await refresh(button(rows[0]))

    expect(rows[0].status).toBe('uploaded')
    expect(rows[0].canEditMetadata).toBe(true)
    expect(rows[0].customData).toEqual({ title: 'from the server' })
  })

  it('settles every row of the asset the button can reach, and no slot upload of it', async () => {
    const { rows, others, button } = await mountQueue([queueRow({ status: 'processing' })], {
      edit: [queueRow({ type: 'asset', status: 'uploaded', canEditMetadata: true, keywords: ['typed'] })],
      slots: [queueRow({ type: 'slotFile', status: 'processing', fileId: 'file-2', slotName: 'extra' })],
    })
    server.asset(assetDetail('asset-1'))

    await refresh(button(rows[0]))

    expect(rows[0].status).toBe('uploaded')
    // The row of the same asset picked for mass edit is brought up to date, and keeps what was typed.
    expect([others[0][0].assetStatus, others[0][0].keywords]).toEqual(['with_file', ['typed']])
    // The asset says nothing about which of its slots finished.
    expect(others[1][0].status).toBe('processing')
  })

  // The state of the file decides, not the state of the asset: this asset says it has its file, and the file is a
  // duplicate.
  it('settles the row as a duplicate when the asset has its file and that file is a duplicate', async () => {
    const { rows, button } = await mountQueue([queueRow({ status: 'processing' })])
    server.asset(
      assetDetail('asset-1', {
        mainFile: assetFile('file-1', 'duplicate', { asset: 'asset-1', originAssetFile: 'file-origin' }),
      })
    )
    server.file('image', assetFile('file-origin', 'processed', { asset: 'asset-original' }))

    await refresh(button(rows[0]))

    expect([rows[0].status, rows[0].isDuplicate, rows[0].canEditMetadata]).toEqual(['uploaded', true, false])
    expect(rows[0].duplicateAssetId).toBe('asset-original')
    expect(rows[0].keywords).toEqual([])
    expect(server.sent('GET', /\/file-origin$/).map((request) => request.url)).toEqual(['/adm/v1/image/file-origin'])
    expect(showWarningT).not.toHaveBeenCalled()
  })
})

describe('the refresh of a row whose asset has no file yet', () => {
  const draft = (mainFile: unknown, assetType = 'image') =>
    assetDetail('asset-1', { attributes: { assetType, assetStatus: 'draft' }, mainFile })

  it('settles a duplicate read-only and links it to the original, read by the type of the asset', async () => {
    const { rows, button } = await mountQueue([queueRow({ status: 'processing', assetType: 'audio' })])
    server.asset(draft(assetFile('file-1', 'duplicate', { asset: 'asset-1', originAssetFile: 'file-origin' }), 'audio'))
    server.file('audio', assetFile('file-origin', 'processed', { asset: 'asset-original' }))

    await refresh(button(rows[0]))

    expect([rows[0].status, rows[0].isDuplicate, rows[0].canEditMetadata]).toEqual(['uploaded', true, false])
    expect(server.sent('GET', /\/file-origin$/).map((request) => request.url)).toEqual(['/adm/v1/audio/file-origin'])
    expect([rows[0].duplicateAssetId, rows[0].fileId]).toEqual(['asset-original', 'file-origin'])
    expect(rows[0].keywords).toEqual([])
    expect(showWarningT).not.toHaveBeenCalled()
  })

  it('fails the row with the reason the server gives', async () => {
    const { store, rows, button } = await mountQueue([queueRow({ status: 'processing', canEditMetadata: true })])
    const failed = assetFile('file-1', 'failed', { asset: 'asset-1' })
    failed.fileAttributes.failReason = 'invalid_checksum'
    server.asset(draft(failed))

    await refresh(button(rows[0]))

    expect(rows[0].status).toBe('failed')
    expect(rows[0].error).toEqual({ hasError: true, message: '', assetFileFailReason: 'invalid_checksum' })
    // A failed row has no form, whatever it had before.
    expect(rows[0].canEditMetadata).toBe(false)
    expect([store.getQueueProcessedCount(QUEUE), store.getQueueTotalCount(QUEUE)]).toEqual([1, 1])
    expect(showWarningT).not.toHaveBeenCalled()
  })

  const unfinished: Array<[string, unknown]> = [
    ['a file still uploading', assetFile('file-1', 'uploading')],
    ['a file stored', assetFile('file-1', 'stored')],
    ['no main file', null],
  ]

  it.each(unfinished)('says the file is still on its way and leaves the row as it is: %s', async (_name, mainFile) => {
    const { rows, button } = await mountQueue([queueRow({ status: 'processing' })])
    server.asset(draft(mainFile))

    await refresh(button(rows[0]))

    expect(showWarningT).toHaveBeenCalledTimes(1)
    expect(showWarningT).toHaveBeenCalledWith('common.damImage.queueItem.stillUploadingOrProcessing')
    expect(rows[0].status).toBe('processing')
    expect(rows[0].error.hasError).toBe(false)
    expect(rows[0].canEditMetadata).toBe(false)
  })
})

describe('the refresh of one of two rows of an asset', () => {
  // It asks about the file of the row it was pressed on: a row of the same asset that holds another file hears
  // nothing of it, whatever the asset says about its main file.
  it('settles the row that holds the main file, and leaves alone the row of another file', async () => {
    const { rows, button } = await mountQueue([
      queueRow({ status: 'processing' }),
      queueRow({ status: 'processing', fileId: 'file-2' }),
    ])
    server.asset(assetDetail('asset-1'))

    await refresh(button(rows[0]))

    expect(server.assetReads('asset-1')).toBe(1)
    expect([rows[0].status, rows[0].canEditMetadata]).toEqual(['uploaded', true])
    expect([rows[1].status, rows[1].canEditMetadata, rows[1].assetStatus]).toEqual(['processing', false, 'draft'])
    expect(showWarningT).not.toHaveBeenCalled()
  })

  // The asset speaks of its main file alone, so about another file it has nothing to tell the row.
  it('changes neither row when pressed on the one whose file is not the main file', async () => {
    const { rows, button } = await mountQueue([
      queueRow({ status: 'processing' }),
      queueRow({ status: 'processing', fileId: 'file-2' }),
    ])
    server.asset(assetDetail('asset-1'))

    await refresh(button(rows[1]))

    expect(server.assetReads('asset-1')).toBe(1)
    expect(rows.map((row) => [row.status, row.canEditMetadata])).toEqual([
      ['processing', false],
      ['processing', false],
    ])
    expect(showWarningT).not.toHaveBeenCalled()
  })
})

describe('the refresh pressed while the list moves under it', () => {
  // A row before them has just left the queue, and the rows drawn still carry the positions they had: the one
  // pressed is told by itself. By its position it was the row after it, by its asset the first row of that asset.
  const pressed: Array<[string, number, string]> = [
    ['the first', 1, 'file-1'],
    ['the second', 2, 'file-2'],
  ]

  it.each(pressed)(
    'asks about the file of the row that was pressed, of two rows of one asset: %s',
    async (_name, at, fileId) => {
      const { store, rows, button } = await mountQueue([
        queueRow({ status: 'uploaded', assetId: 'asset-0', fileId: 'file-0' }),
        queueRow({ status: 'processing', fileId: 'file-1' }),
        queueRow({ status: 'processing', fileId: 'file-2' }),
      ])
      server.asset(assetDetail('asset-1', { mainFile: assetFile(fileId, 'processed', { asset: 'asset-1' }) }))
      const drawn = button(rows[at])

      void store.removeByAssetId(QUEUE, 'asset-0')
      expect(store.getQueueItems(QUEUE)).toHaveLength(2)
      await refresh(drawn)

      expect(server.assetReads('asset-1')).toBe(1)
      expect(rows.slice(1).map((row) => row.status)).toEqual(
        rows.slice(1).map((row) => (row === rows[at] ? 'uploaded' : 'processing'))
      )
      expect(showWarningT).not.toHaveBeenCalled()
    }
  )

  it('asks nothing about a row that has left the queue by the time it is pressed', async () => {
    const { store, rows, button } = await mountQueue([
      queueRow({ status: 'processing', fileId: 'file-1' }),
      queueRow({ status: 'processing', fileId: 'file-2' }),
    ])
    const drawn = button(rows[0])

    store.queues[QUEUE].items.splice(0, 1)
    drawn.click()
    await nextTick()

    expect(server.requests).toEqual([])
    expect(showWarningT).not.toHaveBeenCalled()
    expect(button(rows[1]).disabled).toBe(false)
  })

  /* Taken out while its read is on the wire - the trash comes on with its form, which a metadata read queued before
   * the refresh can bring. The row keeps its state when it leaves, so nothing about it has ended; but it is no longer
   * there, and a word about a refresh it no longer offers would be about nothing. */
  it.each(['uploaded', 'failed'] as const)(
    'says nothing of a read that failed for a row taken out of the queue while it was asked about: %s',
    async (status) => {
      const { store, rows, button } = await mountQueue([
        queueRow({ status, assetStatus: 'with_file' }),
        // Its button is the list's: enabled again once the refresh has ended.
        queueRow({ status: 'processing', assetId: 'asset-2', fileId: 'file-2' }),
      ])
      let failRead: () => void = () => undefined
      server.assetBy('asset-1', () => new Promise((_resolve, reject) => (failRead = () => reject(httpError(500)))))

      button(rows[0]).click()
      await vi.waitFor(() => expect(server.assetReads('asset-1')).toBe(1))
      await store.removeByAssetId(QUEUE, 'asset-1')
      expect(store.getQueueItems(QUEUE)).toEqual([rows[1]])
      failRead()
      await vi.waitFor(() => expect(button(rows[1]).disabled).toBe(false))

      expect(showWarningT).not.toHaveBeenCalled()
    }
  )
})

describe('the refresh button of the queue', () => {
  it('cannot be pressed on any row while one refresh runs, and can again once it has answered', async () => {
    const { rows, button } = await mountQueue([
      queueRow({ status: 'processing' }),
      queueRow({ status: 'processing', assetId: 'asset-2', fileId: 'file-2' }),
    ])
    let answer: (asset: unknown) => void = () => undefined
    server.assetBy('asset-1', () => new Promise((resolve) => (answer = resolve)))

    button(rows[0]).click()
    await nextTick()

    // One flag for the whole list.
    expect([button(rows[0]).disabled, button(rows[1]).disabled]).toEqual([true, true])
    expect(rows[0].status).toBe('processing')

    server.asset(assetDetail('asset-1'))
    answer(assetDetail('asset-1'))
    await vi.waitFor(() => expect(button(rows[0]).disabled).toBe(false))

    expect(button(rows[1]).disabled).toBe(false)
    expect(rows[0].status).toBe('uploaded')
    expect(rows[1].status).toBe('processing')
  })

  it('can be pressed again after a read that failed, which changes nothing in the row and says so', async () => {
    const { rows, button } = await mountQueue([queueRow({ status: 'processing' })])
    server.assetBy('asset-1', () => {
      throw new Error('the asset service is down')
    })

    await refresh(button(rows[0]))

    expect(server.assetReads('asset-1')).toBe(1)
    expect(rows[0].status).toBe('processing')
    expect(rows[0].error.hasError).toBe(false)
    expect(showWarningT.mock.calls).toEqual([[REFRESH_FAILED]])

    server.asset(assetDetail('asset-1'))
    await refresh(button(rows[0]))

    expect(rows[0].status).toBe('uploaded')
    expect(rows[0].canEditMetadata).toBe(true)
    // Nothing more is said once the read has answered.
    expect(showWarningT).toHaveBeenCalledTimes(1)
  })
})

describe('the refresh of a row whose file is still being sent', () => {
  // Offered after twenty seconds of sending. The row moves on meanwhile, and that is no answer to what was asked.
  it('says that it could not find out when its read fails, though the file went over to processing meanwhile', async () => {
    vi.useFakeTimers()
    stubFileReader()
    const { store, rows, button } = await mountQueue([
      queueRow({
        status: 'waiting',
        assetId: null,
        fileId: null,
        file: new File(['abc'], 'photo.jpg', { type: 'image/jpeg' }),
      }),
    ])
    seedDamConfig(useDamConfigStore())
    let answerChunk: () => void = () => undefined
    server.on('POST', /\/chunk$/, async () => {
      await new Promise<void>((resolve) => (answerChunk = resolve))

      return { status: 201, data: {} }
    })
    let failRead: () => void = () => undefined
    server.assetBy('asset-1', () => new Promise((_resolve, reject) => (failRead = () => reject(httpError(500)))))
    store.processUpload(QUEUE)
    await vi.advanceTimersByTimeAsync(0)
    expect(rows[0].status).toBe('uploading')

    button(rows[0]).click()
    await vi.advanceTimersByTimeAsync(0)
    expect(server.assetReads('asset-1')).toBe(1)
    // The chunk and the finish request are answered while the read waits.
    answerChunk()
    await vi.advanceTimersByTimeAsync(0)
    expect(rows[0].status).toBe('processing')
    failRead()
    await vi.waitFor(() => expect(button(rows[0]).disabled).toBe(false))

    expect([rows[0].status, rows[0].error.hasError]).toEqual(['processing', false])
    expect(showWarningT.mock.calls).toEqual([[REFRESH_FAILED]])
  })
})

describe('the refresh of a row whose state cannot be read', () => {
  // The asset is not there: said as such, not as a read that failed and could be tried again.
  it('says the asset no longer exists when the server answers the read with 404, and leaves the row as it is', async () => {
    const { rows, button } = await mountQueue([queueRow({ status: 'processing' })])
    server.assetBy('asset-1', () => {
      throw httpError(404)
    })

    await refresh(button(rows[0]))

    expect(showWarningT.mock.calls).toEqual([[ASSET_GONE]])
    expect([rows[0].status, rows[0].error.hasError, rows[0].canEditMetadata]).toEqual(['processing', false, false])
  })

  it.each([500, 503])(
    'says so when the server answers the read with %s, and leaves the row as it is',
    async (status) => {
      const { rows, button } = await mountQueue([queueRow({ status: 'processing' })])
      server.assetBy('asset-1', () => {
        throw httpError(status)
      })

      await refresh(button(rows[0]))

      expect(showWarningT.mock.calls).toEqual([[REFRESH_FAILED]])
      expect([rows[0].status, rows[0].error.hasError, rows[0].canEditMetadata]).toEqual(['processing', false, false])
    }
  )

  // Picked at an external provider and not imported: there is no asset to ask about.
  it('says so for a row that has no asset, without asking the server', async () => {
    const { rows, button } = await mountQueue([
      queueRow({ type: 'externalProviderAsset', status: 'uploaded', assetId: null, fileId: null }),
    ])

    await refresh(button(rows[0]))

    expect(showWarningT.mock.calls).toEqual([[REFRESH_FAILED]])
    expect(server.requests).toEqual([])
  })

  // The text is the library's, beside the one for a file still on its way: the application has it with its messages.
  it('has its text in both languages of the application', () => {
    // Typed by hand: the messages of the whole application are more than the compiler follows through vue-i18n.
    const texts = createI18n({ legacy: false, locale: 'en', messages: { en, sk } } as never) as unknown as {
      global: { t: (key: string, named: object, options: { locale: string }) => string }
    }

    expect(texts.global.t(REFRESH_FAILED, {}, { locale: 'en' })).toBe(
      "The item's state could not be loaded. Try again."
    )
    expect(texts.global.t(REFRESH_FAILED, {}, { locale: 'sk' })).toBe(
      'Stav položky sa nepodarilo načítať. Skúste to znova.'
    )
  })
})

describe('the refresh of a row that has come to its end by the time it answers', () => {
  // A row the queue asks about: an asset not found counts against it, whoever asked, and the third time fails it.
  // The library answers that read as settled, so nothing is said for that alone.
  it('does not tell the user to try again when its own read was the one to fail the row', async () => {
    vi.useFakeTimers()
    stubFileReader()
    const { store, rows, button } = await mountQueue([
      queueRow({
        status: 'waiting',
        assetId: null,
        fileId: null,
        file: new File(['abc'], 'photo.jpg', { type: 'image/jpeg' }),
      }),
    ])
    seedDamConfig(useDamConfigStore())
    store.processUpload(QUEUE)
    await vi.advanceTimersByTimeAsync(0)
    expect([rows[0].status, rows[0].assetId]).toEqual(['processing', 'asset-1'])
    server.assetDeleted('asset-1')
    // The poll of the queue finds no asset after five seconds, and after ten.
    await vi.advanceTimersByTimeAsync(10_000)
    expect([server.assetReads('asset-1'), rows[0].status]).toEqual([2, 'processing'])

    await refresh(button(rows[0]))

    expect(server.assetReads('asset-1')).toBe(3)
    expect([rows[0].status, rows[0].error.hasError]).toEqual(['failed', true])
    expect(showWarningT).not.toHaveBeenCalled()
  })

  // The read failed, which by itself is a reason to try again - but not for a row the server has failed meanwhile.
  it('does not tell the user to try again when a notification failed the row while its read was failing', async () => {
    const { store, rows, button } = await mountQueue([queueRow({ status: 'processing' })])
    let failRead: () => void = () => undefined
    server.assetBy('asset-1', () => new Promise((_resolve, reject) => (failRead = () => reject(httpError(500)))))

    button(rows[0]).click()
    await vi.waitFor(() => expect(server.assetReads('asset-1')).toBe(1))
    store.queueItemFailed('asset-1', AssetFileFailReason.Unknown, 'file-1')
    expect(rows[0].status).toBe('failed')
    failRead()
    await vi.waitFor(() => expect(button(rows[0]).disabled).toBe(false))

    expect(rows[0].status).toBe('failed')
    expect(showWarningT).not.toHaveBeenCalled()
  })

  const otherEndings: Array<
    [string, (store: ReturnType<typeof useUploadQueuesStore>, row: UploadQueueItem) => unknown, string]
  > = [
    [
      'a notification marked the row a duplicate',
      (store) => store.queueItemDuplicate('asset-1', null, null, 'file-1'),
      'uploaded',
    ],
    ['the user stopped the row', (store, row) => store.stopItemUpload(QUEUE, row), 'stop'],
  ]

  it.each(otherEndings)(
    'does not tell the user to try again when %s while its read was failing',
    async (_name, end, status) => {
      const { store, rows, button } = await mountQueue([
        queueRow({ status: 'processing' }),
        queueRow({ status: 'processing', assetId: 'asset-2', fileId: 'file-2' }),
      ])
      // The one flag of the list: the button of the other row tells when the refresh is over, whatever became of the first.
      const other = button(rows[1])
      let failRead: () => void = () => undefined
      server.assetBy('asset-1', () => new Promise((_resolve, reject) => (failRead = () => reject(httpError(500)))))

      button(rows[0]).click()
      await vi.waitFor(() => expect(server.assetReads('asset-1')).toBe(1))
      await end(store, rows[0])
      expect([rows[0].status, other.disabled]).toEqual([status, true])
      failRead()
      await vi.waitFor(() => expect(other.disabled).toBe(false))

      expect(showWarningT).not.toHaveBeenCalled()
    }
  )

  it('says the asset is gone after the first read of such a row to find it so, which leaves the row as it is', async () => {
    vi.useFakeTimers()
    stubFileReader()
    const { store, rows, button } = await mountQueue([
      queueRow({
        status: 'waiting',
        assetId: null,
        fileId: null,
        file: new File(['abc'], 'photo.jpg', { type: 'image/jpeg' }),
      }),
    ])
    seedDamConfig(useDamConfigStore())
    store.processUpload(QUEUE)
    await vi.advanceTimersByTimeAsync(0)
    server.assetDeleted('asset-1')

    await refresh(button(rows[0]))

    expect([rows[0].status, rows[0].error.hasError]).toEqual(['processing', false])
    expect(showWarningT.mock.calls).toEqual([[ASSET_GONE]])
  })
})
