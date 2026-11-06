import { fetchDamAssetLicenceListByIds } from '@anzusystems/common-admin'
import { damClient } from '@/shared/apiClients/damClient'
import type {
  DamAssetLicenceCached,
  DamAssetLicenceExtended,
} from '@/domains/coreDam/assetLicence/types/AssetLicence'

const mapFullToMinimal = (assetLicence: DamAssetLicenceExtended): DamAssetLicenceCached => ({
  id: assetLicence.id,
  name: assetLicence.name,
  badge: assetLicence.badge ?? '',
})

const mapIdToMinimal = (id: IntegerId): DamAssetLicenceCached => {
  return { id: id, name: '', badge: '' }
}

const { cache, fetch, add, addManual, has, get, isLoaded } = defineCached<
  IntegerId,
  DamAssetLicenceExtended,
  DamAssetLicenceCached
>(
  mapFullToMinimal,
  mapIdToMinimal,
  (ids: IntegerId[]) => fetchDamAssetLicenceListByIds(damClient, ids) as Promise<DamAssetLicenceExtended[]>
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
