import type { DamExtSystem, DamExtSystemMinimal, IntegerId } from '@anzusystems/common-admin'
import { defineCached, fetchDamExtSystemListByIds } from '@anzusystems/common-admin'
import { damClient } from '@/services/api/clients/damClient'

const mapFullToMinimal = (extSystem: DamExtSystem): DamExtSystemMinimal => ({
  id: extSystem.id,
  name: extSystem.name,
})

const mapIdToMinimal = (id: IntegerId): DamExtSystemMinimal => {
  return { id: id, name: '' }
}

const { cache, fetch, add, addManual, has, get, isLoaded } = defineCached<IntegerId, DamExtSystem, DamExtSystemMinimal>(
  mapFullToMinimal,
  mapIdToMinimal,
  (ids: IntegerId[]) => fetchDamExtSystemListByIds(damClient, ids)
)

export const useCachedExtSystems = () => {
  return {
    addManualToCachedExtSystems: addManual,
    addToCachedExtSystems: add,
    fetchCachedExtSystems: fetch,
    cachedExtSystems: cache,
    hasCachedExtSystem: has,
    getCachedExtSystem: get,
    isLoadedCachedExtSystem: isLoaded,
  }
}
