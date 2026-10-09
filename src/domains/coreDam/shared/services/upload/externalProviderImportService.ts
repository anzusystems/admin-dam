import { UploadQueueItemStatus, axiosErrorResponseHasValidationData, useAlerts } from '@anzusystems/common-admin'
import type { AnzuApiValidationResponseData, UploadQueueItem } from '@anzusystems/common-admin'

import { externalProviderUpload } from '@/domains/coreDam/asset/api/fileApi'

export function externalProviderImport(queueItem: UploadQueueItem) {
  const importInit = async () => {
    return new Promise((resolve) => {
      queueItem.status = UploadQueueItemStatus.Uploading
      externalProviderUpload(queueItem)
        .then((res) => {
          // Stopped or cleared while the request was on the wire: the row is discarded and takes nothing of the
          // answer, whatever it says.
          if (queueItem.status === UploadQueueItemStatus.Stop) {
            resolve(queueItem)

            return
          }
          // As with the start of an upload: without both, the poll would ask about an asset it has no id of.
          // Thrown, to end where a refused import ends.
          if (!res?.id || !res?.asset) {
            throw new Error('externalProviderImportService: the import answer names no file or no asset')
          }
          queueItem.assetId = res.asset
          queueItem.fileId = res.id
          // Until this response the item had no ids, so an early notification matched nothing: from here the poll
          // of its queue asks about it.
          if (queueItem.status === UploadQueueItemStatus.Uploading) {
            queueItem.status = UploadQueueItemStatus.Processing
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
