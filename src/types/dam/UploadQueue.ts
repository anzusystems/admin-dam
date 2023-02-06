import type { DocId, DocIdNullable, IntegerId } from '@anzusystems/common-admin'
import type { Link } from '@/types/dam/File'
import type { AssetStatus } from '@/model/dam/valueObject/AssetStatus'
import type { AssetType } from '@/model/dam/valueObject/AssetType'
import type { CancelTokenSource } from 'axios'
import type { AssetExternalProviderIdNullable, AssetExternalProviderMetadata } from '@/types/dam/AssetExternalProvider'

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
  keywordSuggestions: Record<string, Array<string>>
  authorSuggestions: Record<string, Array<string>>
  progress: {
    remainingTime: null | number
    progressPercent: null | number
  }
  error: {
    hasError: boolean
    message: string
  }
  notificationFallbackTimer: ReturnType<typeof setTimeout> | undefined
  slotName: string | null
}

export interface UploadQueue {
  items: UploadQueueItem[]
  totalCount: number
  processedCount: number
  fileInputKey: number // used to reset html input file element
}
