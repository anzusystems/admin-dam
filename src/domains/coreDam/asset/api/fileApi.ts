import {
  DamAssetType,
  HTTP_STATUS_CREATED,
  UploadQueueItemStatus,
  damFileUploadChunk,
  damFileUploadFinish,
  damFileUploadStart,
  isUndefined,
} from '@anzusystems/common-admin'
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
  makeMainFile as audioMakeMainFile,
  makePrivate as audioMakePrivate,
  makePublic as audioMakePublic,
  unsetSlot as audioUnsetSlot,
  deleteAudio,
  existingAudioToSlot,
} from '@/domains/coreDam/asset/api/audioApi'
import {
  deleteDocument,
  downloadLink as documentDownloadLink,
  makeMainFile as documentMakeMainFile,
  makePrivate as documentMakePrivate,
  makePublic as documentMakePublic,
  unsetSlot as documentUnsetSlot,
  existingDocumentToSlot,
} from '@/domains/coreDam/asset/api/documentApi'
import {
  deleteImage,
  existingImageToSlot,
  downloadLink as imageDownloadLink,
  makeMainFile as imageMakeMainFile,
  makePrivate as imageMakePrivate,
  makePublic as imageMakePublic,
  unsetSlot as imageUnsetSlot,
} from '@/domains/coreDam/asset/api/imageApi'
import {
  deleteVideo,
  existingVideoToSlot,
  downloadLink as videoDownloadLink,
  makeMainFile as videoMakeMainFile,
  unsetSlot as videoUnsetSlot,
} from '@/domains/coreDam/asset/api/videoApi'
import { damClient } from '@/shared/apiClients/damClient'

const UPLOAD_END_POINT: Partial<Record<DamAssetTypeType, string>> = {
  [DamAssetType.Image]: '/adm/v1/image',
  [DamAssetType.Audio]: '/adm/v1/audio',
  [DamAssetType.Video]: '/adm/v1/video',
  [DamAssetType.Document]: '/adm/v1/document',
}

// Every request below rejects on a type it does not cover: the promise would otherwise never settle.
const toEndPoint = <T>(item: UploadQueueItem, send: (endPoint: string) => Promise<T>) => {
  const endPoint = UPLOAD_END_POINT[item.assetType]
  if (isUndefined(endPoint)) return Promise.reject(new Error(`fileApi: unsupported asset type '${item.assetType}'`))

  return send(endPoint)
}

export const uploadStart = (item: UploadQueueItem) =>
  toEndPoint(item, (endPoint) => damFileUploadStart(damClient, endPoint, item) as Promise<DamUploadStartResponse>)

/* Only if nothing has settled the item meanwhile: the notification can beat the finish response, and
 * `Processing` written over `Uploaded` would put a settled row back among the waiting ones. */
function startProcessing(item: UploadQueueItem) {
  if (item.status !== UploadQueueItemStatus.Uploading) return
  item.status = UploadQueueItemStatus.Processing
}

export const uploadFinish = (item: UploadQueueItem, sha: string) =>
  toEndPoint(item, async (endPoint) => {
    const res = await damFileUploadFinish(damClient, endPoint, item, sha)
    startProcessing(item)

    return res
  })

// Sent as the library sends it: checked first, reported to Sentry, and with no type named, so the browser sets it.
export const uploadChunk = (
  item: UploadQueueItem,
  fileId: DocId,
  buffer: Blob,
  size: number,
  offset: number,
  onUploadProgressCallback: ((progressEvent: AxiosProgressEvent) => void) | undefined
) =>
  toEndPoint(item, (endPoint) =>
    damFileUploadChunk(damClient, endPoint, item, fileId, buffer, size, offset, onUploadProgressCallback)
  )

export const externalProviderUpload = (item: UploadQueueItem) =>
  toEndPoint(item, (endPoint) =>
    damClient()
      .post(
        endPoint + '/licence/' + item.licenceId + '/external-provider',
        JSON.stringify({
          id: item.externalProviderAssetId,
          externalProvider: item.externalProviderName,
        })
      )
      .then((res) => {
        if (res.status !== HTTP_STATUS_CREATED) return Promise.reject()

        return res.data as DamUploadStartResponse
      })
  )

export const unsetAssetSlot = (assetType: DamAssetTypeType, fileId: DocId, assetId: DocId, slotName: string) =>
  new Promise((resolve, reject) => {
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

export const deleteFile = (assetType: DamAssetTypeType, fileId: DocId) =>
  new Promise((resolve, reject) => {
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

export const makeMainFile = (assetType: DamAssetTypeType, fileId: DocId, assetId: DocId) =>
  new Promise((resolve, reject) => {
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

export const existingFileToSlot = (assetType: DamAssetTypeType, fileId: DocId, assetId: DocId, slotName: string) =>
  new Promise((resolve, reject) => {
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

export const fileDownloadLink = (assetType: DamAssetTypeType, fileId: DocId) =>
  new Promise<AssetFileDownloadLink>((resolve, reject) => {
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

export const makePublicFile = (assetType: DamAssetTypeType, assetFileId: DocId, slug: string) =>
  new Promise<AssetFileRoute>((resolve, reject) => {
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

export const makePrivateFile = (assetType: DamAssetTypeType, assetFileId: DocId) =>
  new Promise<void>((resolve, reject) => {
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
