import { ref } from 'vue'

export const VideoShowDetailTab = {
  Detail: 'detail',
  Episodes: 'episodes',
} as const

export type VideoShowDetailTabType = (typeof VideoShowDetailTab)[keyof typeof VideoShowDetailTab]
export const VideoShowDetailTabDefault = VideoShowDetailTab.Episodes

const activeTab = ref<VideoShowDetailTabType>(VideoShowDetailTabDefault)

export function useVideoShowDetailTab() {
  return {
    activeTab,
  }
}
