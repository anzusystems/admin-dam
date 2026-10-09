import { DamAssetType, UploadQueueItemStatus } from '@anzusystems/common-admin'
import type {
  AssetFileDownloadLink,
  AssetFileRoute,
  DamAssetTypeType,
  DamUploadStartResponse,
  DocId,
  UploadQueueItem,
} from '@anzusystems/common-admin'
import type { AxiosProgressEvent } from 'axios'

import {
  downloadLink as audioDownloadLink,
  externalProviderUpload as audioExternalProviderUpload,
  makeMainFile as audioMakeMainFile,
  makePrivate as audioMakePrivate,
  makePublic as audioMakePublic,
  unsetSlot as audioUnsetSlot,
  uploadChunk as audioUploadChunk,
  uploadFinish as audioUploadFinish,
  uploadStart as audioUploadStart,
  deleteAudio,
  existingAudioToSlot,
} from '@/domains/coreDam/asset/api/audioApi'
import {
  deleteDocument,
  downloadLink as documentDownloadLink,
  externalProviderUpload as documentExternalProviderUpload,
  makeMainFile as documentMakeMainFile,
  makePrivate as documentMakePrivate,
  makePublic as documentMakePublic,
  unsetSlot as documentUnsetSlot,
  uploadChunk as documentUploadChunk,
  uploadFinish as documentUploadFinish,
  uploadStart as documentUploadStart,
  existingDocumentToSlot,
} from '@/domains/coreDam/asset/api/documentApi'
import {
  deleteImage,
  existingImageToSlot,
  downloadLink as imageDownloadLink,
  externalProviderUpload as imageExternalProviderUpload,
  makeMainFile as imageMakeMainFile,
  makePrivate as imageMakePrivate,
  makePublic as imageMakePublic,
  unsetSlot as imageUnsetSlot,
  uploadChunk as imageUploadChunk,
  uploadFinish as imageUploadFinish,
  uploadStart as imageUploadStart,
} from '@/domains/coreDam/asset/api/imageApi'
import {
  deleteVideo,
  existingVideoToSlot,
  downloadLink as videoDownloadLink,
  externalProviderUpload as videoExternalProviderUpload,
  makeMainFile as videoMakeMainFile,
  unsetSlot as videoUnsetSlot,
  uploadChunk as videoUploadChunk,
  uploadFinish as videoUploadFinish,
  uploadStart as videoUploadStart,
} from '@/domains/coreDam/asset/api/videoApi'

// Every switch below rejects on a type it does not cover: the promise would otherwise never settle.
export const uploadStart: (item: UploadQueueItem) => Promise<DamUploadStartResponse> = (item: UploadQueueItem) => {
  return new Promise((resolve, reject) => {
    switch (item.assetType) {
      case DamAssetType.Image:
        imageUploadStart(item)
          .then((res) => {
            resolve(res as DamUploadStartResponse)
          })
          .catch((err) => reject(err))
        break
      case DamAssetType.Audio:
        audioUploadStart(item)
          .then((res) => {
            resolve(res as DamUploadStartResponse)
          })
          .catch((err) => reject(err))
        break
      case DamAssetType.Video:
        videoUploadStart(item)
          .then((res) => {
            resolve(res as DamUploadStartResponse)
          })
          .catch((err) => reject(err))
        break
      case DamAssetType.Document:
        documentUploadStart(item)
          .then((res) => {
            resolve(res as DamUploadStartResponse)
          })
          .catch((err) => reject(err))
        break
      default:
        reject(new Error(`fileApi: unsupported asset type '${item.assetType}'`))
    }
  })
}

/* Only if nothing has settled the item meanwhile: the notification can beat the finish response, and
 * `Processing` written over `Uploaded` would put a settled row back among the waiting ones. */
function startProcessing(item: UploadQueueItem) {
  if (item.status !== UploadQueueItemStatus.Uploading) return
  item.status = UploadQueueItemStatus.Processing
}

export const uploadFinish = (item: UploadQueueItem, sha: string) => {
  return new Promise((resolve, reject) => {
    switch (item.assetType) {
      case DamAssetType.Image:
        imageUploadFinish(item, sha)
          .then((res) => {
            startProcessing(item)
            resolve(res)
          })
          .catch((err) => reject(err))
        break
      case DamAssetType.Audio:
        audioUploadFinish(item, sha)
          .then((res) => {
            startProcessing(item)
            resolve(res)
          })
          .catch((err) => reject(err))
        break
      case DamAssetType.Video:
        videoUploadFinish(item, sha)
          .then((res) => {
            startProcessing(item)
            resolve(res)
          })
          .catch((err) => reject(err))
        break
      case DamAssetType.Document:
        documentUploadFinish(item, sha)
          .then((res) => {
            startProcessing(item)
            resolve(res)
          })
          .catch((err) => reject(err))
        break
      default:
        reject(new Error(`fileApi: unsupported asset type '${item.assetType}'`))
    }
  })
}

