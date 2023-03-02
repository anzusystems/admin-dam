import { ref } from 'vue'
import type { DistributionServiceName } from '@/types/coreDam/DamConfig'
import type { DistributionCustomItem, DistributionJwItem, DistributionYoutubeItem } from '@/types/coreDam/Distribution'
import type { DocIdNullable } from '@anzusystems/common-admin'
import { useAssetDetailStore } from '@/stores/coreDam/assetDetailStore'

const dialogKey = ref(1)
const dialogNew = ref(false)
const activeDistributionName = ref<DistributionServiceName | null>(null)
const showTabs = ref(false)
const redistributeMode = ref(false)
const assetFileId = ref<DocIdNullable>(null)

export function useAssetDetailDistributionDialog() {
  const assetDetailStore = useAssetDetailStore()

  const forceReloadDialog = () => {
    dialogKey.value++
  }
  const openRedistribute = (item: DistributionJwItem | DistributionYoutubeItem | DistributionCustomItem) => {
    assetFileId.value = item.assetFileId
    activeDistributionName.value = item.distributionService
    showTabs.value = false
    redistributeMode.value = true
    forceReloadDialog()
    dialogNew.value = true
  }

  const openNew = () => {
    if (assetDetailStore.asset && assetDetailStore.asset.mainFile) {
      assetFileId.value = assetDetailStore.asset.mainFile.id
    }
    activeDistributionName.value = null
    showTabs.value = true
    redistributeMode.value = false
    forceReloadDialog()
    dialogNew.value = true
  }

  return {
    assetFileId,
    dialogKey,
    dialogNew,
    showTabs,
    activeDistributionName,
    redistributeMode,
    forceReloadDialog,
    openRedistribute,
    openNew,
  }
}
