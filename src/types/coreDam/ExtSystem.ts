import type { DamExtSystem, DocIdNullable } from '@anzusystems/common-admin'
import type { TtsActiveProviderModeType } from '@/types/coreDam/TtsActiveProviderMode'

export interface ExtSystemTtsSettings {
  activeProviderMode: TtsActiveProviderModeType
  defaultVoiceFamilyId: DocIdNullable
  autoKeywordId: DocIdNullable
}

export interface ExtSystem extends DamExtSystem {
  ttsSettings: ExtSystemTtsSettings
  ttsFreeAudioEpilogAsset: DocIdNullable
}
