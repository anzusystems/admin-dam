import type { UploadQueue, UploadQueueItem } from '@anzusystems/common-admin'
import { AxiosError, CanceledError } from 'axios'
import type { AxiosRequestConfig, AxiosResponse, GenericAbortSignal, InternalAxiosRequestConfig } from 'axios'
import { vi } from 'vitest'

/*
 * The only faked edge of the upload tests is what `damClient()` returns.
 * The API modules, upload service, queue poll and store run for real, so tests
 * assert what the app asked the server and what the row looked like afterwards.
 */

export type FakeDamMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

export interface FakeDamRequest {
  method: FakeDamMethod
  url: string
  data: unknown
  config: AxiosRequestConfig
}

export interface FakeDamAnswer {
  status: number
  data?: unknown
  /** Called when the answer reaches the client. From then on the request is over and an abort no longer affects it. */
  arrived?: () => void
}

type Handler = (request: FakeDamRequest, match: RegExpMatchArray) => FakeDamAnswer | Promise<FakeDamAnswer>
type Stored = unknown | (() => unknown)

const FILE_TYPES = '(image|audio|video|document)'

const answerOf = async (stored: Stored) => (typeof stored === 'function' ? await (stored as () => unknown)() : stored)

/*
 * Assets, files and asset slots are returned as a fresh copy on every read, as a server does.
 * The application writes into what it receives, so handing out the
 * stored object would leak those writes into every later read.
 */
const copyOf = async (stored: Stored) => structuredClone(await answerOf(stored))

export const httpError = (status: number, data: unknown = {}) => {
  const config = { headers: {} } as InternalAxiosRequestConfig
  const response = { status, data, statusText: String(status), headers: {}, config } as AxiosResponse

  return new AxiosError('Request failed with status code ' + status, String(status), config, {}, response)
}

const settled = (status: number) => status >= 200 && status < 300

const canceled = (config: AxiosRequestConfig) => new CanceledError('canceled', config as InternalAxiosRequestConfig)

/*
 * Returns the handler answer unless the request signal is aborted first.
 * Then the request fails at once, as in the browser, and a later handler answer is dropped.
 */
const unlessAborted = <T>(answer: T | Promise<T>, config: AxiosRequestConfig) => {
  const signal: GenericAbortSignal | undefined = config.signal
  if (!signal?.addEventListener) return Promise.resolve(answer)

  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(canceled(config))
    // A handler runs up to its first `await` before this line, and may have aborted the request by then.
    if (signal.aborted) onAbort()
    signal.addEventListener?.('abort', onAbort)
    Promise.resolve(answer)
      .then(resolve, reject)
      .finally(() => signal.removeEventListener?.('abort', onAbort))
  })
}

export const validationError = (fields: Record<string, string[]>) =>
  httpError(422, { error: 'validation_failed', contextId: 'context', fields })

/** Also a 422, told apart from a validation error by its `error` field. */
export const forbiddenOperationError = (detail: string) =>
  httpError(422, { error: 'forbidden_operation_error', contextId: 'context', detail })

