import type { UserMinimal } from '@/types/coreDam/User'
import type { DamUser, IntegerId } from '@anzusystems/common-admin'
import { defineCached, fetchDamUserListByIds } from '@anzusystems/common-admin'
import { damClient } from '@/services/api/clients/damClient'

const mapFullToMinimal = (source: DamUser): UserMinimal => {
  return { id: source.id, email: source.email, avatar: source.avatar, person: source.person }
}

const mapIdToMinimal = (id: IntegerId): UserMinimal => {
  return { id: id, email: '', person: { firstName: '', lastName: '', fullName: '' }, avatar: { color: '', text: '' } }
}

const { cache, fetch, add, addManual, has, get, isLoaded } = defineCached<IntegerId, DamUser, UserMinimal>(
  mapFullToMinimal,
  mapIdToMinimal,
  (ids: IntegerId[]) => fetchDamUserListByIds(damClient, ids)
)

export const useCachedUsers = () => {
  return {
    addManualToCachedUsers: addManual,
    addToCachedUsers: add,
    fetchCachedUsers: fetch,
    cachedUsers: cache,
    hasCachedUser: has,
    getCachedUser: get,
    isLoadedCachedUser: isLoaded,
  }
}
