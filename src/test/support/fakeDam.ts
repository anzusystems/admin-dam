import type { UploadQueue, UploadQueueItem } from '@anzusystems/common-admin'
import { AxiosError, CanceledError } from 'axios'
import type { AxiosRequestConfig, AxiosResponse, GenericAbortSignal, InternalAxiosRequestConfig } from 'axios'
import { vi } from 'vitest'

/* The one edge the upload tests fake: what `damClient()` hands out. Everything above it - the API modules, the
 * upload service, the poll of the queue and the store - runs as it is, so a test written against this file says
 * what the app asked the server and what the row looked like afterwards, not which function did it. */

export type FakeDamMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

export interface FakeDamRequest {
  method: FakeDamMethod
  /** Without the query string. */
  url: string
  /** As it was handed to the client: a JSON string, a `FormData`, or nothing. */
  data: unknown
  config: AxiosRequestConfig
}

export interface FakeDamAnswer {
  status: number
  data?: unknown
  /** Called as the answer reaches the client: from then on the request is over and an abort no longer touches it. */
  arrived?: () => void
}

type Handler = (request: FakeDamRequest, match: RegExpMatchArray) => FakeDamAnswer | Promise<FakeDamAnswer>
/** A value, or a function called for each read: it may throw, or answer with a promise to hold the read open. */
type Stored = unknown | (() => unknown)

const FILE_TYPES = '(image|audio|video|document)'

const answerOf = async (stored: Stored) => (typeof stored === 'function' ? await (stored as () => unknown)() : stored)

/* An asset, a file and the slots of an asset are answered as a copy, anew for every read, as a server answers: the
 * application writes into what it was handed - the detail into its asset, a mass operation into the custom data of a
 * row - and handed the stored object itself, it would be writing into what every later read answers. */
const copyOf = async (stored: Stored) => structuredClone(await answerOf(stored))

export const httpError = (status: number, data: unknown = {}) => {
  const config = { headers: {} } as InternalAxiosRequestConfig
  const response = { status, data, statusText: String(status), headers: {}, config } as AxiosResponse

  return new AxiosError('Request failed with status code ' + status, String(status), config, {}, response)
}

/** What axios takes for an answer when the request does not say (`validateStatus`): a 2xx. */
const settled = (status: number) => status >= 200 && status < 300

/** What axios rejects a request with whose signal was aborted: an `AxiosError` of the code `ERR_CANCELED`. */
const canceled = (config: AxiosRequestConfig) => new CanceledError('canceled', config as InternalAxiosRequestConfig)

/* The answer of the handler, unless the signal of the request is aborted first: then the request fails at once,
 * as it does in the browser, and whatever the handler answers afterwards reaches nobody. */
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

/** The body core-dam sends with a 422. */
export const validationError = (fields: Record<string, string[]>) =>
  httpError(422, { error: 'validation_failed', contextId: 'context', fields })

/** The body core-dam sends when it refuses an operation: a 422 too, told apart by its `error`. */
export const forbiddenOperationError = (detail: string) =>
  httpError(422, { error: 'forbidden_operation_error', contextId: 'context', detail })