export const createFakeDam = () => {
  const requests: FakeDamRequest[] = []
  const handlers: Array<{ method: FakeDamMethod; pattern: RegExp; handler: Handler }> = []
  const assets = new Map<string, Stored>()
  const files = new Map<string, Stored>()
  const slots = new Map<string, Map<string, FakeAssetFile | null> | (() => unknown)>()
  let started = 0

  /*
   * Like the real server, a started upload creates the asset with
   * its file still uploading, until the test says otherwise.
   * An asset the test has already described is left as described.
   */
  const startedAsset = (assetType: string, assetId: string, fileId: string) => {
    if (assets.has(assetId)) return
    assets.set(
      assetId,
      assetDetail(assetId, {
        attributes: { assetType, assetStatus: 'draft' },
        mainFile: assetFile(fileId, 'uploading', { asset: assetId }),
      })
    )
  }
  const slotsOf = (assetId: string) => {
    const known = slots.get(assetId)
    if (known instanceof Map) return known
    const made = new Map<string, FakeAssetFile | null>()
    slots.set(assetId, made)

    return made
  }

  /** Later registrations win, so a test can put its own answer over a default one. */
  const on = (method: FakeDamMethod, pattern: RegExp, handler: Handler) => {
    handlers.unshift({ method, pattern, handler })
  }

  const dispatch = async (method: FakeDamMethod, rawUrl: string, data: unknown, config: AxiosRequestConfig = {}) => {
    // As axios does: a request whose signal is already aborted is refused before sending, so the server never sees it.
    if (config.signal?.aborted) throw canceled(config)
    const request: FakeDamRequest = { method, url: rawUrl.split('?')[0], data, config }
    requests.push(request)
    for (const { method: handled, pattern, handler } of handlers) {
      if (handled !== method) continue
      const match = request.url.match(pattern)
      if (!match) continue
      const answer = await unlessAborted(handler(request, match), config)
      answer.arrived?.()
      // As axios does: the request `validateStatus` decides, and a 2xx is the default. Other statuses are thrown.
      if (!(config.validateStatus ?? settled)(answer.status)) throw httpError(answer.status, answer.data)

      return { status: answer.status, data: answer.data, statusText: '', headers: {}, config }
    }
    throw new Error(`fakeDam: nothing answers ${method} ${request.url}`)
  }

  const client = {
    request: (config: AxiosRequestConfig) =>
      dispatch((config.method ?? 'GET').toUpperCase() as FakeDamMethod, config.url ?? '', config.data, config),
    get: (url: string, config?: AxiosRequestConfig) => dispatch('GET', url, undefined, config),
    delete: (url: string, config?: AxiosRequestConfig) => dispatch('DELETE', url, undefined, config),
    post: (url: string, data?: unknown, config?: AxiosRequestConfig) => dispatch('POST', url, data, config),
    patch: (url: string, data?: unknown, config?: AxiosRequestConfig) => dispatch('PATCH', url, data, config),
    put: (url: string, data?: unknown, config?: AxiosRequestConfig) => dispatch('PUT', url, data, config),
    getUri: (config?: AxiosRequestConfig) => config?.url ?? '',
  }

  on('GET', /^\/adm\/v1\/asset\/([^/]+)$/, async (_request, match) => {
    if (!assets.has(match[1])) throw httpError(404)

    return { status: 200, data: await copyOf(assets.get(match[1])) }
  })
  // An asset that the licence does not hold is left out of the answer.
  on('GET', /^\/adm\/v1\/asset\/licence\/(\d+)\/ids\/(.+)$/, async (_request, match) => {
    const found: unknown[] = []
    for (const id of match[2].split(',')) {
      if (assets.has(id)) found.push(await copyOf(assets.get(id)))
    }

    return { status: 200, data: { data: found } }
  })
  on('GET', new RegExp(`^/adm/v1/${FILE_TYPES}/([^/]+)$`), async (_request, match) => {
    const key = match[1] + '/' + match[2]
    if (!files.has(key)) throw httpError(404)

    return { status: 200, data: await copyOf(files.get(key)) }
  })
  on('GET', /^\/adm\/v1\/asset-slot\/asset\/([^/]+)$/, async (_request, match) => {
    const known = slots.get(match[1])
    if (typeof known === 'function') return { status: 200, data: await copyOf(known) }
    if (!known && !assets.has(match[1])) throw httpError(404)
    const data = [...(known ?? [])].map(([slotName, file]) => ({
      id: 'slot-' + slotName,
      slotName,
      default: false,
      main: false,
      assetFile: structuredClone(file),
    }))

    return { status: 200, data: { data, totalCount: data.length } }
  })
  on('POST', new RegExp(`^/adm/v1/${FILE_TYPES}/licence/(\\d+)$`), (_request, match) => {
    started++
    startedAsset(match[1], 'asset-' + started, 'file-' + started)

    return { status: 201, data: { id: 'file-' + started, asset: 'asset-' + started } }
  })
  on('POST', new RegExp(`^/adm/v1/${FILE_TYPES}/asset/([^/]+)/slot-name/([^/]+)$`), (_request, match) => {
    started++
    if (typeof slots.get(match[2]) !== 'function') {
      slotsOf(match[2]).set(match[3], assetFile('file-' + started, 'uploading', { asset: match[2] }))
    }

    return { status: 201, data: { id: 'file-' + started, asset: match[2] } }
  })
  // A client that took no id from the start answer sends `undefined` as the file id. The fake answers 404 for it.
  on('POST', new RegExp(`^/adm/v1/${FILE_TYPES}/([^/]+)/chunk$`), (_request, match) => {
    if (match[2] === 'undefined') throw httpError(404)

    return { status: 201, data: {} }
  })
  on('PATCH', new RegExp(`^/adm/v1/${FILE_TYPES}/([^/]+)/uploaded$`), (_request, match) => {
    if (match[2] === 'undefined') throw httpError(404)

    return { status: 200, data: { id: match[2] } }
  })
  on('POST', new RegExp(`^/adm/v1/${FILE_TYPES}/licence/(\\d+)/external-provider$`), (_request, match) => {
    started++
    startedAsset(match[1], 'asset-' + started, 'file-' + started)

    return { status: 201, data: { id: 'file-' + started, asset: 'asset-' + started } }
  })

  const sent = (method: FakeDamMethod, pattern: RegExp = /./) =>
    requests.filter((request) => request.method === method && pattern.test(request.url))

  /** Counts reads of the asset, single or among others. The shape of the read does not matter. */
  const assetReads = (assetId: string) =>
    sent('GET').filter((request) => {
      if (request.url === '/adm/v1/asset/' + assetId) return true
      const several = request.url.match(/^\/adm\/v1\/asset\/licence\/\d+\/ids\/(.+)$/)

      return !!several && several[1].split(',').includes(assetId)
    }).length

  const slotReads = (assetId: string) =>
    sent('GET').filter((request) => request.url === '/adm/v1/asset-slot/asset/' + assetId).length

  return {
    client,
    requests,
    on,
    sent,
    assetReads,
    slotReads,
    uploadStarted: startedAsset,
    asset: (asset: { id: string } & Record<string, unknown>) => assets.set(asset.id, asset),
    /** Same, by a function. It may throw to fail the read, or return a promise to hold it open. */
    assetBy: (assetId: string, answer: () => unknown) => assets.set(assetId, answer),
    file: (assetType: string, file: FakeAssetFile) => files.set(assetType + '/' + file.id, file),
    fileBy: (assetType: string, fileId: string, answer: () => unknown) => files.set(assetType + '/' + fileId, answer),
    assetDeleted: (assetId: string) => {
      assets.delete(assetId)
      slots.delete(assetId)
    },
    slotFile: (assetId: string, slotName: string, file: FakeAssetFile | null) => slotsOf(assetId).set(slotName, file),
    slotsBy: (assetId: string, answer: () => unknown) => slots.set(assetId, answer),
  }
}

