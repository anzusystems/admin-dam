import { UploadQueueItemStatus, axiosErrorResponseHasValidationData, useAlerts } from '@anzusystems/common-admin'
import type { AnzuApiValidationResponseData, UploadQueueItem } from '@anzusystems/common-admin'

import { externalProviderUpload } from '@/domains/coreDam/asset/api/fileApi'

export function externalProviderImport(queueItem: UploadQueueItem) {
  const importInit = async () =>
    new Promise((resolve) => {
      queueItem.status = UploadQueueItemStatus.Uploading
      externalProviderUpload(queueItem)
        .then((res) => {
          // Stopped or cleared while the request was in flight: the row is discarded and ignores the response.
          if (queueItem.status === UploadQueueItemStatus.Stop) {
            resolve(queueItem)

            return
          }
          // Without both ids, the poll would ask about an unknown asset.
          // Thrown so it ends the same way as a refused import.
          if (!res?.id || !res?.asset) {
            throw new Error('externalProviderImportService: the import answer names no file or no asset')
          }
          queueItem.assetId = res.asset
          queueItem.fileId = res.id
          // The item had no ids until this response, so earlier notifications matched nothing.
          // From here the queue poll checks it.
          if (queueItem.status === UploadQueueItemStatus.Uploading) {
            queueItem.status = UploadQueueItemStatus.Processing
          }
          resolve(queueItem)
        })
        .catch((error) => {
          // Stopped or cleared meanwhile: a refusal is neither written into the discarded row nor shown.
          if (queueItem.status === UploadQueueItemStatus.Stop) return resolve(queueItem)
          const { showUnknownError } = useAlerts()
          if (axiosErrorResponseHasValidationData(error)) {
            const data = error.response.data as AnzuApiValidationResponseData
            if (data.fields.id && data.fields.id.includes('error_field_not_unique')) {
              queueItem.status = UploadQueueItemStatus.Failed
              queueItem.isDuplicate = true

              return resolve(queueItem)
            }
          }
          // Marked failed: staying `Uploading` would hold one of the two upload slots forever.
          queueItem.status = UploadQueueItemStatus.Failed
          queueItem.error.hasError = true
          showUnknownError()

          return resolve(queueItem)
        })
    })

  return {
    importInit,
  }
}
