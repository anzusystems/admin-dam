import type { AssetLicence, AssetLicenceMinimal } from '@/types/coreDam/AssetLicence'
import { fetchAssetLicenceListByIds } from '@/services/api/coreDam/assetLicenceApi'
import type { IntegerId } from '@anzusystems/common-admin'
import { defineCached } from '@/composables/system/defineCached'

const mapFullToMinimal = (assetLicence: AssetLicence): AssetLicenceMinimal => ({
  id: assetLicence.id,
  name: assetLicence.name,
})

const mapIdToMinimal = (id: IntegerId): AssetLicenceMinimal => {
  return { id: id, name: '' }
}

const { cache, fetch, add, addManual, has, get, isLoaded } = defineCached<IntegerId, AssetLicence, AssetLicenceMinimal>(
  mapFullToMinimal,
  mapIdToMinimal,
  fetchAssetLicenceListByIds
)

export const useCachedAssetLicences = () => {
  return {
    addManualToCachedAssetLicences: addManual,
    addToCachedAssetLicences: add,
    fetchCachedAssetLicences: fetch,
    cachedAssetLicences: cache,
    hasCachedAssetLicence: has,
    getCachedAssetLicence: get,
    isLoadedCachedAssetLicence: isLoaded,
  }
}
