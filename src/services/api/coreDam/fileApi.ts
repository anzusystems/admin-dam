import { AssetFileProcessStatus, type DocId, type UploadQueueItem } from '@anzusystems/common-admin'
import { UploadQueueItemStatus } from '@anzusystems/common-admin'
import {
  deleteImage,
  downloadLink as imageDownloadLink,
  existingImageToSlot,
  externalProviderUpload as imageExternalProviderUpload,
  makeMainFile as imageMakeMainFile,
  unsetSlot as imageUnsetSlot,
  uploadChunk as imageUploadChunk,
  uploadFinish as imageUploadFinish,
  uploadStart as imageUploadStart,
} from '@/services/api/coreDam/imageApi'
import {
  deleteAudio,
  downloadLink as audioDownloadLink,
  existingAudioToSlot,
  externalProviderUpload as audioExternalProviderUpload,
  makeMainFile as audioMakeMainFile,
  unsetSlot as audioUnsetSlot,
  uploadChunk as audioUploadChunk,
  uploadFinish as audioUploadFinish,
  uploadStart as audioUploadStart,
} from '@/services/api/coreDam/audioApi'
import {
  deleteVideo,
  downloadLink as videoDownloadLink,
  existingVideoToSlot,
  externalProviderUpload as videoExternalProviderUpload,
  makeMainFile as videoMakeMainFile,
  unsetSlot as videoUnsetSlot,
  uploadChunk as videoUploadChunk,
  uploadFinish as videoUploadFinish,
  uploadStart as videoUploadStart,
} from '@/services/api/coreDam/videoApi'
import {
  deleteDocument,
  downloadLink as documentDownloadLink,
  existingDocumentToSlot,
  externalProviderUpload as documentExternalProviderUpload,
  makeMainFile as documentMakeMainFile,
  unsetSlot as documentUnsetSlot,
  uploadChunk as documentUploadChunk,
  uploadFinish as documentUploadFinish,
  uploadStart as documentUploadStart,
} from '@/services/api/coreDam/documentApi'
import { DamAssetType } from '@/model/coreDam/valueObject/DamAssetType'
import { fetchAsset } from '@/services/api/coreDam/assetApi'
import type { FileDownloadLink } from '@/types/coreDam/File'
import { useUploadQueuesStore } from '@/stores/coreDam/uploadQueuesStore'
import { envConfig } from '@/services/EnvConfigService'

interface UploadStartResponse {
  id: DocId
  asset: DocId
}

const NOTIFICATION_FALLBACK_TIMER_CHECK_SECONDS = 10
const NOTIFICATION_FALLBACK_MAX_TRIES = 3

export const uploadStart: (item: UploadQueueItem) => Promise<UploadStartResponse> = (item: UploadQueueItem) => {
  return new Promise((resolve, reject) => {
    switch (item.assetType) {
      case DamAssetType.Image:
        imageUploadStart(item)
          .then((res) => {
            resolve(res as UploadStartResponse)
          })
          .catch((err) => reject(err))
        break
      case DamAssetType.Audio:
        audioUploadStart(item)
          .then((res) => {
            resolve(res as UploadStartResponse)
          })
          .catch((err) => reject(err))
        break
      case DamAssetType.Video:
        videoUploadStart(item)
          .then((res) => {
            resolve(res as UploadStartResponse)
          })
          .catch((err) => reject(err))
        break
      case DamAssetType.Document:
        documentUploadStart(item)
          .then((res) => {
            resolve(res as UploadStartResponse)
          })
          .catch((err) => reject(err))
        break
    }
  })
}

function calculateFallbackTime(item: UploadQueueItem) {
  return NOTIFICATION_FALLBACK_TIMER_CHECK_SECONDS * 1000 * item.notificationFallbackTry * item.notificationFallbackTry
}

