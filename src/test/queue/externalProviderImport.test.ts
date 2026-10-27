import { UploadQueueItemStatus } from '@anzusystems/common-admin'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const externalProviderUpload = vi.fn(async (): Promise<unknown> => ({ asset: 'asset-1', id: 'file-1' }))
const showUnknownError = vi.fn()

vi.mock('@/domains/coreDam/asset/api/fileApi', () => ({
  externalProviderUpload: () => externalProviderUpload(),
}))
let hasValidationData = false
vi.mock('@anzusystems/common-admin', async (importOriginal) => ({
  ...((await importOriginal()) as Record<string, unknown>),
  useAlerts: () => ({ showUnknownError }),
  axiosErrorResponseHasValidationData: () => hasValidationData,
}))

const queueItem = () => ({
  status: UploadQueueItemStatus.Waiting as string,
  assetId: null as string | null,
  fileId: null as string | null,
  isDuplicate: false,
  error: { hasError: false, message: '' },
})

const load = async () => {
  vi.resetModules()

  return await import('@/domains/coreDam/shared/services/upload/externalProviderImportService')
}

const validationError = (fields: Record<string, string[]>) => {
  hasValidationData = true

  return { response: { data: { fields } } }
}

beforeEach(() => {
  vi.clearAllMocks()
  hasValidationData = false
  externalProviderUpload.mockResolvedValue({ asset: 'asset-1', id: 'file-1' })
})

describe('importing from an external provider', () => {
  it('carries the ids over when it succeeds, and hands the item over to processing', async () => {
    const { externalProviderImport } = await load()
    const item = queueItem()

    await externalProviderImport(item as never).importInit()

    expect(item.assetId).toBe('asset-1')
    expect(item.fileId).toBe('file-1')
    // Before this response the item has no ids, so a notification that arrives first matches nothing and is lost.
    // No upload finish hands it over here, so the queue poll asks for it.
    expect(item.status).toBe(UploadQueueItemStatus.Processing)
  })

  it('leaves an item the notification has already settled alone', async () => {
    const { externalProviderImport } = await load()
    const item = queueItem()
    // Contrived on purpose. Today the ids and the status are written
    // in the same `.then`, so nothing can settle the item in between.
    // The guard keeps this true if something is awaited between them.
    externalProviderUpload.mockImplementation(async () => {
      item.status = UploadQueueItemStatus.Uploaded

      return { asset: 'asset-1', id: 'file-1' }
    })

    await externalProviderImport(item as never).importInit()

    expect(item.status).toBe(UploadQueueItemStatus.Uploaded)
  })

  it('marks the item failed when the provider refuses', async () => {
    const { externalProviderImport } = await load()
    const item = queueItem()
    externalProviderUpload.mockRejectedValue(new Error('provider is down'))

    await externalProviderImport(item as never).importInit()

    // An item left uploading holds one of the two parallel slots for the rest of the session.
    // After two failures the queue stops moving.
    expect(item.status).toBe(UploadQueueItemStatus.Failed)
    expect(item.error.hasError).toBe(true)
    expect(showUnknownError).toHaveBeenCalledTimes(1)
  })

  it('marks a duplicate as such, and says nothing about it', async () => {
    const { externalProviderImport } = await load()
    const item = queueItem()
    externalProviderUpload.mockRejectedValue(validationError({ id: ['error_field_not_unique'] }))

    await externalProviderImport(item as never).importInit()

    expect(item.status).toBe(UploadQueueItemStatus.Failed)
    expect(item.isDuplicate).toBe(true)
    expect(showUnknownError).not.toHaveBeenCalled()
  })

  it('still fails on a validation error that is not a duplicate', async () => {
    const { externalProviderImport } = await load()
    const item = queueItem()
    externalProviderUpload.mockRejectedValue(validationError({ size: ['error_too_big'] }))

    await externalProviderImport(item as never).importInit()

    expect(item.status).toBe(UploadQueueItemStatus.Failed)
    expect(item.isDuplicate).toBe(false)
    expect(showUnknownError).toHaveBeenCalledTimes(1)
  })
})
