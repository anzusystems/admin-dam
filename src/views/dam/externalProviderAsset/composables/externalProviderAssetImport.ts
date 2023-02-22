import { useExternalProviderAssetDetailStore } from '@/stores/dam/externalProviderAssetDetailStore'
import { useUploadQueuesStore } from '@/stores/dam/uploadQueuesStore'
import { QUEUE_ID_MASS_EDIT, QUEUE_ID_UPLOAD_GLOBAL } from '@/services/upload/uploadQueueIds'
import { useExternalProviderAssetListStore } from '@/stores/dam/externalProviderAssetListStore'
import { isNull } from '@/utils/common'
import type { AssetExternalProviderId, AssetExternalProviderListDto } from '@/types/dam/AssetExternalProvider'
import { useExternalProviderAssetFooterSelectedView } from '@/composables/system/externalProviderAssetFooterSelected'
import { useBetaTestFeatures } from '@/services/BetaTestFeaturesService'
import { useAlerts } from '@anzusystems/common-admin'

export const useExternalProviderAssetImport = () => {
  const { maxUploadItems } = useBetaTestFeatures()
  const { showWarning } = useAlerts()

  const importFromDetail = async (hideDetail = false) => {
    const listStore = useExternalProviderAssetListStore()
    if (isNull(listStore.activeItemIndex) || !listStore.list[listStore.activeItemIndex]) return
    const uploadQueueStore = useUploadQueuesStore()
    if (uploadQueueStore.getQueueTotalCount(QUEUE_ID_UPLOAD_GLOBAL) >= maxUploadItems.value) {
      showWarning('Max upload limit is ' + maxUploadItems.value + ' at once. Finish your upload, then try again.', 5)
      return
    }
    const detailStore = useExternalProviderAssetDetailStore()
    if (hideDetail) detailStore.hideDetail()
    await uploadQueueStore.addByExternalProviderAsset(
      QUEUE_ID_UPLOAD_GLOBAL,
      [listStore.list[listStore.activeItemIndex].asset],
      true
    )
  }

  const importFromSelected = async () => {
    const uploadQueueStore = useUploadQueuesStore()
    const queueItemsSelected = uploadQueueStore.getQueueItems(QUEUE_ID_MASS_EDIT)
    const totalWantedItems = queueItemsSelected.length + uploadQueueStore.getQueueTotalCount(QUEUE_ID_UPLOAD_GLOBAL)
    if (totalWantedItems >= maxUploadItems.value) {
      showWarning(
        'Max upload limit is ' +
          maxUploadItems.value +
          ' at once. Finish your upload, or select less items in list, then try again.',
        6
      )
      return
    }

    const assets: AssetExternalProviderListDto[] = queueItemsSelected.map((item) => {
      return {
        id: item.externalProviderAssetId as AssetExternalProviderId,
        texts: {
          displayTitle: item.displayTitle,
        },
        attributes: {
          assetType: item.assetType,
        },
        url: item.imagePreview?.url ? item.imagePreview.url : '',
        metadata: {},
      }
    })
    const { hideSelected } = useExternalProviderAssetFooterSelectedView()
    hideSelected()
    await uploadQueueStore.addByExternalProviderAsset(QUEUE_ID_UPLOAD_GLOBAL, assets, true)
    uploadQueueStore.clearQueue(QUEUE_ID_MASS_EDIT)
  }

  return {
    importFromDetail,
    importFromSelected,
  }
}