// this is just a testing version, todo test
async function notificationFallbackCallback(item: UploadQueueItem) {
  clearTimeout(item.notificationFallbackTimer)
  if (item.status === UploadQueueItemStatus.Uploaded) return
  if (item.notificationFallbackTry > NOTIFICATION_FALLBACK_MAX_TRIES) return
  if (!item.assetId) return
  const asset = await fetchAsset(item.assetId)
  if (asset && asset.mainFile && asset.mainFile.fileAttributes) {
    const uploadQueuesStore = useUploadQueuesStore()
    if (asset.mainFile.fileAttributes.status === AssetFileProcessStatus.Processed) {
      uploadQueuesStore.queueItemProcessed(asset.id)
      return
    } else if (asset.mainFile.fileAttributes.status === AssetFileProcessStatus.Duplicate) {
      uploadQueuesStore.queueItemDuplicate(asset.id)
      return
    } else if (asset.mainFile.fileAttributes.status === AssetFileProcessStatus.Failed) {
      uploadQueuesStore.queueItemFailed(asset.id, asset.mainFile.fileAttributes.failReason)
      return
    }
  }
  item.notificationFallbackTry++
  item.notificationFallbackTimer = setTimeout(function () {
    notificationFallbackCallback(item)
  }, calculateFallbackTime(item))
}

