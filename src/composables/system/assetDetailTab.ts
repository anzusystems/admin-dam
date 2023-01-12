import { ref } from 'vue'

export enum AssetDetailTab {
  Info = 'meta',
  ROI = 'roi',
  Distribution = 'distribution',
  Podcast = 'podcast',
  Slots = 'slots',
  Default = Info,
}

const activeTab = ref<AssetDetailTab>(AssetDetailTab.Default)

export function useAssetDetailTab() {
  return {
    activeTab,
  }
}
