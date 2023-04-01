import type { FilterBag, IntegerId, Pagination, PermissionGroup, ValueObjectOption } from '@anzusystems/common-admin'
import { useAlerts } from '@anzusystems/common-admin'
import { ref } from 'vue'
import type { AxiosInstance } from 'axios'
import { usePermissionGroupApi } from '@/services/api/common/permissionGroupApi'
import { storeToRefs } from 'pinia'
import { usePermissionGroupOneStore } from '@/stores/common/permissionGroupStore'
import { useRouter } from 'vue-router'
import { ROUTE } from '@/router/routes'
import useVuelidate from '@vuelidate/core'
import { useCachedPermissionGroups } from '@/views/common/permissionGroup/composables/cachedPermissionGroups'

const { showValidationError, showRecordWas, showErrorsDefault } = useAlerts()

const datatableHiddenColumns = ref<Array<string>>(['id'])
const listLoading = ref(false)
const detailLoading = ref(false)
const saveButtonLoading = ref(false)

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
  const fetchPermissionGroupList = async (pagination: Pagination, filterBag: FilterBag) => {
    listLoading.value = true
    try {
      permissionGroupList.value = await apiFetchPermissionGroupList(pagination, filterBag)
    } catch (error) {
      showErrorsDefault(error)
    } finally {
      listLoading.value = false
    }
  }

  const permissionGroupOneStore = usePermissionGroupOneStore()
  const { permissionGroup } = storeToRefs(permissionGroupOneStore)
  const fetchPermissionGroup = async (id: number) => {
    detailLoading.value = true
    try {
      const permissionGroupRes = await apiFetchPermissionGroup(id)
      permissionGroupOneStore.setPermissionGroup(permissionGroupRes)
    } catch (error) {
      showErrorsDefault(error)
    } finally {
      detailLoading.value = false
    }
  }

  const router = useRouter()
  const deletePermissionGroup = async (id: IntegerId) => {
    detailLoading.value = true
    try {
      await apiDeletePermissionGroup(id)
      showRecordWas('deleted')
      router.push({ name: ROUTE.COMMON.PERMISSION_GROUP.LIST })
    } catch (error) {
      showErrorsDefault(error)
    } finally {
      detailLoading.value = false
    }
  }

  const v$ = useVuelidate()
  const updatePermissionGroup = async (close = false) => {
    try {
      saveButtonLoading.value = true
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
      showErrorsDefault(error)
    } finally {
      saveButtonLoading.value = false
    }
  }

  const createPermissionGroup = async (close = false) => {
    try {
      saveButtonLoading.value = true
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
      showErrorsDefault(error)
    } finally {
      saveButtonLoading.value = false
    }
  }

  const { addManualToCachedPermissionGroups } = useCachedPermissionGroups()
  const fetchPermissionGroupOptions = async (pagination: Pagination, filterBag: FilterBag) => {
    const permissionGroups = await apiFetchPermissionGroupList(pagination, filterBag)
    permissionGroups.forEach((permissionGroup) => addManualToCachedPermissionGroups(permissionGroup))

    return <ValueObjectOption<number>[]>permissionGroups.map((permissionGroup: PermissionGroup) => ({
      title: permissionGroup.title,
      value: permissionGroup.id,
    }))
  }

  const fetchPermissionGroupOptionsByIds = async (ids: IntegerId[]) => {
    const permissionGroups = await apiFetchPermissionGroupListByIds(ids)
    permissionGroups.forEach((permissionGroup) => addManualToCachedPermissionGroups(permissionGroup))

    return <ValueObjectOption<number>[]>permissionGroups.map((permissionGroup: PermissionGroup) => ({
      title: permissionGroup.title,
      value: permissionGroup.id,
    }))
  }

  return {
    datatableHiddenColumns,
    fetchPermissionGroupList,
    fetchPermissionGroup,
    createPermissionGroup,
    updatePermissionGroup,
    deletePermissionGroup,
    fetchPermissionGroupOptions,
    fetchPermissionGroupOptionsByIds,
    permissionGroupList,
    permissionGroup,
    listLoading,
    detailLoading,
    saveButtonLoading,
    resetPermissionGroupStore: permissionGroupOneStore.reset,
  }
}
