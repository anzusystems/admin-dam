import type { DamAssetLicence, DamAssetLicenceMinimal, IntegerId } from '@anzusystems/common-admin'
import { defineCached } from '@anzusystems/common-admin'
import { fetchAssetLicenceListByIds } from '@/services/api/coreDam/assetLicenceApi'

const mapFullToMinimal = (assetLicence: DamAssetLicence): DamAssetLicenceMinimal => ({
  id: assetLicence.id,
  name: assetLicence.name,
})

const mapIdToMinimal = (id: IntegerId): DamAssetLicenceMinimal => {
  return { id: id, name: '' }
}

const { cache, fetch, add, addManual, has, get, isLoaded } = defineCached<
  IntegerId,
  DamAssetLicence,
  DamAssetLicenceMinimal
>(mapFullToMinimal, mapIdToMinimal, fetchAssetLicenceListByIds)

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
