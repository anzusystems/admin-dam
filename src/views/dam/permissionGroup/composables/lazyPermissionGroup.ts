import { ref } from 'vue'
import { useAddToLazyHelper, useAllHelper } from '@/composables/system/lazyFetchHelpers'
import type { PermissionGroup, PermissionGroupMinimal } from '@/types/dam/PermissionGroup'
import { fetchPermissionGroupListByIds } from '@/services/api/dam/permissionGroupApi'

const all = ref<Map<number, PermissionGroupMinimal>>(new Map())
const allIds = ref<Set<number>>(new Set([]))

const mapToMinimal = (source: PermissionGroup): PermissionGroupMinimal => {
  return { id: source.id, title: source.title }
}

export function loadLazyPermissionGroup(forceRefresh = false) {
  const { fetchByIds, addToLazy } = useAddToLazyHelper<PermissionGroup, PermissionGroupMinimal>()

  const fetchLazyPermissionGroup = () => fetchByIds(all, forceRefresh, mapToMinimal, fetchPermissionGroupListByIds)

  const addToLazyPermissionGroupBuffer = (id: number) => {
    allIds.value.add(id)
    return addToLazy(id)
  }

  return {
    addToLazyPermissionGroupBuffer,
    fetchLazyPermissionGroup,
  }
}

export function useLazyPermissionGroup() {
  return useAllHelper<PermissionGroupMinimal>(all, allIds)
}
