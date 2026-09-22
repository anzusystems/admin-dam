import type { DamExtSystem, DocIdNullable } from '@anzusystems/common-admin'
import type { TtsActiveProviderModeType } from '@/domains/coreDam/ttsNarrationRequest/types/TtsActiveProviderMode'

export interface ExtSystemTtsSettings {
  activeProviderMode: TtsActiveProviderModeType
  defaultVoiceFamilyId: DocIdNullable
  autoKeywordId: DocIdNullable
}

export interface ExtSystem extends DamExtSystem {
  ttsSettings: ExtSystemTtsSettings
  ttsFreeAudioEpilogAsset: DocIdNullable
}
