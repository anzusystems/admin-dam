import type { DocId, DocIdNullable } from '@anzusystems/common-admin'
import type { TtsAsset } from '@/types/coreDam/TtsNarrationRequest'

export interface TtsAssetDetail {
  assetId: DocId
  tts: TtsAsset | null
  lastRequestId: DocIdNullable
  podcastIds: DocId[]
}
