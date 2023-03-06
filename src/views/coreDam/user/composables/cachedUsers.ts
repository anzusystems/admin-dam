import { ref } from 'vue'
import {
  type AddToCachedArgs,
  type CachedItem,
  useAddToLazyHelper,
  useAllHelper,
} from '@/composables/system/lazyFetchCachedHelpers'
import type { User, UserMinimal } from '@/types/coreDam/User'
import { fetchUserListByIds } from '@/services/api/coreDam/userApi'
import type { IntegerId } from '@anzusystems/common-admin'

// TODO: WIP version
interface UserCacheItem extends UserMinimal, CachedItem {}

const cache = ref<Map<IntegerId, UserCacheItem>>(new Map())
const toFetch = ref<Set<IntegerId>>(new Set())

const mapFullToMinimal = (source: User): UserMinimal => {
  return { id: source.id, email: source.email, firstName: source.firstName, lastName: source.lastName }
}

const mapIdToMinimal = (id: IntegerId): UserMinimal => {
  return { id: id, email: '', firstName: id + '', lastName: '' }
}

export const loadCachedUsers = () => {
  const { fetchNotLoaded, addToCache, manualAdd } = useAddToLazyHelper<IntegerId, User, UserMinimal>(cache, toFetch)

  const fetchCachedUsers = () => fetchNotLoaded(cache, toFetch, 'id', mapFullToMinimal, fetchUserListByIds)

  const addToCachedUsersLazy = (...args: AddToCachedArgs<IntegerId>) => addToCache(mapIdToMinimal, ...args)

  const addToCachedUsersManual = (data: User) => manualAdd(cache, data, 'id', mapFullToMinimal)

  return {
    addToCachedUsersManual,
    addToCachedUsersLazy,
    fetchCachedUsers,
  }
}

export const useCachedUsers = () => {
  const { has, get, isLoaded } = useAllHelper<IntegerId, UserMinimal>(cache)

  return {
    hasCachedUser: has,
    getCachedUser: get,
    isLoadedCachedUser: isLoaded,
  }
}
