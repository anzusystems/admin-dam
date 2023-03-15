import { ref } from 'vue'
import { useAddToLazyHelper, useAllHelper } from '@/composables/system/lazyFetchHelpers'
import type { User, UserMinimal } from '@/types/coreDam/User'
import { fetchUserListByIds } from '@/services/api/coreDam/userApi'

const all = ref<Map<number, UserMinimal>>(new Map())
const allIds = ref<Set<number>>(new Set([]))

const mapToMinimal = (source: User): UserMinimal => {
  return { id: source.id, email: source.email, person: source.person, avatar: source.avatar }
}

export function loadLazyUser(forceRefresh = false) {
  const { fetchByIds, addToLazy } = useAddToLazyHelper<User, UserMinimal>()

  const fetchLazyUser = () => fetchByIds(all, forceRefresh, mapToMinimal, fetchUserListByIds)

  const addToLazyUserBuffer = (id: number) => {
    allIds.value.add(id)
    return addToLazy(id)
  }

  return {
    addToLazyUserBuffer,
    fetchLazyUser,
  }
}

export function useLazyUser() {
  return useAllHelper<UserMinimal>(all, allIds)
}
