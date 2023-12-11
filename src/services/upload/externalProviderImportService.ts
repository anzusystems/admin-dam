import type { UploadQueueItem } from '@anzusystems/common-admin'
import {
  type AnzuApiValidationResponseData,
  axiosErrorResponseHasValidationData,
  UploadQueueItemStatus,
  useAlerts,
} from '@anzusystems/common-admin'
import { externalProviderUpload } from '@/services/api/coreDam/fileApi'

export function externalProviderImport(queueItem: UploadQueueItem) {
  const importInit = async () => {
    return new Promise((resolve) => {
      queueItem.status = UploadQueueItemStatus.Uploading
      externalProviderUpload(queueItem)
        .then((res) => {
          queueItem.assetId = res.asset
          queueItem.fileId = res.id
          resolve(queueItem)
        })
        .catch((error) => {
          const { showUnknownError } = useAlerts()
          if (axiosErrorResponseHasValidationData(error)) {
            if (!error || !error.response || !error.response.data) {
              showUnknownError()
            }
            const data = error.response.data as AnzuApiValidationResponseData
            if (data.fields.id && data.fields.id.includes('error_field_not_unique')) {
              queueItem.status = UploadQueueItemStatus.Failed
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
