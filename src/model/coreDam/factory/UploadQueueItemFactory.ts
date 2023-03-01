import type { UploadQueueItem } from '@/types/coreDam/UploadQueue'
import type { QueueItemStatus, QueueItemType } from '@/types/coreDam/UploadQueue'
import { AssetFileFailReason } from '@/model/coreDam/valueObject/AssetFileFailReason'
import { AssetStatus } from '@/model/coreDam/valueObject/AssetStatus'
import type { AssetType } from '@/model/coreDam/valueObject/AssetType'
import type { IntegerId } from '@anzusystems/common-admin'

export function useUploadQueueItemFactory() {
  const createDefault = (
    key: string,
    type: QueueItemType,
    status: QueueItemStatus,
    assetType: AssetType,
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
      assetStatus: AssetStatus.Default,
      displayTitle: '',
      assetId: null,
      fileId: null,
      externalProviderAssetId: null,
      externalProviderName: null,
      externalProviderMetadata: {},
      keywords: [],
      authors: [],
      keywordSuggestions: {},
      authorSuggestions: {},
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
