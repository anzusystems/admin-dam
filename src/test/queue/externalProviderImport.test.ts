import { beforeEach, describe, expect, it, vi } from 'vitest'
import { UploadQueueItemStatus } from '@anzusystems/common-admin'

const externalProviderUpload = vi.fn(async (): Promise<unknown> => ({ asset: 'asset-1', id: 'file-1' }))
const armNotificationFallback = vi.fn()
const showUnknownError = vi.fn()

vi.mock('@/domains/coreDam/asset/api/fileApi', () => ({
  externalProviderUpload: () => externalProviderUpload(),
  armNotificationFallback: (item: unknown) => armNotificationFallback(item),
}))
// The library decides what counts as validation data; this is about what the service does with it.
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
  it('carries the ids over when it succeeds, and arms the fallback behind them', async () => {
    const { externalProviderImport } = await load()
    const item = queueItem()

    await externalProviderImport(item as never).importInit()

    expect(item.assetId).toBe('asset-1')
    expect(item.fileId).toBe('file-1')
    // Until this response the item had no ids at all, so a notification that arrived first matched nothing and was
    // gone - and there is no upload here whose finish would arm a fallback.
    expect(item.status).toBe(UploadQueueItemStatus.Processing)
    expect(armNotificationFallback).toHaveBeenCalledWith(item)
  })

  it('leaves an item the notification has already settled alone', async () => {
    const { externalProviderImport } = await load()
    const item = queueItem()
    // Contrived on purpose: today the ids and the status are written in the same `.then`, so nothing can settle the
    // item in between - the guard is what keeps that true if anything is ever awaited between them.
    externalProviderUpload.mockImplementation(async () => {
      item.status = UploadQueueItemStatus.Uploaded

      return { asset: 'asset-1', id: 'file-1' }
    })

    await externalProviderImport(item as never).importInit()

    expect(item.status).toBe(UploadQueueItemStatus.Uploaded)
    expect(armNotificationFallback).not.toHaveBeenCalled()
  })

  it('marks the item failed when the provider refuses', async () => {
    const { externalProviderImport } = await load()
    const item = queueItem()
    externalProviderUpload.mockRejectedValue(new Error('provider is down'))

    await externalProviderImport(item as never).importInit()

    // Left uploading, the item holds one of the two parallel slots for the rest of the session - two failures and the
    // queue stops moving.
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
    // A duplicate is an ordinary answer, not something to alert about.
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
