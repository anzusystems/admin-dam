import type { UploadQueueItem } from '@/types/dam/UploadQueue'
import { QueueItemStatus } from '@/types/dam/UploadQueue'
import type { DocId } from '@/types/common'
import {
  externalProviderUpload as imageExternalProviderUpload,
  uploadChunk as imageUploadChunk,
  uploadFinish as imageUploadFinish,
  uploadStart as imageUploadStart,
} from '@/services/api/dam/imageApi'
import {
  externalProviderUpload as audioExternalProviderUpload,
  uploadChunk as audioUploadChunk,
  uploadFinish as audioUploadFinish,
  uploadStart as audioUploadStart,
} from '@/services/api/dam/audioApi'
import {
  externalProviderUpload as videoExternalProviderUpload,
  uploadChunk as videoUploadChunk,
  uploadFinish as videoUploadFinish,
  uploadStart as videoUploadStart,
} from '@/services/api/dam/videoApi'
import {
  externalProviderUpload as documentExternalProviderUpload,
  uploadChunk as documentUploadChunk,
  uploadFinish as documentUploadFinish,
  uploadStart as documentUploadStart,
} from '@/services/api/dam/documentApi'
import { AssetType } from '@/model/dam/valueObject/AssetType'
import { fetchAsset } from '@/services/api/dam/assetApi'
import { AssetFileProcessStatus } from '@/types/dam/File'
import { useUploadQueuesStore } from '@/stores/dam/uploadQueuesStore'

interface UploadStartResponse {
  id: DocId
  asset: DocId
}

const NOTIFICATION_FALLBACK_ENABLED = false
const NOTIFICATION_FALLBACK_TIMER_CHECK_SECONDS = 10

export const uploadStart: (item: UploadQueueItem) => Promise<UploadStartResponse> = (item: UploadQueueItem) => {
  return new Promise((resolve, reject) => {
    switch (item.assetType) {
      case AssetType.Image:
        imageUploadStart(item)
          .then((res) => {
            resolve(res as UploadStartResponse)
          })
          .catch((err) => reject(err))
        break
      case AssetType.Audio:
        audioUploadStart(item)
          .then((res) => {
            resolve(res as UploadStartResponse)
          })
          .catch((err) => reject(err))
        break
      case AssetType.Video:
        videoUploadStart(item)
          .then((res) => {
            resolve(res as UploadStartResponse)
          })
          .catch((err) => reject(err))
        break
      case AssetType.Document:
        documentUploadStart(item)
          .then((res) => {
            resolve(res as UploadStartResponse)
          })
          .catch((err) => reject(err))
        break
    }
  })
}
// this is just a testing version, todo:
// - be stuck now on storing
// - remove duplicate api call for asset
// - duplicate
// - increment timer and do some max tries
// - check slot implementation
async function notificationFallbackCallback(item: UploadQueueItem) {
  console.log('notificationFallbackCallback')
  clearTimeout(item.notificationFallbackTimer)
  if (!item.assetId) return
  const asset = await fetchAsset(item.assetId)
  if (
    asset &&
    asset.mainFile &&
    asset.mainFile.fileAttributes &&
    asset.mainFile.fileAttributes.status === AssetFileProcessStatus.Processed
  ) {
    const uploadQueuesStore = useUploadQueuesStore()
    uploadQueuesStore.queueItemProcessed(asset.id)
    return
  }
  item.notificationFallbackTimer = setTimeout(function () {
    notificationFallbackCallback(item)
  }, NOTIFICATION_FALLBACK_TIMER_CHECK_SECONDS * 1000 * 2)
}

