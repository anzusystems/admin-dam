import type { PermissionGroup, PermissionGroupMinimal } from '@anzusystems/common-admin'
import { usePermissionGroupApi } from '@/domains/common/permissionGroup/api/permissionGroupApi'
import { damClient } from '@/shared/apiClients/damClient'

const mapFullToMinimal = (permissionGroup: PermissionGroup): PermissionGroupMinimal => ({
  id: permissionGroup.id,
  title: permissionGroup.title,
  permissions: permissionGroup.permissions,
})

const mapIdToMinimal = (id: IntegerId): PermissionGroupMinimal => {
  return { id: id, title: '', permissions: {} }
}

const { apiFetchPermissionGroupListByIds } = usePermissionGroupApi(damClient)

const { cache, fetch, add, addManual, has, get, isLoaded } = defineCached<
  IntegerId,
  PermissionGroup,
  PermissionGroupMinimal
>(mapFullToMinimal, mapIdToMinimal, apiFetchPermissionGroupListByIds)

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
