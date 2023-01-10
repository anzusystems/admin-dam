import type { UploadQueueItem } from '@/types/dam/UploadQueue'
import type { DocId } from '@/types/common'
import {
  uploadChunk as imageUploadChunk,
  uploadFinish as imageUploadFinish,
  uploadStart as imageUploadStart,
  externalProviderUpload as imageExternalProviderUpload,
} from '@/services/api/dam/imageApi'
import {
  uploadChunk as audioUploadChunk,
  uploadFinish as audioUploadFinish,
  uploadStart as audioUploadStart,
  externalProviderUpload as audioExternalProviderUpload,
} from '@/services/api/dam/audioApi'
import {
  uploadChunk as videoUploadChunk,
  uploadFinish as videoUploadFinish,
  uploadStart as videoUploadStart,
  externalProviderUpload as videoExternalProviderUpload,
} from '@/services/api/dam/videoApi'
import {
  uploadChunk as documentUploadChunk,
  uploadFinish as documentUploadFinish,
  uploadStart as documentUploadStart,
  externalProviderUpload as documentExternalProviderUpload,
} from '@/services/api/dam/documentApi'
import { AssetType } from '@/model/dam/valueObject/AssetType'
import { QueueItemStatus } from '@/types/dam/UploadQueue'

interface UploadStartResponse {
  id: DocId
  asset: DocId
}

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

export const uploadFinish = (item: UploadQueueItem, sha: string) => {
  return new Promise((resolve, reject) => {
    switch (item.assetType) {
      case AssetType.Image:
        imageUploadFinish(item, sha)
          .then((res) => {
            item.status = QueueItemStatus.Processing
            resolve(res)
          })
          .catch((err) => reject(err))
        break
      case AssetType.Audio:
        audioUploadFinish(item, sha)
          .then((res) => {
            item.status = QueueItemStatus.Processing
            resolve(res)
          })
          .catch((err) => reject(err))
        break
      case AssetType.Video:
        videoUploadFinish(item, sha)
          .then((res) => {
            item.status = QueueItemStatus.Processing
            resolve(res)
          })
          .catch((err) => reject(err))
        break
      case AssetType.Document:
        documentUploadFinish(item, sha)
          .then((res) => {
            item.status = QueueItemStatus.Processing
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
