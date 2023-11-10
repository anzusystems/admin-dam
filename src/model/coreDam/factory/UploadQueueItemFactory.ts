import {
  AssetFileFailReason,
  type IntegerId,
  type UploadQueueItem,
  type UploadQueueItemStatus,
  type UploadQueueItemType
} from '@anzusystems/common-admin'
import { DamAssetStatus } from '@/model/coreDam/valueObject/DamAssetStatus'
import type { DamAssetType } from '@/model/coreDam/valueObject/DamAssetType'

export function useUploadQueueItemFactory() {
  const createDefault = (
    key: string,
    type: UploadQueueItemType,
    status: UploadQueueItemStatus,
    assetType: DamAssetType,
    chunkSize: number,
    licenceId: IntegerId
  ): UploadQueueItem => {
    return {
      key: key,
      type: type,
      file: null,
      status: status,
      isDuplicate: false,
      duplicateAssetId: null,
      assetType: assetType,
      assetStatus: DamAssetStatus.Default,
      displayTitle: '',
      assetId: null,
      fileId: null,
      externalProviderAssetId: null,
      externalProviderName: null,
      externalProviderMetadata: {},
      keywords: [],
      authors: [],
      authorConflicts: [],
      customData: {},
      chunks: [],
      chunkSize: chunkSize,
      currentChunkIndex: 0,
      chunkTotalCount: 0,
      licenceId: licenceId,
      imagePreview: undefined,
      progress: {
        remainingTime: null,
        progressPercent: null,
        speed: null,
      },
      canEditMetadata: false,
      error: {
        hasError: false,
        message: '',
        assetFileFailReason: AssetFileFailReason.Default,
      },
      notificationFallbackTimer: undefined,
      notificationFallbackTry: 1,
      slotName: null,
    }
  }

  return {
    createDefault,
  }
}
