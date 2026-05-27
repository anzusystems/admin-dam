import {
  type DamExtSystem,
  fetchDamExtSystemList,
  fetchDamExtSystemListByIds,
  type FilterBag,
  type Pagination,
  useDamCachedUsers,
} from '@anzusystems/common-admin'
import { fetchExtSystem, updateExtSystem } from '@/domains/coreDam/extSystem/api/extSystemApi'
import { useExtSystemOneStore } from '@/domains/coreDam/extSystem/store/extSystemStore'
import { damClient } from '@/shared/apiClients/damClient'
import type { AxiosInstance } from 'axios'

const { showValidationError, showRecordWas, showErrorsDefault } = useAlerts()

const { fetchCachedUsers, addToCachedUsers } = useDamCachedUsers()

const datatableHiddenColumns = ref<Array<string>>(['id'])
const listLoading = ref(false)
const detailLoading = ref(false)
const saveButtonLoading = ref(false)
const saveAndCloseButtonLoading = ref(false)

export const useExtSystemSelectActions = (client: () => AxiosInstance) => {
  const fetchItems = async (pagination: Pagination, filterBag: FilterBag) => {
    const extSystems = await fetchDamExtSystemList(client, pagination, filterBag)

    return <ValueObjectOption<IntegerId>[]>extSystems.map((extSystem: DamExtSystem) => ({
      title: extSystem.slug,
      value: extSystem.id,
    }))
  }

  const fetchItemsByIds = async (ids: IntegerId[]) => {
    const extSystems = await fetchDamExtSystemListByIds(client, ids)

    return <ValueObjectOption<IntegerId>[]>extSystems.map((extSystem: DamExtSystem) => ({
      title: extSystem.slug,
      value: extSystem.id,
    }))
  }

  return {
    fetchItems,
    fetchItemsByIds,
  }
}

export const useExtSystemListActions = () => {
  const listItems = ref<DamExtSystem[]>([])

  const fetchList = async (pagination: Pagination, filterBag: FilterBag) => {
    listLoading.value = true
    try {
      listItems.value = await fetchDamExtSystemList(damClient, pagination, filterBag)
    } catch (error) {
      showErrorsDefault(error)
    } finally {
      listLoading.value = false
    }
  }

  return {
    datatableHiddenColumns,
    listLoading,
    listItems,
    fetchList,
  }
}

export const useExtSystemDetailActions = () => {
  const extSystemOneStore = useExtSystemOneStore()
  const { extSystem } = storeToRefs(extSystemOneStore)

  const fetchData = async (id: number) => {
    detailLoading.value = true
    try {
      const extSystem = await fetchExtSystem(id)
      extSystem.adminUsers.forEach((id) => addToCachedUsers(id))
      fetchCachedUsers()
      extSystemOneStore.setExtSystem(extSystem)
    } catch (error) {
      showErrorsDefault(error)
    } finally {
      detailLoading.value = false
    }
  }

  return {
    extSystem,
    detailLoading,
    fetchData,
    resetStore: extSystemOneStore.reset,
  }
}

export const useExtSystemEditActions = () => {
  const v$ = useVuelidate()
  const router = useRouter()
  const extSystemOneStore = useExtSystemOneStore()
  const { extSystem } = storeToRefs(extSystemOneStore)

  const fetchData = async (id: number) => {
    detailLoading.value = true
    try {
      const extSystem = await fetchExtSystem(id)
      extSystem.adminUsers.forEach((id) => addToCachedUsers(id))
      fetchCachedUsers()
      extSystemOneStore.setExtSystem(extSystem)
    } catch (error) {
      showErrorsDefault(error)
    } finally {
      detailLoading.value = false
    }
  }

  const onUpdate = async (close = false) => {
    try {
      close ? (saveAndCloseButtonLoading.value = true) : (saveButtonLoading.value = true)
      v$.value.$touch()
      if (v$.value.$invalid) {
        showValidationError()
        saveButtonLoading.value = false
        saveAndCloseButtonLoading.value = false
        return
      }
      await updateExtSystem(extSystemOneStore.extSystem.id, extSystem.value)
      showRecordWas('updated')
      if (!close) return
      router.push({ name: '/(coreDam)/ext-systems' })
    } catch (error) {
      showErrorsDefault(error)
    } finally {
      saveButtonLoading.value = false
      saveAndCloseButtonLoading.value = false
    }
  }

  return {
    detailLoading,
    saveButtonLoading,
    saveAndCloseButtonLoading,
    extSystem,
    fetchData,
    onUpdate,
    resetStore: extSystemOneStore.reset,
  }
}
