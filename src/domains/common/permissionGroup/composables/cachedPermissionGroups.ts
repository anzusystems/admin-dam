import type { PermissionGroup, PermissionGroupMinimal } from '@anzusystems/common-admin'
import { useFetchPermissionGroupListByIds } from '@/domains/common/permissionGroup/api/permissionGroupApi'

const mapFullToMinimal = (permissionGroup: PermissionGroup): PermissionGroupMinimal => ({
  id: permissionGroup.id,
  title: permissionGroup.title,
  permissions: permissionGroup.permissions,
})

const mapIdToMinimal = (id: IntegerId): PermissionGroupMinimal => {
  return { id: id, title: '', permissions: {} }
}

const fetchPermissionGroupListByIds = (ids: IntegerId[]) => {
  const { executeFetch } = useFetchPermissionGroupListByIds()
  return executeFetch(ids)
}

const { cache, fetch, add, addManual, has, get, isLoaded } = defineCached<
  IntegerId,
  PermissionGroup,
  PermissionGroupMinimal
>(mapFullToMinimal, mapIdToMinimal, fetchPermissionGroupListByIds)

export const useCachedPermissionGroups = () => {
  return {
    addManualToCachedPermissionGroups: addManual,
    addToCachedPermissionGroups: add,
    fetchCachedPermissionGroups: fetch,
    cachedPermissionGroups: cache,
    hasCachedPermissionGroup: has,
    getCachedPermissionGroup: get,
    isLoadedCachedPermissionGroup: isLoaded,
  }
}
