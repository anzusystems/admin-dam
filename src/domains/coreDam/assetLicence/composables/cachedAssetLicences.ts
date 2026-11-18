import type { DamAssetLicence, DamAssetLicenceCached, IntegerId } from '@anzusystems/common-admin'
import { defineCached, fetchDamAssetLicenceListByIds } from '@anzusystems/common-admin'

import { damClient } from '@/shared/apiClients/damClient'

const mapFullToMinimal = (assetLicence: DamAssetLicence): DamAssetLicenceCached => ({
  id: assetLicence.id,
  name: assetLicence.name,
  badge: assetLicence.badge,
})

const mapIdToMinimal = (id: IntegerId): DamAssetLicenceCached => ({ id: id, name: '', badge: '' })

const { cache, fetch, add, addManual, has, get, isLoaded } = defineCached<
  IntegerId,
  DamAssetLicence,
  DamAssetLicenceCached
>(mapFullToMinimal, mapIdToMinimal, (ids: IntegerId[]) => fetchDamAssetLicenceListByIds(damClient, ids))

export const useCachedAssetLicences = () => ({
  addManualToCachedAssetLicences: addManual,
  addToCachedAssetLicences: add,
  fetchCachedAssetLicences: fetch,
  cachedAssetLicences: cache,
  hasCachedAssetLicence: has,
  getCachedAssetLicence: get,
  isLoadedCachedAssetLicence: isLoaded,
})
