import type { User, UserMinimal } from '@/types/coreDam/User'
import { fetchUserListByIds } from '@/services/api/coreDam/userApi'
import type { IntegerId } from '@anzusystems/common-admin'
import { defineCached } from '@/composables/system/defineCached'

const mapFullToMinimal = (source: User): UserMinimal => {
  return { id: source.id, email: source.email, avatar: source.avatar, person: source.person }
}

const mapIdToMinimal = (id: IntegerId): UserMinimal => {
  return { id: id, email: '', person: { firstName: '', lastName: '', fullName: '' }, avatar: { color: '', text: '' } }
}

const { cache, fetch, add, addManual, has, get, isLoaded } = defineCached<IntegerId, User, UserMinimal>(
  mapFullToMinimal,
  mapIdToMinimal,
  fetchUserListByIds
)

export const loadCachedUsers = () => {
  return {
    addManualToCachedUsers: addManual,
    addToCachedUsers: add,
    fetchCachedUsers: fetch,
  }
}

export const useCachedUsers = () => {
  return {
    cachedUsers: cache,
    hasCachedUser: has,
    getCachedUser: get,
    isLoadedCachedUser: isLoaded,
  }
}
