import type { ExtSystem, ExtSystemMinimal } from '@/types/coreDam/ExtSystem'
import { fetchExtSystemListByIds } from '@/services/api/coreDam/extSystemApi'
import type { IntegerId } from '@anzusystems/common-admin'
import { defineCached } from '@anzusystems/common-admin'

const mapFullToMinimal = (extSystem: ExtSystem): ExtSystemMinimal => ({
  id: extSystem.id,
  name: extSystem.name,
})

const mapIdToMinimal = (id: IntegerId): ExtSystemMinimal => {
  return { id: id, name: '' }
}

const { cache, fetch, add, addManual, has, get, isLoaded } = defineCached<IntegerId, ExtSystem, ExtSystemMinimal>(
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
