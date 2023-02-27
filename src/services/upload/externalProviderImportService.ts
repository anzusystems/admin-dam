import type { UploadQueueItem } from '@/types/coreDam/UploadQueue'
import { QueueItemStatus } from '@/types/coreDam/UploadQueue'
import { externalProviderUpload } from '@/services/api/coreDam/fileApi'
import { useAlerts, useErrorHandler, type ValidationResponseData } from '@anzusystems/common-admin'

export function externalProviderImport(queueItem: UploadQueueItem) {
  const importInit = async () => {
    return new Promise((resolve) => {
      queueItem.status = QueueItemStatus.Uploading
      externalProviderUpload(queueItem)
        .then((res) => {
          queueItem.assetId = res.asset
          queueItem.fileId = res.id
          resolve(queueItem)
        })
        .catch((error) => {
          const { showUnknownError } = useAlerts()
          const { isValidationError } = useErrorHandler()
          if (isValidationError(error)) {
            if (!error || !error.response || !error.response.data) {
              showUnknownError()
            }
            const data = error.response.data as ValidationResponseData
            if (data.fields.id && data.fields.id.includes('error_field_not_unique')) {
              queueItem.status = QueueItemStatus.Failed
              queueItem.isDuplicate = true
              return resolve(queueItem)
            }
            showUnknownError()
            return resolve(queueItem)
          }
          showUnknownError()
          return resolve(queueItem)
        })
    })
  }

  return {
    importInit,
  }
}
