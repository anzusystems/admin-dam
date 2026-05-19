import type { DamExtSystem, DocIdNullable } from '@anzusystems/common-admin'
import type { TtsActiveProviderMode } from '@/types/coreDam/TtsActiveProviderMode'

export interface ExtSystemTtsSettings {
  autoPodcastId: DocIdNullable
  recommendedPodcastId: DocIdNullable
  activeProviderMode: TtsActiveProviderMode
}

export interface ExtSystem extends DamExtSystem {
  ttsSettings: ExtSystemTtsSettings
}