export const uploadFinish = (item: UploadQueueItem, sha: string) => {
  return new Promise((resolve, reject) => {
    switch (item.assetType) {
      case AssetType.Image:
        imageUploadFinish(item, sha)
          .then((res) => {
            item.status = QueueItemStatus.Processing
            if (NOTIFICATION_FALLBACK_ENABLED) {
              item.notificationFallbackTimer = setTimeout(function () {
                notificationFallbackCallback(item)
              }, NOTIFICATION_FALLBACK_TIMER_CHECK_SECONDS * 1000)
            }
            resolve(res)
          })
          .catch((err) => reject(err))
        break
      case AssetType.Audio:
        audioUploadFinish(item, sha)
          .then((res) => {
            item.status = QueueItemStatus.Processing
            if (NOTIFICATION_FALLBACK_ENABLED) {
              item.notificationFallbackTimer = setTimeout(function () {
                notificationFallbackCallback(item)
              }, NOTIFICATION_FALLBACK_TIMER_CHECK_SECONDS * 1000)
            }
            resolve(res)
          })
          .catch((err) => reject(err))
        break
      case AssetType.Video:
        videoUploadFinish(item, sha)
          .then((res) => {
            item.status = QueueItemStatus.Processing
            if (NOTIFICATION_FALLBACK_ENABLED) {
              item.notificationFallbackTimer = setTimeout(function () {
                notificationFallbackCallback(item)
              }, NOTIFICATION_FALLBACK_TIMER_CHECK_SECONDS * 1000)
            }
            resolve(res)
          })
          .catch((err) => reject(err))
        break
      case AssetType.Document:
        documentUploadFinish(item, sha)
          .then((res) => {
            item.status = QueueItemStatus.Processing
            if (NOTIFICATION_FALLBACK_ENABLED) {
              item.notificationFallbackTimer = setTimeout(function () {
                notificationFallbackCallback(item)
              }, NOTIFICATION_FALLBACK_TIMER_CHECK_SECONDS * 1000)
            }
            resolve(res)
          })
          .catch((err) => reject(err))
        break
    }
  })
}

export const uploadChunk = (
  item: UploadQueueItem,
  imageId: DocId,
  buffer: string,
  size: number,
  offset: number,
  onUploadProgressCallback: any
) => {
  return new Promise((resolve, reject) => {
    switch (item.assetType) {
      case AssetType.Image:
        imageUploadChunk(item, imageId, buffer, size, offset, onUploadProgressCallback)
          .then((res) => {
            resolve(res)
          })
          .catch((err) => {
            reject(err)
          })
        break
      case AssetType.Audio:
        audioUploadChunk(item, imageId, buffer, size, offset, onUploadProgressCallback)
          .then((res) => {
            resolve(res)
          })
          .catch((err) => {
            reject(err)
          })
        break
      case AssetType.Video:
        videoUploadChunk(item, imageId, buffer, size, offset, onUploadProgressCallback)
          .then((res) => {
            resolve(res)
          })
          .catch((err) => {
            reject(err)
          })
        break
      case AssetType.Document:
        documentUploadChunk(item, imageId, buffer, size, offset, onUploadProgressCallback)
          .then((res) => {
            resolve(res)
          })
          .catch((err) => {
            reject(err)
          })
        break
    }
  })
}

export const externalProviderUpload: (item: UploadQueueItem) => Promise<UploadStartResponse> = (
  item: UploadQueueItem
) => {
  return new Promise((resolve, reject) => {
    switch (item.assetType) {
      case AssetType.Image:
        imageExternalProviderUpload(item)
          .then((res) => {
            resolve(res as UploadStartResponse)
          })
          .catch((err) => reject(err))
        break
      case AssetType.Audio:
        audioExternalProviderUpload(item)
          .then((res) => {
            resolve(res as UploadStartResponse)
          })
          .catch((err) => reject(err))

        break
      case AssetType.Video:
        videoExternalProviderUpload(item)
          .then((res) => {
            resolve(res as UploadStartResponse)
          })
          .catch((err) => reject(err))
        break
      case AssetType.Document:
        documentExternalProviderUpload(item)
          .then((res) => {
            resolve(res as UploadStartResponse)
          })
          .catch((err) => reject(err))
        break
    }
  })
}
