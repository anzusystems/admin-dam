import { ref } from 'vue'
import { useAddToLazyHelper, useAllHelper } from '@/composables/system/lazyFetchHelpers'
import { usePermissionGroupApi } from '@/services/api/common/permissionGroupApi'
import type { AxiosInstance } from 'axios'
import type { PermissionGroup, PermissionGroupMinimal } from '@anzusystems/common-admin'

const all = ref<Map<number, PermissionGroupMinimal>>(new Map())
const allIds = ref<Set<number>>(new Set([]))

const mapToMinimal = (source: PermissionGroup): PermissionGroupMinimal => {
  return {
    id: source.id,
    title: source.title,
    permissions: source.permissions,
  }
}

export function loadLazyPermissionGroup(client: () => AxiosInstance, forceRefresh = false) {
  const { fetchByIds, addToLazy, manualAdd } = useAddToLazyHelper<PermissionGroup, PermissionGroupMinimal>()
  const { apiFetchPermissionGroupListByIds } = usePermissionGroupApi(client)

  const fetchLazyPermissionGroup = () => fetchByIds(all, forceRefresh, mapToMinimal, apiFetchPermissionGroupListByIds)
  const manualAddLazyPermissionGroup = (data: PermissionGroup) => manualAdd(all, data, 'id', mapToMinimal)

  const addToLazyPermissionGroupBuffer = (id: number) => {
    allIds.value.add(id)
    return addToLazy(id)
  }

  return {
    addToLazyPermissionGroupBuffer,
    fetchLazyPermissionGroup,
    manualAddLazyPermissionGroup,
  }
}

export function useLazyPermissionGroup() {
  return useAllHelper<PermissionGroupMinimal>(all, allIds)
}
