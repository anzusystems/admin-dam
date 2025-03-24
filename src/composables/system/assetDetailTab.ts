import { ref } from 'vue'

export const AssetDetailTab = {
  Info: 'meta',
  ROI: 'roi',
  Distribution: 'distribution',
  Podcast: 'podcast',
  VideoShow: 'videoShow',
  Slots: 'slots',
  ImagePreview: 'imagePreview',
} as const

export type AssetDetailTabType = (typeof AssetDetailTab)[keyof typeof AssetDetailTab]
export const AssetDetailTabDefault = AssetDetailTab.Info

const activeTab = ref<AssetDetailTabType>(AssetDetailTabDefault)

export function useAssetDetailTab() {
  return {
    activeTab,
  }
}
