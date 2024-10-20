import { useAssetDetailStore } from '@/stores/coreDam/assetDetailStore'
import type { DistributionCustomItem, DistributionJwItem, DistributionYoutubeItem } from '@/types/coreDam/Distribution'
import type { AssetFileProcessStatusType, DamDistributionServiceName } from '@anzusystems/common-admin'
import { AssetFileProcessStatus, type DocIdNullable } from '@anzusystems/common-admin'
import { ref } from 'vue'

const dialogKey = ref(1)
const dialogNew = ref(false)
const activeDistributionName = ref<DamDistributionServiceName | null>(null)
const showTabs = ref(false)
const redistributeMode = ref(false)
const assetFileId = ref<DocIdNullable>(null)
const assetFileStatus = ref<AssetFileProcessStatusType>(AssetFileProcessStatus.Processed)
const redistributeId = ref<DocIdNullable>(null)

export function useAssetDetailDistributionDialog() {
  const assetDetailStore = useAssetDetailStore()

  const forceReloadDialog = () => {
    dialogKey.value++
  }
  const openRedistribute = (item: DistributionJwItem | DistributionYoutubeItem | DistributionCustomItem) => {
    assetFileId.value = item.assetFileId
    activeDistributionName.value = item.distributionService
    redistributeId.value = item.id
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
    redistributeId.value = null
    showTabs.value = true
    redistributeMode.value = false
    forceReloadDialog()
    dialogNew.value = true
  }

  return {
    assetFileId,
    assetFileStatus,
    dialogKey,
    dialogNew,
    showTabs,
    activeDistributionName,
    redistributeMode,
    redistributeId,
    forceReloadDialog,
    openRedistribute,
    openNew,
  }
}