export const uploadFinish = (item: UploadQueueItem, sha: string) => {
  return new Promise((resolve, reject) => {
    switch (item.assetType) {
      case DamAssetType.Image:
        imageUploadFinish(item, sha)
          .then((res) => {
            item.status = UploadQueueItemStatus.Processing
            if (envConfig.uploadStatusFallback) {
              item.notificationFallbackTimer = setTimeout(function () {
                notificationFallbackCallback(item)
              }, calculateFallbackTime(item))
            }
            resolve(res)
          })
          .catch((err) => reject(err))
        break
      case DamAssetType.Audio:
        audioUploadFinish(item, sha)
          .then((res) => {
            item.status = UploadQueueItemStatus.Processing
            if (envConfig.uploadStatusFallback) {
              item.notificationFallbackTimer = setTimeout(function () {
                notificationFallbackCallback(item)
              }, calculateFallbackTime(item))
            }
            resolve(res)
          })
          .catch((err) => reject(err))
        break
      case DamAssetType.Video:
        videoUploadFinish(item, sha)
          .then((res) => {
            item.status = UploadQueueItemStatus.Processing
            if (envConfig.uploadStatusFallback) {
              item.notificationFallbackTimer = setTimeout(function () {
                notificationFallbackCallback(item)
              }, calculateFallbackTime(item))
            }
            resolve(res)
          })
          .catch((err) => reject(err))
        break
      case DamAssetType.Document:
        documentUploadFinish(item, sha)
          .then((res) => {
            item.status = UploadQueueItemStatus.Processing
            if (envConfig.uploadStatusFallback) {
              item.notificationFallbackTimer = setTimeout(function () {
                notificationFallbackCallback(item)
              }, calculateFallbackTime(item))
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
      case DamAssetType.Image:
        imageUploadChunk(item, imageId, buffer, size, offset, onUploadProgressCallback)
          .then((res) => {
            resolve(res)
          })
          .catch((err) => {
            reject(err)
          })
        break
      case DamAssetType.Audio:
        audioUploadChunk(item, imageId, buffer, size, offset, onUploadProgressCallback)
          .then((res) => {
            resolve(res)
          })
          .catch((err) => {
            reject(err)
          })
        break
      case DamAssetType.Video:
        videoUploadChunk(item, imageId, buffer, size, offset, onUploadProgressCallback)
          .then((res) => {
            resolve(res)
          })
          .catch((err) => {
            reject(err)
          })
        break
      case DamAssetType.Document:
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
      case DamAssetType.Image:
        imageExternalProviderUpload(item)
          .then((res) => {
            resolve(res as UploadStartResponse)
          })
          .catch((err) => reject(err))
        break
      case DamAssetType.Audio:
        audioExternalProviderUpload(item)
          .then((res) => {
            resolve(res as UploadStartResponse)
          })
          .catch((err) => reject(err))

        break
      case DamAssetType.Video:
        videoExternalProviderUpload(item)
          .then((res) => {
            resolve(res as UploadStartResponse)
          })
          .catch((err) => reject(err))
        break
      case DamAssetType.Document:
        documentExternalProviderUpload(item)
          .then((res) => {
            resolve(res as UploadStartResponse)
          })
          .catch((err) => reject(err))
        break
    }
  })
}

export const unsetAssetSlot = (assetType: DamAssetType, fileId: DocId, assetId: DocId, slotName: string) => {
  return new Promise((resolve, reject) => {
    switch (assetType) {
      case DamAssetType.Image:
        imageUnsetSlot(fileId, assetId, slotName)
          .then((res) => {
            resolve(res)
          })
          .catch((err) => reject(err))
        break
      case DamAssetType.Audio:
        audioUnsetSlot(fileId, assetId, slotName)
          .then((res) => {
            resolve(res)
          })
          .catch((err) => reject(err))
        break
      case DamAssetType.Video:
        videoUnsetSlot(fileId, assetId, slotName)
          .then((res) => {
            resolve(res)
          })
          .catch((err) => reject(err))
        break
      case DamAssetType.Document:
        documentUnsetSlot(fileId, assetId, slotName)
          .then((res) => {
            resolve(res)
          })
          .catch((err) => reject(err))
        break
    }
  })
}

export const deleteFile = (assetType: DamAssetType, fileId: DocId) => {
  return new Promise((resolve, reject) => {
    switch (assetType) {
      case DamAssetType.Image:
        deleteImage(fileId)
          .then((res) => {
            resolve(res)
          })
          .catch((err) => reject(err))
        break
      case DamAssetType.Audio:
        deleteAudio(fileId)
          .then((res) => {
            resolve(res)
          })
          .catch((err) => reject(err))
        break
      case DamAssetType.Video:
        deleteVideo(fileId)
          .then((res) => {
            resolve(res)
          })
          .catch((err) => reject(err))
        break
      case DamAssetType.Document:
        deleteDocument(fileId)
          .then((res) => {
            resolve(res)
          })
          .catch((err) => reject(err))
        break
    }
  })
}

export const makeMainFile = (assetType: DamAssetType, fileId: DocId, assetId: DocId) => {
  return new Promise((resolve, reject) => {
    switch (assetType) {
      case DamAssetType.Image:
        imageMakeMainFile(fileId, assetId)
          .then((res) => {
            resolve(res)
          })
          .catch((err) => reject(err))
        break
      case DamAssetType.Audio:
        audioMakeMainFile(fileId, assetId)
          .then((res) => {
            resolve(res)
          })
          .catch((err) => reject(err))
        break
      case DamAssetType.Video:
        videoMakeMainFile(fileId, assetId)
          .then((res) => {
            resolve(res)
          })
          .catch((err) => reject(err))
        break
      case DamAssetType.Document:
        documentMakeMainFile(fileId, assetId)
          .then((res) => {
            resolve(res)
          })
          .catch((err) => reject(err))
        break
    }
  })
}

export const existingFileToSlot = (assetType: DamAssetType, fileId: DocId, assetId: DocId, slotName: string) => {
  return new Promise((resolve, reject) => {
    switch (assetType) {
      case DamAssetType.Image:
        existingImageToSlot(fileId, assetId, slotName)
          .then((res) => {
            resolve(res)
          })
          .catch((err) => reject(err))
        break
      case DamAssetType.Audio:
        existingAudioToSlot(fileId, assetId, slotName)
          .then((res) => {
            resolve(res)
          })
          .catch((err) => reject(err))
        break
      case DamAssetType.Video:
        existingVideoToSlot(fileId, assetId, slotName)
          .then((res) => {
            resolve(res)
          })
          .catch((err) => reject(err))
        break
      case DamAssetType.Document:
        existingDocumentToSlot(fileId, assetId, slotName)
          .then((res) => {
            resolve(res)
          })
          .catch((err) => reject(err))
        break
    }
  })
}

export const fileDownloadLink = (assetType: DamAssetType, fileId: DocId) => {
  return new Promise<FileDownloadLink>((resolve, reject) => {
    switch (assetType) {
      case DamAssetType.Image:
        imageDownloadLink(fileId)
          .then((res) => {
            resolve(res)
          })
          .catch((err) => reject(err))
        break
      case DamAssetType.Audio:
        audioDownloadLink(fileId)
          .then((res) => {
            resolve(res)
          })
          .catch((err) => reject(err))
        break
      case DamAssetType.Video:
        videoDownloadLink(fileId)
          .then((res) => {
            resolve(res)
          })
          .catch((err) => reject(err))
        break
      case DamAssetType.Document:
        documentDownloadLink(fileId)
          .then((res) => {
            resolve(res)
          })
          .catch((err) => reject(err))
        break
    }
  })
}
