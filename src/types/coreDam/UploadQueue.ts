import type { DocId, DocIdNullable, IntegerId } from '@anzusystems/common-admin'
import type { Link } from '@/types/coreDam/File'
import type { AssetStatus } from '@/model/coreDam/valueObject/AssetStatus'
import type { AssetType } from '@/model/coreDam/valueObject/AssetType'
import type { CancelTokenSource } from 'axios'
import type {
  AssetExternalProviderIdNullable,
  AssetExternalProviderMetadata,
} from '@/types/coreDam/AssetExternalProvider'
import type { AssetFileFailReason } from '@/model/coreDam/valueObject/AssetFileFailReason'

export enum QueueItemType {
  File = 'file',
  Asset = 'asset',
  ExternalProviderAsset = 'externalProviderAsset',
  SlotFile = 'slotFile',
}

export enum QueueItemStatus {
  Loading = 'loading', // loading additional api data
  Waiting = 'waiting', // waiting to be uploaded
  Uploading = 'uploading', // uploading right now
  Processing = 'processing', // all data sent by FE, server processing, waiting for notification, todo
  Failed = 'failed', // any error
  Uploaded = 'uploaded', // uploaded/ready after loading
  Stop = 'stop', // after hitting stop upload
}

export interface UploadQueueItemChunk {
  cancelTokenSource: CancelTokenSource
}

export interface UploadQueueItem {
  key: string
  file: File | null
  status: QueueItemStatus
  assetStatus: AssetStatus
  isDuplicate: boolean
  type: QueueItemType
  assetType: AssetType
  displayTitle: string
  assetId: DocIdNullable
  duplicateAssetId: DocIdNullable
  fileId: DocIdNullable
  externalProviderAssetId: AssetExternalProviderIdNullable
  externalProviderName: string | null
  externalProviderMetadata: AssetExternalProviderMetadata
  chunks: UploadQueueItemChunk[]
  chunkSize: number
  currentChunkIndex: number
  chunkTotalCount: number
  licenceId: IntegerId
  imagePreview?: Link
  canEditMetadata: boolean
  keywords: DocId[]
  authors: DocId[]
  customData: any
  authorConflicts: DocId[]
  progress: {
    remainingTime: null | number
    progressPercent: null | number
    speed: null | number
  }
  error: {
    hasError: boolean
    message: string
    assetFileFailReason: AssetFileFailReason
  }
  notificationFallbackTimer: ReturnType<typeof setTimeout> | undefined
  notificationFallbackTry: number
  slotName: string | null
}

export interface UploadQueue {
  items: UploadQueueItem[]
  totalCount: number
  processedCount: number
  fileInputKey: number // used to reset html input file element

  suggestions: {
    newKeywordNames: Set<string>
    newAuthorNames: Set<string>
  }
}
