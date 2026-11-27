import type {
  FilterConfig,
  FilterData,
  IntegerId,
  Pagination,
  PermissionGroup,
  ValueObjectOption,
} from '@anzusystems/common-admin'
import type { Ref } from 'vue'

import {
  useFetchPermissionGroupList,
  useFetchPermissionGroupListByIds,
} from '@/domains/common/permissionGroup/api/permissionGroupApi'

export const usePermissionGroupSelectAction = () => {
  const { execute } = useFetchPermissionGroupList()

  const mapToValueObject = (permissionGroup: PermissionGroup): ValueObjectOption<IntegerId> => ({
    title: permissionGroup.title,
    value: permissionGroup.id,
  })

  const mapToValueObjects = (permissionGroups: PermissionGroup[]): ValueObjectOption<IntegerId>[] =>
    permissionGroups.map((permissionGroup: PermissionGroup) => mapToValueObject(permissionGroup))

  const fetchItems = async (pagination: Ref<Pagination>, filterData: FilterData, filterConfig: FilterConfig) =>
    mapToValueObjects(await execute(pagination, filterData, filterConfig))

  const fetchItemsByIds = async (ids: IntegerId[]) => {
    const { execute } = useFetchPermissionGroupListByIds()
    return mapToValueObjects(await execute(ids))
  }

  return {
    mapToValueObject,
    fetchItems,
    fetchItemsByIds,
  }
}
