import type { UploadQueueItem } from '@anzusystems/common-admin'
import {
  type AnzuApiValidationResponseData,
  axiosErrorResponseHasValidationData,
  UploadQueueItemStatus,
} from '@anzusystems/common-admin'
import { armNotificationFallback, externalProviderUpload } from '@/domains/coreDam/asset/api/fileApi'

export function externalProviderImport(queueItem: UploadQueueItem) {
  const importInit = async () => {
    return new Promise((resolve) => {
      queueItem.status = UploadQueueItemStatus.Uploading
      externalProviderUpload(queueItem)
        .then((res) => {
          queueItem.assetId = res.asset
          queueItem.fileId = res.id
          // Until this response the item had no ids, so an early notification matched nothing.
          if (queueItem.status === UploadQueueItemStatus.Uploading) {
            queueItem.status = UploadQueueItemStatus.Processing
            armNotificationFallback(queueItem)
          }
          resolve(queueItem)
        })
        .catch((error) => {
          const { showUnknownError } = useAlerts()
          if (axiosErrorResponseHasValidationData(error)) {
            const data = error.response.data as AnzuApiValidationResponseData
            if (data.fields.id && data.fields.id.includes('error_field_not_unique')) {
              queueItem.status = UploadQueueItemStatus.Failed
              queueItem.isDuplicate = true

              return resolve(queueItem)
            }
          }
          // Failed, not left `Uploading`, which holds one of the two slots for good.
          queueItem.status = UploadQueueItemStatus.Failed
          queueItem.error.hasError = true
          showUnknownError()

          return resolve(queueItem)
        })
    })
  }

  return {
    importInit,
  }
}
