import { fetchAsset } from '@/domains/coreDam/asset/api/assetApi'
import {
  deleteAudio,
  downloadLink as audioDownloadLink,
  existingAudioToSlot,
  externalProviderUpload as audioExternalProviderUpload,
  makeMainFile as audioMakeMainFile,
  makePrivate as audioMakePrivate,
  makePublic as audioMakePublic,
  unsetSlot as audioUnsetSlot,
  uploadChunk as audioUploadChunk,
  uploadFinish as audioUploadFinish,
  uploadStart as audioUploadStart,
} from '@/domains/coreDam/asset/api/audioApi'
import {
  deleteDocument,
  downloadLink as documentDownloadLink,
  existingDocumentToSlot,
  externalProviderUpload as documentExternalProviderUpload,
  makeMainFile as documentMakeMainFile,
  makePrivate as documentMakePrivate,
  makePublic as documentMakePublic,
  unsetSlot as documentUnsetSlot,
  uploadChunk as documentUploadChunk,
  uploadFinish as documentUploadFinish,
  uploadStart as documentUploadStart,
} from '@/domains/coreDam/asset/api/documentApi'
import {
  deleteImage,
  downloadLink as imageDownloadLink,
  existingImageToSlot,
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
  downloadLink as videoDownloadLink,
  existingVideoToSlot,
  externalProviderUpload as videoExternalProviderUpload,
  makeMainFile as videoMakeMainFile,
  unsetSlot as videoUnsetSlot,
  uploadChunk as videoUploadChunk,
  uploadFinish as videoUploadFinish,
  uploadStart as videoUploadStart,
} from '@/domains/coreDam/asset/api/videoApi'
import { envConfig } from '@/shared/EnvConfigService'
import { useUploadQueuesStore } from '@/domains/coreDam/asset/store/uploadQueuesStore'
import type { AssetFileDownloadLink, DamAssetTypeType } from '@anzusystems/common-admin'
import {
  AssetFileProcessStatus,
  i18n,
  type AssetFileRoute,
  DamAssetType,
  type DamUploadStartResponse,
  UploadQueueItemType,
  type UploadQueueItem,
  type UploadQueueItemStatusType,
  UploadQueueItemStatus,
} from '@anzusystems/common-admin'
import type { AxiosProgressEvent } from 'axios'

const NOTIFICATION_FALLBACK_TIMER_CHECK_SECONDS = 10
const NOTIFICATION_FALLBACK_MAX_TRIES = 3

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

function calculateFallbackTime(item: UploadQueueItem) {
  return NOTIFICATION_FALLBACK_TIMER_CHECK_SECONDS * 1000 * item.notificationFallbackTry * item.notificationFallbackTry
}

// Stopped and failed too: checking only `Uploaded` kept polling for a cancelled item.
const isSettled = (status: UploadQueueItemStatusType) =>
  status === UploadQueueItemStatus.Uploaded ||
  status === UploadQueueItemStatus.Stop ||
  status === UploadQueueItemStatus.Failed

async function notificationFallbackCallback(item: UploadQueueItem) {
  clearTimeout(item.notificationFallbackTimer)
  if (isSettled(item.status)) return
  if (item.notificationFallbackTry > NOTIFICATION_FALLBACK_MAX_TRIES) {
    // Said out loud rather than given up on in silence.
    item.error.hasError = true
    const { t } = i18n.global || i18n
    // The slot row has only Cancel, so it must not be sent looking for a refresh button.
    item.error.message = t(
      item.type === UploadQueueItemType.SlotFile
        ? 'system.uploadErrors.processingTooLongSlot'
        : 'system.uploadErrors.processingTooLong'
    )

    return
  }
  if (!item.assetId) return
  let asset: Awaited<ReturnType<typeof fetchAsset>> | undefined = undefined
  try {
    asset = await fetchAsset(item.assetId)
  } catch (error) {
    // One failed request must not end the chain: the rejection skipped the reschedule below.
    console.error('notificationFallback: asset fetch failed', error)
  }
  // Only when the main file is this item's: a slot posts to its own and would read the wrong one.
  const isOurFile = asset?.mainFile && (isNull(item.fileId) || asset.mainFile.id === item.fileId)
  if (asset && asset.mainFile && isOurFile && asset.mainFile.fileAttributes) {
    const uploadQueuesStore = useUploadQueuesStore()
    if (asset.mainFile.fileAttributes.status === AssetFileProcessStatus.Processed) {
      uploadQueuesStore.queueItemProcessed(asset.id, item.fileId)
      return
    } else if (asset.mainFile.fileAttributes.status === AssetFileProcessStatus.Duplicate) {
      uploadQueuesStore.queueItemDuplicate(asset.id, null, null, item.fileId)
      return
    } else if (asset.mainFile.fileAttributes.status === AssetFileProcessStatus.Failed) {
      uploadQueuesStore.queueItemFailed(asset.id, asset.mainFile.fileAttributes.failReason, item.fileId)
      return
    }
  }
  // Again after the fetch: a stop during it used to schedule the next attempt anyway.
  if (isSettled(item.status)) return
  item.notificationFallbackTry++
  item.notificationFallbackTimer = setTimeout(function () {
    notificationFallbackCallback(item)
  }, calculateFallbackTime(item))
}

/* Exported for the external-provider import: its item carries no ids until the import responds, so
 * a notification that wins that race matches nothing and is gone, and nothing else would settle it -
 * hence not behind `uploadStatusFallback`, unlike the one `startProcessing` arms. */
export const armNotificationFallback = (item: UploadQueueItem) => {
  if (item.status !== UploadQueueItemStatus.Processing) return
  clearTimeout(item.notificationFallbackTimer)
  item.notificationFallbackTimer = setTimeout(function () {
    notificationFallbackCallback(item)
  }, calculateFallbackTime(item))
}

/* Only if nothing has settled the item meanwhile: the notification can beat the finish response,
 * and `Processing` written over `Uploaded` waits for a notification that has already been - where
 * no fallback is armed, or it cannot identify the file, for good. */
function startProcessing(item: UploadQueueItem) {
  if (item.status !== UploadQueueItemStatus.Uploading) return
  item.status = UploadQueueItemStatus.Processing
  if (envConfig.uploadStatusFallback) armNotificationFallback(item)
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
