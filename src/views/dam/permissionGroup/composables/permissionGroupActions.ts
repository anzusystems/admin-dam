import { ref } from 'vue'
import type { Pagination } from '@/types/Pagination'
import type { FilterBag } from '@/types/Filter'
import { useUiHelper } from '@/composables/system/uiHelper'
import { useAlerts } from '@/composables/system/alerts'
import { useErrorHandler } from '@/composables/system/error'
import {
  fetchAllPermissionDetails,
  fetchGroupsPermissionsPreview,
  fetchPermissionGroup,
  fetchPermissionGroupList,
  fetchPermissionGroupListByIds,
  updatePermissionGroup,
} from '@/services/api/dam/permissionGroupApi'
import { storeToRefs } from 'pinia'
import type { PermissionGroup } from '@/types/dam/PermissionGroup'
import { usePermissionGroupOneStore } from '@/stores/dam/permissionGroupStore'
import useVuelidate from '@vuelidate/core'
import { useRouter } from 'vue-router'
import { ROUTE } from '@/router/routes'
import { loadLazyUser } from '@/views/dam/user/composables/lazyUser'
import type { ValueObjectOption } from '@/types/ValueObject'
import { useDescribedPermissionAction } from '@/views/dam/permissionGroup/composables/permissionList'
import type { AclValue, DescribedPermission, PermissionDetail, Permissions } from '@/types/Permission'

const { fetchLazyUser, addToLazyUserBuffer } = loadLazyUser()

const { loaderOn, loaderOff, btnDisable, btnEnable, btnLoadingOn, btnReset } = useUiHelper()
const { showValidationError, showRecordWas } = useAlerts()
const { handleError } = useErrorHandler()

export const usePermissionGroupListActions = () => {
  const listItems = ref<PermissionGroup[]>([])

  const fetchList = async (pagination: Pagination, filterBag: FilterBag) => {
    loaderOn('list')
    try {
      listItems.value = await fetchPermissionGroupList(pagination, filterBag)
    } catch (error) {
      handleError(error)
    } finally {
      loaderOff('list')
    }
  }

  return {
    listItems,
    fetchList,
  }
}

export const usePermissionGroupDetailActions = () => {
  const permissionGroupOneStore = usePermissionGroupOneStore()
  const { permissionGroup, loaded } = storeToRefs(permissionGroupOneStore)

  const fetchData = async (id: number) => {
    loaderOn('detail')
    try {
      const permissionGroup = await fetchPermissionGroup(id)
      permissionGroup.users.forEach((id) => addToLazyUserBuffer(id))
      fetchLazyUser()
      permissionGroupOneStore.setPermissionGroup(permissionGroup)
      permissionGroupOneStore.setLoaded(true)
    } catch (error) {
      handleError(error)
    } finally {
      loaderOff('detail')
    }
  }

  return {
    permissionGroup,
    loaded,
    fetchData,
    resetStore: permissionGroupOneStore.reset,
  }
}

export const usePermissionGroupSelectActions = () => {
  const fetchItems = async (pagination: Pagination, filterBag: FilterBag) => {
    const permissionGroups = await fetchPermissionGroupList(pagination, filterBag)

    return <ValueObjectOption<number>[]>permissionGroups.map((permissionGroup: PermissionGroup) => ({
      title: permissionGroup.title,
      value: permissionGroup.id,
    }))
  }

  const fetchItemsByIds = async (ids: number[]) => {
    const permissionGroups = await fetchPermissionGroupListByIds(ids)

    return <ValueObjectOption<number>[]>permissionGroups.map((permissionGroup: PermissionGroup) => ({
      title: permissionGroup.title,
      value: permissionGroup.id,
    }))
  }

  return {
    fetchItems,
    fetchItemsByIds,
  }
}

export const usePermissionGroupEditActions = () => {
  const v$ = useVuelidate()
  const router = useRouter()
  const permissionGroupOneStore = usePermissionGroupOneStore()
  const { permissionGroup, loaded } = storeToRefs(permissionGroupOneStore)

  const fetchData = async (id: number) => {
    loaderOn('edit')
    try {
      const permissionGroup = await fetchPermissionGroup(id)
      permissionGroup.users.forEach((id) => addToLazyUserBuffer(id))
      fetchLazyUser()
      permissionGroupOneStore.setPermissionGroup(permissionGroup)
      permissionGroupOneStore.setLoaded(true)
    } catch (error) {
      handleError(error)
    } finally {
      loaderOff('edit')
    }
  }

  const onUpdate = async (close = false) => {
    try {
      btnDisable('save', 'saveAndClose', 'delete')
      v$.value.$touch()
      if (v$.value.$invalid) {
        showValidationError()
        btnEnable('save', 'saveAndClose', 'delete')
        return
      }
      btnDisable(close ? 'save' : 'saveAndClose', 'delete')
      btnLoadingOn(close ? 'saveAndClose' : 'save')
      await updatePermissionGroup(permissionGroupOneStore.permissionGroup.id, permissionGroup.value)
      showRecordWas('updated')
      if (!close) return
      router.push({ name: ROUTE.DAM.PERMISSION_GROUP.LIST })
    } catch (error) {
      handleError(error)
    } finally {
      btnReset('save', 'saveAndClose', 'delete')
    }
  }

  return {
    loaded,
    permissionGroup,
    fetchData,
    onUpdate,
    resetStore: permissionGroupOneStore.reset,
  }
}

export const usePermissionListActions = () => {
  const { setupPermissionFields } = useDescribedPermissionAction()

  const fetchAllPermissions = async (): Promise<DescribedPermission[]> => {
    // try {
    const resolvedPermissions: DescribedPermission[] = []
    const resData = await fetchAllPermissionDetails()
    const entries = Object.entries(resData) as [[AclValue, PermissionDetail]]
    entries.forEach(([permissionName, permissionData]) => {
      resolvedPermissions.push(setupPermissionFields(permissionName, permissionData))
    })

    return resolvedPermissions
  }

  const fetchPreviewForGroupPermissions = async (ids: number[]): Promise<Permissions> => {
    return await fetchGroupsPermissionsPreview(ids)
  }

  return {
    fetchAllPermissions,
    fetchPreviewForGroupPermissions,
  }
}
