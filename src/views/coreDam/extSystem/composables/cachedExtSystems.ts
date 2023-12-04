import type { DamExtSystem, DamExtSystemMinimal } from '@/types/coreDam/DamExtSystem'
import { fetchExtSystemListByIds } from '@/services/api/coreDam/extSystemApi'
import type { IntegerId } from '@anzusystems/common-admin'
import { defineCached } from '@anzusystems/common-admin'

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
  fetchExtSystemListByIds
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