export type FakeDam = ReturnType<typeof createFakeDam>

type FileStatus = 'uploading' | 'uploaded' | 'stored' | 'duplicate' | 'processed' | 'failed'

export type FakeAssetFile = {
  id: string
  asset: string
  fileAttributes: { status: FileStatus; failReason: string; originFileName: string; mimeType: string; size: number }
  flags: { singleUse: boolean; internal: boolean; overrideInternal: boolean }
  links: Record<string, { url: string; width: number; height: number }>
  originAssetFile: string | null
}

export const assetFile = (
  id: string,
  status: FileStatus = 'processed',
  over: Partial<FakeAssetFile> = {}
): FakeAssetFile => ({
  id,
  asset: 'asset-1',
  fileAttributes: { status, failReason: 'none', originFileName: id, mimeType: 'image/jpeg', size: 1 },
  flags: { singleUse: false, internal: false, overrideInternal: false },
  links: { image_detail: { url: 'https://dam.test/' + id + '/detail.jpg', width: 800, height: 450 } },
  originAssetFile: null,
  ...over,
})

export const assetDetail = (
  id: string,
  over: Record<string, unknown> = {}
): { id: string } & Record<string, unknown> => ({
  id,
  attributes: { assetType: 'image', assetStatus: 'with_file' },
  texts: { displayTitle: id },
  mainFile: assetFile('file-1', 'processed', { asset: id }),
  keywords: ['keyword-server'],
  authors: ['author-server'],
  mainFileSingleUse: false,
  metadata: { customData: { title: 'from the server' }, authorSuggestions: {}, keywordSuggestions: {} },
  ...over,
})

