import type { DamAssetLicenceGroup } from '@anzusystems/common-admin'
import { fetchDamAssetLicenceGroupListByIds } from '@anzusystems/common-admin'
import { damClient } from '@/shared/apiClients/damClient'

type DamAssetLicenceGroupMinimal = Pick<DamAssetLicenceGroup, 'id' | 'name'>

const mapFullToMinimal = (assetLicenceGroup: DamAssetLicenceGroup): DamAssetLicenceGroupMinimal => ({
  id: assetLicenceGroup.id,
  name: assetLicenceGroup.name,
})

const mapIdToMinimal = (id: IntegerId): DamAssetLicenceGroupMinimal => {
  return { id: id, name: '' }
}

const { cache, fetch, add, addManual, has, get, isLoaded } = defineCached<
  IntegerId,
  DamAssetLicenceGroup,
  DamAssetLicenceGroupMinimal
>(mapFullToMinimal, mapIdToMinimal, (ids: IntegerId[]) => fetchDamAssetLicenceGroupListByIds(damClient, ids))

export const useCachedAssetLicenceGroups = () => {
  return {
    addManualToCachedAssetLicenceGroups: addManual,
    addToCachedAssetLicenceGroups: add,
    fetchCachedAssetLicenceGroups: fetch,
    cachedAssetLicenceGroups: cache,
    hasCachedAssetLicenceGroup: has,
    getCachedAssetLicenceGroup: get,
    isLoadedCachedAssetLicenceGroup: isLoaded,
  }
}
