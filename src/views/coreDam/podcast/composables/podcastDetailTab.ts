import { ref } from 'vue'

export enum PodcastDetailTab {
  Detail = 'detail',
  Episodes = 'episodes',
  Default = Detail,
}

const activeTab = ref<PodcastDetailTab>(PodcastDetailTab.Default)

export function usePodcastDetailTab() {
  return {
    activeTab,
  }
}
