import type { UploadQueueItem } from '@/types/dam/UploadQueue'
import { QueueItemStatus } from '@/types/dam/UploadQueue'
import type { DocId } from '@anzusystems/common-admin'
import {
  externalProviderUpload as imageExternalProviderUpload,
  uploadChunk as imageUploadChunk,
  uploadFinish as imageUploadFinish,
  uploadStart as imageUploadStart,
  unsetSlot as imageUnsetSlot,
  downloadLink as imageDownloadLink,
  deleteImage,
  makeMainFile as imageMakeMainFile,
  existingImageToSlot,
} from '@/services/api/dam/imageApi'
import {
  externalProviderUpload as audioExternalProviderUpload,
  uploadChunk as audioUploadChunk,
  uploadFinish as audioUploadFinish,
  uploadStart as audioUploadStart,
  unsetSlot as audioUnsetSlot,
  downloadLink as audioDownloadLink,
  deleteAudio,
  makeMainFile as audioMakeMainFile,
  existingAudioToSlot,
} from '@/services/api/dam/audioApi'
import {
  externalProviderUpload as videoExternalProviderUpload,
  uploadChunk as videoUploadChunk,
  uploadFinish as videoUploadFinish,
  uploadStart as videoUploadStart,
  unsetSlot as videoUnsetSlot,
  downloadLink as videoDownloadLink,
  deleteVideo,
  makeMainFile as videoMakeMainFile,
  existingVideoToSlot,
} from '@/services/api/dam/videoApi'
import {
  externalProviderUpload as documentExternalProviderUpload,
  uploadChunk as documentUploadChunk,
  uploadFinish as documentUploadFinish,
  uploadStart as documentUploadStart,
  unsetSlot as documentUnsetSlot,
  downloadLink as documentDownloadLink,
  deleteDocument,
  makeMainFile as documentMakeMainFile,
  existingDocumentToSlot,
} from '@/services/api/dam/documentApi'
import { AssetType } from '@/model/dam/valueObject/AssetType'
import { fetchAsset } from '@/services/api/dam/assetApi'
import { AssetFileProcessStatus, type FileDownloadLink } from '@/types/dam/File'
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

export const unsetAssetSlot = (assetType: AssetType, fileId: DocId, assetId: DocId, slotName: string) => {
  return new Promise((resolve, reject) => {
    switch (assetType) {
      case AssetType.Image:
        imageUnsetSlot(fileId, assetId, slotName)
          .then((res) => {
            resolve(res)
          })
          .catch((err) => reject(err))
        break
      case AssetType.Audio:
        audioUnsetSlot(fileId, assetId, slotName)
          .then((res) => {
            resolve(res)
          })
          .catch((err) => reject(err))
        break
      case AssetType.Video:
        videoUnsetSlot(fileId, assetId, slotName)
          .then((res) => {
            resolve(res)
          })
          .catch((err) => reject(err))
        break
      case AssetType.Document:
        documentUnsetSlot(fileId, assetId, slotName)
          .then((res) => {
            resolve(res)
          })
          .catch((err) => reject(err))
        break
    }
  })
}

export const deleteFile = (assetType: AssetType, fileId: DocId) => {
  return new Promise((resolve, reject) => {
    switch (assetType) {
      case AssetType.Image:
        deleteImage(fileId)
          .then((res) => {
            resolve(res)
          })
          .catch((err) => reject(err))
        break
      case AssetType.Audio:
        deleteAudio(fileId)
          .then((res) => {
            resolve(res)
          })
          .catch((err) => reject(err))
        break
      case AssetType.Video:
        deleteVideo(fileId)
          .then((res) => {
            resolve(res)
          })
          .catch((err) => reject(err))
        break
      case AssetType.Document:
        deleteDocument(fileId)
          .then((res) => {
            resolve(res)
          })
          .catch((err) => reject(err))
        break
    }
  })
}

export const makeMainFile = (assetType: AssetType, fileId: DocId, assetId: DocId) => {
  return new Promise((resolve, reject) => {
    switch (assetType) {
      case AssetType.Image:
        imageMakeMainFile(fileId, assetId)
          .then((res) => {
            resolve(res)
          })
          .catch((err) => reject(err))
        break
      case AssetType.Audio:
        audioMakeMainFile(fileId, assetId)
          .then((res) => {
            resolve(res)
          })
          .catch((err) => reject(err))
        break
      case AssetType.Video:
        videoMakeMainFile(fileId, assetId)
          .then((res) => {
            resolve(res)
          })
          .catch((err) => reject(err))
        break
      case AssetType.Document:
        documentMakeMainFile(fileId, assetId)
          .then((res) => {
            resolve(res)
          })
          .catch((err) => reject(err))
        break
    }
  })
}

export const existingFileToSlot = (assetType: AssetType, fileId: DocId, assetId: DocId, slotName: string) => {
  return new Promise((resolve, reject) => {
    switch (assetType) {
      case AssetType.Image:
        existingImageToSlot(fileId, assetId, slotName)
          .then((res) => {
            resolve(res)
          })
          .catch((err) => reject(err))
        break
      case AssetType.Audio:
        existingAudioToSlot(fileId, assetId, slotName)
          .then((res) => {
            resolve(res)
          })
          .catch((err) => reject(err))
        break
      case AssetType.Video:
        existingVideoToSlot(fileId, assetId, slotName)
          .then((res) => {
            resolve(res)
          })
          .catch((err) => reject(err))
        break
      case AssetType.Document:
        existingDocumentToSlot(fileId, assetId, slotName)
          .then((res) => {
            resolve(res)
          })
          .catch((err) => reject(err))
        break
    }
  })
}

export const fileDownloadLink = (assetType: AssetType, fileId: DocId) => {
  return new Promise<FileDownloadLink>((resolve, reject) => {
    switch (assetType) {
      case AssetType.Image:
        imageDownloadLink(fileId)
          .then((res) => {
            resolve(res)
          })
          .catch((err) => reject(err))
        break
      case AssetType.Audio:
        audioDownloadLink(fileId)
          .then((res) => {
            resolve(res)
          })
          .catch((err) => reject(err))
        break
      case AssetType.Video:
        videoDownloadLink(fileId)
          .then((res) => {
            resolve(res)
          })
          .catch((err) => reject(err))
        break
      case AssetType.Document:
        documentDownloadLink(fileId)
          .then((res) => {
            resolve(res)
          })
          .catch((err) => reject(err))
        break
    }
  })
}
