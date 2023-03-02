import type { FilterBag, IntegerId, Pagination, PermissionGroup, ValueObjectOption } from '@anzusystems/common-admin'
import { useAlerts, useErrorHandler } from '@anzusystems/common-admin'
import { ref } from 'vue'
import type { AxiosInstance } from 'axios'
import { usePermissionGroupApi } from '@/services/api/common/permissionGroupApi'
import { storeToRefs } from 'pinia'
import { usePermissionGroupOneStore } from '@/stores/common/permissionGroupStore'
import { useRouter } from 'vue-router'
import { ROUTE } from '@/router/routes'
import useVuelidate from '@vuelidate/core'
import { loadLazyPermissionGroup } from '@/views/common/permissionGroup/composables/lazyPermissionGroup'

const { handleError } = useErrorHandler()
const { showValidationError, showRecordWas } = useAlerts()

export const usePermissionGroupActions = (client: () => AxiosInstance) => {
  const {
    apiFetchPermissionGroupList,
    apiFetchPermissionGroup,
    apiDeletePermissionGroup,
    apiUpdatePermissionGroup,
    apiCreatePermissionGroup,
    apiFetchPermissionGroupListByIds,
  } = usePermissionGroupApi(client)

  const permissionGroupList = ref<PermissionGroup[]>([])
  const loadingPermissionGroupList = ref(false)
  const fetchPermissionGroupList = async (pagination: Pagination, filterBag: FilterBag) => {
    loadingPermissionGroupList.value = true
    try {
      permissionGroupList.value = await apiFetchPermissionGroupList(pagination, filterBag)
    } catch (error) {
      handleError(error)
    } finally {
      loadingPermissionGroupList.value = false
    }
  }

  const permissionGroupOneStore = usePermissionGroupOneStore()
  const { permissionGroup, loadingPermissionGroup } = storeToRefs(permissionGroupOneStore)
  const fetchPermissionGroup = async (id: number) => {
    permissionGroupOneStore.setLoadingPermissionGroup(true)
    try {
      const permissionGroupRes = await apiFetchPermissionGroup(id)
      permissionGroupOneStore.setPermissionGroup(permissionGroupRes)
    } catch (error) {
      handleError(error)
    } finally {
      permissionGroupOneStore.setLoadingPermissionGroup(false)
    }
  }

  const router = useRouter()
  const loadingDeletePermissionGroup = ref(false)
  const deletePermissionGroup = async (id: IntegerId) => {
    try {
      loadingDeletePermissionGroup.value = true
      await apiDeletePermissionGroup(id)
      showRecordWas('deleted')
      router.push({ name: ROUTE.COMMON.PERMISSION_GROUP.LIST })
    } catch (error) {
      handleError(error)
    } finally {
      loadingDeletePermissionGroup.value = false
    }
  }

  const v$ = useVuelidate()
  const loadingUpdatePermissionGroup = ref(false)
  const updatePermissionGroup = async (close = false) => {
    try {
      loadingUpdatePermissionGroup.value = true
      v$.value.$touch()
      if (v$.value.$invalid) {
        showValidationError()
        return
      }
      await apiUpdatePermissionGroup(
        permissionGroupOneStore.permissionGroup.id,
        permissionGroupOneStore.permissionGroup
      )
      showRecordWas('updated')
      if (!close) return
      router.push({ name: ROUTE.COMMON.PERMISSION_GROUP.LIST })
    } catch (error) {
      handleError(error)
    } finally {
      loadingUpdatePermissionGroup.value = false
    }
  }

  const loadingCreatePermissionGroup = ref(false)
  const createPermissionGroup = async (close = false) => {
    try {
      loadingCreatePermissionGroup.value = true
      v$.value.$touch()
      if (v$.value.$invalid) {
        showValidationError()
        return
      }
      const permissionGroupRes = await apiCreatePermissionGroup(permissionGroupOneStore.permissionGroup)
      showRecordWas('created')
      if (close) {
        router.push({ name: ROUTE.COMMON.PERMISSION_GROUP.LIST })
        return
      }
      router.push({ name: ROUTE.COMMON.PERMISSION_GROUP.DETAIL, params: { id: permissionGroupRes.id } })
    } catch (error) {
      handleError(error)
    } finally {
      loadingCreatePermissionGroup.value = false
    }
  }

  const { manualAddLazyPermissionGroup } = loadLazyPermissionGroup(client)
  const fetchPermissionGroupOptions = async (pagination: Pagination, filterBag: FilterBag) => {
    const permissionGroups = await apiFetchPermissionGroupList(pagination, filterBag)
    permissionGroups.forEach((permissionGroup) => manualAddLazyPermissionGroup(permissionGroup))

    return <ValueObjectOption<number>[]>permissionGroups.map((permissionGroup: PermissionGroup) => ({
      title: permissionGroup.title,
      value: permissionGroup.id,
    }))
  }

  const fetchPermissionGroupOptionsByIds = async (ids: IntegerId[]) => {
    const permissionGroups = await apiFetchPermissionGroupListByIds(ids)
    permissionGroups.forEach((permissionGroup) => manualAddLazyPermissionGroup(permissionGroup))

    return <ValueObjectOption<number>[]>permissionGroups.map((permissionGroup: PermissionGroup) => ({
      title: permissionGroup.title,
      value: permissionGroup.id,
    }))
  }

  return {
    fetchPermissionGroupList,
    fetchPermissionGroup,
    createPermissionGroup,
    updatePermissionGroup,
    deletePermissionGroup,
    fetchPermissionGroupOptions,
    fetchPermissionGroupOptionsByIds,
    permissionGroupList,
    permissionGroup,
    loadingPermissionGroupList,
    loadingPermissionGroup,
    loadingCreatePermissionGroup,
    loadingUpdatePermissionGroup,
    loadingDeletePermissionGroup,
    resetPermissionGroupStore: permissionGroupOneStore.reset,
  }
}