export const uploadChunk = (
  item: UploadQueueItem,
  imageId: DocId,
  buffer: string,
  size: number,
  offset: number,
  onUploadProgressCallback: ((progressEvent: AxiosProgressEvent) => void) | undefined
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
      default:
        // An uncovered type would hang the chunk loop, and with it one of the two slots.
        reject(new Error(`fileApi: unsupported asset type '${item.assetType}'`))
    }
  })
}

export const externalProviderUpload: (item: UploadQueueItem) => Promise<DamUploadStartResponse> = (
  item: UploadQueueItem
) => {
  return new Promise((resolve, reject) => {
    switch (item.assetType) {
      case DamAssetType.Image:
        imageExternalProviderUpload(item)
          .then((res) => {
            resolve(res as DamUploadStartResponse)
          })
          .catch((err) => reject(err))
        break
      case DamAssetType.Audio:
        audioExternalProviderUpload(item)
          .then((res) => {
            resolve(res as DamUploadStartResponse)
          })
          .catch((err) => reject(err))

        break
      case DamAssetType.Video:
        videoExternalProviderUpload(item)
          .then((res) => {
            resolve(res as DamUploadStartResponse)
          })
          .catch((err) => reject(err))
        break
      case DamAssetType.Document:
        documentExternalProviderUpload(item)
          .then((res) => {
            resolve(res as DamUploadStartResponse)
          })
          .catch((err) => reject(err))
        break
      default:
        reject(new Error(`fileApi: unsupported asset type '${item.assetType}'`))
    }
  })
}

export const unsetAssetSlot = (assetType: DamAssetTypeType, fileId: DocId, assetId: DocId, slotName: string) => {
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
      default:
        reject(new Error(`fileApi: unsupported asset type '${assetType}'`))
    }
  })
}

export const deleteFile = (assetType: DamAssetTypeType, fileId: DocId) => {
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
      default:
        reject(new Error(`fileApi: unsupported asset type '${assetType}'`))
    }
  })
}

export const makeMainFile = (assetType: DamAssetTypeType, fileId: DocId, assetId: DocId) => {
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
      default:
        reject(new Error(`fileApi: unsupported asset type '${assetType}'`))
    }
  })
}

export const existingFileToSlot = (assetType: DamAssetTypeType, fileId: DocId, assetId: DocId, slotName: string) => {
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
      default:
        reject(new Error(`fileApi: unsupported asset type '${assetType}'`))
    }
  })
}

export const fileDownloadLink = (assetType: DamAssetTypeType, fileId: DocId) => {
  return new Promise<AssetFileDownloadLink>((resolve, reject) => {
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
      default:
        reject(new Error(`fileApi: unsupported asset type '${assetType}'`))
    }
  })
}

export const makePublicFile = (assetType: DamAssetTypeType, assetFileId: DocId, slug: string) => {
  return new Promise<AssetFileRoute>((resolve, reject) => {
    switch (assetType) {
      case DamAssetType.Image:
        imageMakePublic(assetFileId)
          .then((res) => {
            resolve(res)
          })
          .catch((err) => reject(err))
        break
      case DamAssetType.Audio:
        audioMakePublic(assetFileId, slug)
          .then((res) => {
            resolve(res)
          })
          .catch((err) => reject(err))
        break
      case DamAssetType.Document:
        documentMakePublic(assetFileId, slug)
          .then((res) => {
            resolve(res)
          })
          .catch((err) => reject(err))
        break
      default:
        reject(new Error(`fileApi: unsupported asset type '${assetType}'`))
    }
  })
}

export const makePrivateFile = (assetType: DamAssetTypeType, assetFileId: DocId) => {
  return new Promise<AssetFileRoute>((resolve, reject) => {
    switch (assetType) {
      case DamAssetType.Image:
        imageMakePrivate(assetFileId)
          .then((res) => {
            resolve(res)
          })
          .catch((err) => reject(err))
        break
      case DamAssetType.Audio:
        audioMakePrivate(assetFileId)
          .then((res) => {
            resolve(res)
          })
          .catch((err) => reject(err))
        break
      case DamAssetType.Document:
        documentMakePrivate(assetFileId)
          .then((res) => {
            resolve(res)
          })
          .catch((err) => reject(err))
        break
      default:
        reject(new Error(`fileApi: unsupported asset type '${assetType}'`))
    }
  })
}
