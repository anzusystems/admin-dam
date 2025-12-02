import type { DocId } from '@anzusystems/common-admin'
import { useAlerts } from '@anzusystems/common-admin'
import { removeSibling, setSibling } from '@/services/api/coreDam/assetApi'
import { storeToRefs } from 'pinia'
import { useAssetDetailStore } from '@/stores/coreDam/assetDetailStore'

export function useAssetDetailSidebarSlotsAssetSiblingActions() {
  const { showErrorsDefault } = useAlerts()
  const assetDetailStore = useAssetDetailStore()
  const { asset, siblingLoader } = storeToRefs(assetDetailStore)

  const setAssetSibling = async (targetAssetId: DocId) => {
    try {
      if (!asset.value) {
        return
      }
      siblingLoader.value = true
      const res = await setSibling(asset.value.id, targetAssetId)
      asset.value.siblingToAsset = res.siblingToAsset
    } catch (e) {
      showErrorsDefault(e)
    } finally {
      siblingLoader.value = false
    }
  }

  const removeAssetSibling = async () => {
    try {
      if (!asset.value) {
        return
      }
      siblingLoader.value = true
      const res = await removeSibling(asset.value.id)
      asset.value.siblingToAsset = res.siblingToAsset
    } catch (e) {
      showErrorsDefault(e)
    } finally {
      siblingLoader.value = false
    }
  }

  return {
    setAssetSibling,
    removeAssetSibling,
  }
}
