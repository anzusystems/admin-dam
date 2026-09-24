import { useAssetListViewFactory } from '@/domains/coreDam/assetListView/factory/AssetListViewFactory'
import type { AssetListView } from '@/domains/coreDam/assetListView/types/AssetListView'

export const useAssetListViewOneStore = defineStore('assetListViewOneStore', () => {
  const { createDefault } = useAssetListViewFactory()

  const assetListView = ref<AssetListView>(createDefault())

  function reset() {
    assetListView.value = createDefault()
  }

  return {
    assetListView,
    reset,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAssetListViewOneStore, import.meta.hot))
}