export const createFakeDam = () => {
  const requests: FakeDamRequest[] = []
  const handlers: Array<{ method: FakeDamMethod; pattern: RegExp; handler: Handler }> = []
  const assets = new Map<string, Stored>()
  const files = new Map<string, Stored>()
  // By asset: the file of each of its slots by the name of the slot, or a function that answers the whole list.
  const slots = new Map<string, Map<string, FakeAssetFile | null> | (() => unknown)>()
  let started = 0

  /* The server knows what an upload it has started made, as the real one does: the asset with its file still on
   * its way, until the test says what became of it. An asset the test has described already stays as described. */
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
    // As axios: a request whose signal is aborted already is refused before it is sent, so the server never sees it.
    if (config.signal?.aborted) throw canceled(config)
    const request: FakeDamRequest = { method, url: rawUrl.split('?')[0], data, config }
    requests.push(request)
    for (const { method: handled, pattern, handler } of handlers) {
      if (handled !== method) continue
      const match = request.url.match(pattern)
      if (!match) continue
      const answer = await unlessAborted(handler(request, match), config)
      answer.arrived?.()
      // As axios settles an answer: by the `validateStatus` of the request, a 2xx without one; else thrown, with it.
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

  // One asset by its id.
  on('GET', /^\/adm\/v1\/asset\/([^/]+)$/, async (_request, match) => {
    if (!assets.has(match[1])) throw httpError(404)

    return { status: 200, data: await copyOf(assets.get(match[1])) }
  })
  // Several by their ids: one the licence does not hold is simply not in the answer.
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
  // The slots of an asset, each with its file: all of them in one answer.
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
  // The three requests of an upload, and the import that stands in for them.
  on('POST', new RegExp(`^/adm/v1/${FILE_TYPES}/licence/(\\d+)$`), (_request, match) => {
    started++
    startedAsset(match[1], 'asset-' + started, 'file-' + started)

    return { status: 201, data: { id: 'file-' + started, asset: 'asset-' + started } }
  })
  on('POST', new RegExp(`^/adm/v1/${FILE_TYPES}/asset/([^/]+)/slot-name/([^/]+)$`), (_request, match) => {
    started++
    // Unless the test has taken the list of the slots of this asset into its own hands.
    if (typeof slots.get(match[2]) !== 'function') {
      slotsOf(match[2]).set(match[3], assetFile('file-' + started, 'uploading', { asset: match[2] }))
    }

    return { status: 201, data: { id: 'file-' + started, asset: match[2] } }
  })
  // A client that took no id from the start answer puts `undefined` where the file goes: no such file.
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

  /** How many times the asset was asked for, one at a time or among others: the shape of the read is not the point. */
  const assetReads = (assetId: string) =>
    sent('GET').filter((request) => {
      if (request.url === '/adm/v1/asset/' + assetId) return true
      const several = request.url.match(/^\/adm\/v1\/asset\/licence\/\d+\/ids\/(.+)$/)

      return !!several && several[1].split(',').includes(assetId)
    }).length

  /** How many times the list of the slots of the asset was asked for. */
  const slotReads = (assetId: string) =>
    sent('GET').filter((request) => request.url === '/adm/v1/asset-slot/asset/' + assetId).length

  return {
    client,
    requests,
    on,
    sent,
    assetReads,
    slotReads,
    /** For a test that answers a start request by itself: the server has made that asset, its file on its way. */
    uploadStarted: startedAsset,
    /** What a read of the asset answers from now on. */
    asset: (asset: { id: string } & Record<string, unknown>) => assets.set(asset.id, asset),
    /** The same, by a function: it may throw to fail the read, or answer with a promise to hold it. */
    assetBy: (assetId: string, answer: () => unknown) => assets.set(assetId, answer),
    file: (assetType: string, file: FakeAssetFile) => files.set(assetType + '/' + file.id, file),
    fileBy: (assetType: string, fileId: string, answer: () => unknown) => files.set(assetType + '/' + fileId, answer),
    /** The asset is deleted: the server knows neither it nor its slots any more, and answers 404 for both. */
    assetDeleted: (assetId: string) => {
      assets.delete(assetId)
      slots.delete(assetId)
    },
    /** What the slot of the asset holds from now on, as the list of its slots answers it. */
    slotFile: (assetId: string, slotName: string, file: FakeAssetFile | null) => slotsOf(assetId).set(slotName, file),
    /** The whole answer to a read of the slots of the asset, by a function: it may throw, or answer no list at all. */
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

/** An asset file as the detail of its asset carries it. */
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

/** An asset as `GET /adm/v1/asset/{id}` answers it, down to the fields the queue reads. */
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

/** A queue row with every field the factory gives one; an upload of an image unless told otherwise. */
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

/** Puts the rows into a queue of the store and answers them as the store hands them out - in a list of its own,
 * which keeps a row the queue has since dropped. */
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

/* happy-dom's `FileReader` never fires `onload` under the suite, and the upload service reads every chunk through
 * one - without this the first read of a real upload never returns. It answers with the bytes of the file. */
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

/** `onRead` is told of every chunk as its read begins: the moment between two chunks, with nothing on the wire. */
export const stubFileReader = (onRead?: (blob: Blob) => void) => {
  onFileRead = onRead
  vi.stubGlobal('FileReader', FileReaderStub)
}

/** The settings the upload service and `addByFiles` read from the library's DAM config store. */
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
