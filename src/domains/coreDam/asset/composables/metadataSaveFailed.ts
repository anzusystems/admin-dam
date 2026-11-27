import { AssetsGoneMeanwhileError, showMetadataSaveError } from '@/domains/coreDam/asset/api/assetApi'
import { useAssetDetailStore } from '@/domains/coreDam/asset/store/assetDetailStore'
import { useAssetListStore } from '@/domains/coreDam/asset/store/assetListStore'
import { useUploadQueuesStore } from '@/domains/coreDam/asset/store/uploadQueuesStore'

/**
 * Tells the user why a metadata save failed. An asset the save found deleted meanwhile cannot be saved again:
 * its queue rows go, and its tiles and the detail or panel holding it turn to deleting, which turns "Save" off.
 * Outside the api module, which the stores import.
 */
export const metadataSaveFailed = (error: unknown) => {
  if (error instanceof AssetsGoneMeanwhileError) {
    const uploadQueuesStore = useUploadQueuesStore()
    const assetListStore = useAssetListStore()
    const assetDetailStore = useAssetDetailStore()
    error.assetIds.forEach((assetId) => {
      uploadQueuesStore.removeRowsOfDeletedAsset(assetId)
      assetListStore.setDeletingById(assetId)
      if (assetDetailStore.asset?.id === assetId) assetDetailStore.setDeleting()
    })
  }
  showMetadataSaveError(error)
}
