import type { DamExtSystem, DamExtSystemMinimal } from '@anzusystems/common-admin'
import { fetchDamExtSystemListByIds } from '@anzusystems/common-admin'
import { damClient } from '@/shared/apiClients/damClient'

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
