import { ref } from 'vue'

export const PodcastDetailTab = {
  Detail: 'detail',
  Episodes: 'episodes',
} as const

export type PodcastDetailTabType = (typeof PodcastDetailTab)[keyof typeof PodcastDetailTab]
export const PodcastDetailTabDefault = PodcastDetailTab.Episodes

const activeTab = ref<PodcastDetailTabType>(PodcastDetailTabDefault)

export function usePodcastDetailTab() {
  return {
    activeTab,
  }
}