let rowSequence = 0

export const queueRow = (over: Partial<UploadQueueItem> = {}): UploadQueueItem => ({
  key: 'row-' + ++rowSequence,
  type: 'file',
  file: null,
  status: 'uploading',
  isDuplicate: false,
  duplicateAssetId: null,
  uploadedAssetId: null,
  assetType: 'image',
  assetStatus: 'draft',
  displayTitle: '',
  assetId: 'asset-1',
  fileId: 'file-1',
  externalProviderAssetId: null,
  externalProviderName: null,
  externalProviderMetadata: {},
  keywords: [],
  authors: [],
  authorConflicts: [],
  customData: {},
  latestChunkAbortController: null,
  chunkSize: 10485760,
  currentChunkIndex: 0,
  chunkTotalCount: 0,
  licenceId: 1,
  imagePreview: undefined,
  progress: { remainingTime: null, progressPercent: null, speed: null },
  canEditMetadata: false,
  error: { hasError: false, message: '', assetFileFailReason: 'none' },
  notificationFallbackTimer: undefined,
  notificationFallbackTry: 1,
  slotName: null,
  image: undefined,
  mainFileSingleUse: null,
  mainFileInternal: null,
  ...over,
})

/**
 * Puts the rows into a store queue and returns them as the store hands them out.
 * That is a separate list, which keeps a row the queue has since dropped.
 */
export const seedQueue = (
  store: { queues: Record<string, UploadQueue> },
  queueId: string,
  rows: UploadQueueItem[]
): UploadQueueItem[] => {
  store.queues[queueId] = {
    items: rows,
    totalCount: rows.length,
    processedCount: 0,
    fileInputKey: 0,
    suggestions: { newKeywordNames: new Set<string>(), newAuthorNames: new Set<string>() },
  }

  return [...store.queues[queueId].items]
}

let onFileRead: ((blob: Blob) => void) | undefined = undefined

/*
 * happy-dom `FileReader` never fires `onload` under the suite, and the upload service reads every chunk through one.
 * Without this stub the first read of a real upload never returns.
 */
class FileReaderStub {
  static readonly DONE = 2
  readyState = 0
  result: unknown = null
  onload: ((event: { target: FileReaderStub }) => void) | null = null
  onerror: ((event: unknown) => void) | null = null
  readAsArrayBuffer(blob: Blob) {
    onFileRead?.(blob)
    void blob.arrayBuffer().then((bytes) => {
      this.readyState = FileReaderStub.DONE
      this.result = bytes
      this.onload?.({ target: this })
    })
  }
}

/**
 * `onRead` is called for every chunk as its read begins. That
 * is the moment between two chunks with nothing on the wire.
 */
export const stubFileReader = (onRead?: (blob: Blob) => void) => {
  onFileRead = onRead
  vi.stubGlobal('FileReader', FileReaderStub)
}

export const seedDamConfig = (
  configStore: {
    damPrvConfig: { settings: { imageChunkConfig: { minSize: number; maxSize: number } } }
    damConfigExtSystem: Map<number, unknown>
  },
  chunkSize = 1024,
  extSystemId = 1
) => {
  configStore.damPrvConfig = {
    ...configStore.damPrvConfig,
    settings: { ...configStore.damPrvConfig.settings, imageChunkConfig: { minSize: chunkSize, maxSize: chunkSize } },
  }
  const type = (mimeTypes: string[]) => ({
    enabled: true,
    sizeLimit: 1_000_000,
    mimeTypes,
    customMetadataPinnedAmount: 2,
    slots: [],
    keywords: { enabled: true, required: false },
    authors: { enabled: true, required: false },
  })
  configStore.damConfigExtSystem.set(extSystemId, {
    image: { ...type(['image/jpeg', 'image/png']), roiWidth: 16, roiHeight: 9 },
    audio: type(['audio/mpeg']),
    video: type(['video/mp4']),
    document: type(['application/pdf']),
  })
}
