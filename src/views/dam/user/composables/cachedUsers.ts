import { ref } from 'vue'
import { useAddToLazyHelper, useAllHelper } from '@/composables/system/lazyFetchCachedHelpers'
import type { User, UserMinimal } from '@/types/dam/User'
import { fetchUserListByIds } from '@/services/api/dam/userApi'
import type { IntegerId } from '@/types/common'

// TODO: WIP version

interface UserCacheItem extends UserMinimal {
  _loaded: boolean
}

const cache = ref<Map<IntegerId, UserCacheItem>>(new Map())

const mapFullToMinimal = (source: User): UserMinimal => {
  return { id: source.id, email: source.email, firstName: source.firstName, lastName: source.lastName }
}

const mapIdToMinimal = (id: IntegerId): UserMinimal => {
  return { id: id, email: '', firstName: id + '', lastName: '' }
}

export const loadCachedUsers = () => {
  const { fetchNotLoaded, addToCache, manualAdd } = useAddToLazyHelper<User, UserMinimal>(cache)

  const fetchCachedUsers = () => fetchNotLoaded(cache, 'id', mapFullToMinimal, fetchUserListByIds)

  const addToCachedUsersLazy = (id: IntegerId) => addToCache(id, mapIdToMinimal)

  const addToCachedUsersManual = (data: User) => manualAdd(cache, data, 'id', mapFullToMinimal)

  return {
    addToCachedUsersManual,
    addToCachedUsersLazy,
    fetchCachedUsers,
  }
}

export const useCachedUsers = () => {
  const { has, get, isLoaded } = useAllHelper<UserMinimal>(cache)

  return {
    hasCachedUser: has,
    getCachedUser: get,
    isLoadedCachedUser: isLoaded,
  }
}
