import { ref } from 'vue'

export enum VideoShowDetailTab {
  Detail = 'detail',
  Episodes = 'episodes',
  Default = Episodes,
}

const activeTab = ref<VideoShowDetailTab>(VideoShowDetailTab.Default)

export function useVideoShowDetailTab() {
  return {
    activeTab,
  }
}
