import type { Ref } from 'vue'
import type { FilterConfig, FilterData, Pagination, PermissionGroup } from '@anzusystems/common-admin'
import {
  useCreatePermissionGroup,
  useDeletePermissionGroup,
  useFetchPermissionGroup,
  useFetchPermissionGroupList,
  useFetchPermissionGroupListByIds,
  useUpdatePermissionGroup,
} from '@/domains/common/permissionGroup/api/permissionGroupApi'
import { usePermissionGroupOneStore } from '@/domains/common/permissionGroup/store/permissionGroupStore'
import { useCachedPermissionGroups } from '@/domains/common/permissionGroup/composables/cachedPermissionGroups'

const { showValidationError, showRecordWas, showErrorsDefault } = useAlerts()

const datatableHiddenColumns = ref<Array<string>>(['id'])
const listLoading = ref(false)
const detailLoading = ref(false)
const saveButtonLoading = ref(false)

export const usePermissionGroupActions = () => {
  const { execute } = useFetchPermissionGroupList()
  const { execute: fetchListByIds } = useFetchPermissionGroupListByIds()

  const permissionGroupList = ref<PermissionGroup[]>([])
  const fetchPermissionGroupList = async (
    pagination: Ref<Pagination>,
    filterData: FilterData,
    filterConfig: FilterConfig
  ) => {
    listLoading.value = true
    try {
      permissionGroupList.value = await execute(pagination, filterData, filterConfig)
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
      const { execute } = useFetchPermissionGroup()
      const permissionGroupRes = await execute({ urlParams: { id } })
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
      const { execute } = useDeletePermissionGroup()
      await execute({ urlParams: { id } })
      showRecordWas('deleted')
      router.push({ name: '/(common)/permission-groups' })
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
        saveButtonLoading.value = false
        return
      }
      const { execute } = useUpdatePermissionGroup()
      await execute({
        urlParams: { id: permissionGroupOneStore.permissionGroup.id },
        body: permissionGroupOneStore.permissionGroup,
      })
      showRecordWas('updated')
      if (!close) return
      router.push({ name: '/(common)/permission-groups' })
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
        saveButtonLoading.value = false
        return
      }
      const { execute } = useCreatePermissionGroup()
      const permissionGroupRes = await execute({ body: permissionGroupOneStore.permissionGroup })
      showRecordWas('created')
      if (close) {
        router.push({ name: '/(common)/permission-groups' })
        return
      }
      router.push({ name: '/(common)/permission-groups/[id]', params: { id: permissionGroupRes.id } })
    } catch (error) {
      showErrorsDefault(error)
    } finally {
      saveButtonLoading.value = false
    }
  }

  const { addManualToCachedPermissionGroups } = useCachedPermissionGroups()
  const fetchPermissionGroupOptions = async (
    pagination: Ref<Pagination>,
    filterData: FilterData,
    filterConfig: FilterConfig
  ) => {
    const permissionGroups = await execute(pagination, filterData, filterConfig)
    permissionGroups.forEach((permissionGroup) => addManualToCachedPermissionGroups(permissionGroup))

    return <ValueObjectOption<number>[]>permissionGroups.map((permissionGroup: PermissionGroup) => ({
      title: permissionGroup.title,
      value: permissionGroup.id,
    }))
  }

  const fetchPermissionGroupOptionsByIds = async (ids: IntegerId[]) => {
    const permissionGroups = await fetchListByIds(ids)
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

export const usePermissionGroupSelectAction = () => {
  const { execute } = useFetchPermissionGroupList()

  const mapToValueObject = (permissionGroup: PermissionGroup): ValueObjectOption<IntegerId> => ({
    title: permissionGroup.title,
    value: permissionGroup.id,
  })

  const mapToValueObjects = (permissionGroups: PermissionGroup[]): ValueObjectOption<IntegerId>[] => {
    return permissionGroups.map((permissionGroup: PermissionGroup) => mapToValueObject(permissionGroup))
  }

  const fetchItems = async (pagination: Ref<Pagination>, filterData: FilterData, filterConfig: FilterConfig) => {
    return mapToValueObjects(await execute(pagination, filterData, filterConfig))
  }

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
