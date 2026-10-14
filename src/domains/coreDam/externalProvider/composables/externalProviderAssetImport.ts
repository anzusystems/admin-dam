import { isNull, useAlerts } from '@anzusystems/common-admin'
import type { DamAssetTypeType } from '@anzusystems/common-admin'

import { useExternalProviderAssetFooterSelectedView } from '@/domains/coreDam/asset/composables/externalProviderAssetFooterSelected'
import { useUploadQueuesStore } from '@/domains/coreDam/asset/store/uploadQueuesStore'
import type {
  AssetExternalProviderId,
  AssetExternalProviderListDto,
} from '@/domains/coreDam/asset/types/AssetExternalProvider'
import { useExternalProviderAssetDetailStore } from '@/domains/coreDam/externalProvider/store/externalProviderAssetDetailStore'
import { QUEUE_ID_MASS_EDIT, QUEUE_ID_UPLOAD_GLOBAL } from '@/domains/coreDam/shared/services/upload/uploadQueueIds'
import { assetTypeAcl, useAuth } from '@/domains/system/auth/auth'
import { useBetaTestFeatures } from '@/shared/utils/BetaTestFeaturesService'

export const useExternalProviderAssetImport = () => {
  const { maxUploadItems } = useBetaTestFeatures()
  const { showWarning } = useAlerts()
  const { canForAll } = useAuth()

  // The import creates the asset on the current licence, under dam_<type>_create of each type imported.
  const canImport = (assetTypes: DamAssetTypeType[]) =>
    canForAll([...new Set(assetTypes.map((assetType) => assetTypeAcl(assetType, 'create')))])

  /* The asset the panel or the dialog shows, whatever tile of the list is active: after a list read anew the tile at
   * the place of the active one is of another asset, or there is none, and the button stood there all the same. */
  const importFromDetail = async (hideDetail = false) => {
    const detailStore = useExternalProviderAssetDetailStore()
    const shown = detailStore.asset
    if (isNull(shown) || detailStore.loader) return
    const uploadQueueStore = useUploadQueuesStore()
    if (uploadQueueStore.getQueueTotalCount(QUEUE_ID_UPLOAD_GLOBAL) >= maxUploadItems.value) {
      showWarning('Max upload limit is ' + maxUploadItems.value + ' at once. Finish your upload, then try again.', 5)
      return
    }
    if (hideDetail) detailStore.hideDetail()
    await uploadQueueStore.addByExternalProviderAsset(QUEUE_ID_UPLOAD_GLOBAL, [shown], true)
  }

  const importFromSelected = async () => {
    const uploadQueueStore = useUploadQueuesStore()
    const queueItemsSelected = uploadQueueStore.getQueueItems(QUEUE_ID_MASS_EDIT)
    const totalWantedItems = queueItemsSelected.length + uploadQueueStore.getQueueTotalCount(QUEUE_ID_UPLOAD_GLOBAL)
    // Exactly the maximum is allowed, as it is for an ordinary upload.
    if (totalWantedItems > maxUploadItems.value) {
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
        metadata: item.externalProviderMetadata ?? {},
      }
    })
    const { hideSelected } = useExternalProviderAssetFooterSelectedView()
    hideSelected()
    await uploadQueueStore.addByExternalProviderAsset(QUEUE_ID_UPLOAD_GLOBAL, assets, true)
    uploadQueueStore.clearQueue(QUEUE_ID_MASS_EDIT)
  }

  return {
    canImport,
    importFromDetail,
    importFromSelected,
  }
}
