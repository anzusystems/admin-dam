import type { DamExtSystem, DocIdNullable, IntegerIdNullable } from '@anzusystems/common-admin'
import type { TtsActiveProviderMode } from '@/types/coreDam/TtsActiveProviderMode'

export interface ExtSystemTtsSettings {
  activeProviderMode: TtsActiveProviderMode
  defaultVoiceFamilyId: DocIdNullable
  autoKeywordId: DocIdNullable
}

export interface ExtSystem extends DamExtSystem {
  ttsSettings: ExtSystemTtsSettings
  ttsDefaultAssetLicence: IntegerIdNullable
  ttsFreeAudioEpilogAsset: DocIdNullable
}
