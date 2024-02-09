import type { DamAssetLicence, DamAssetLicenceMinimal, IntegerId } from '@anzusystems/common-admin'
import { defineCached, fetchDamAssetLicenceListByIds } from '@anzusystems/common-admin'
import { damClient } from '@/services/api/clients/damClient'

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
>(mapFullToMinimal, mapIdToMinimal, (ids: IntegerId[]) => fetchDamAssetLicenceListByIds(damClient, ids))

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
