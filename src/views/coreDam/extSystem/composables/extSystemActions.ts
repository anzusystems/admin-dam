import { ref } from 'vue'
import type { FilterBag, Pagination, ValueObjectOption } from '@anzusystems/common-admin'
import { useAlerts, useErrorHandler } from '@anzusystems/common-admin'
import type { ExtSystem } from '@/types/coreDam/ExtSystem'
import {
  fetchExtSystem,
  fetchExtSystemList,
  fetchExtSystemListByIds,
  updateExtSystem,
} from '@/services/api/coreDam/extSystemApi'
import { storeToRefs } from 'pinia'
import { useExtSystemOneStore } from '@/stores/dam/extSystemStore'
import useVuelidate from '@vuelidate/core'
import { useRouter } from 'vue-router'
import { ROUTE } from '@/router/routes'
import { loadLazyUser } from '@/views/coreDam/user/composables/lazyUser'

const { showValidationError, showRecordWas } = useAlerts()
const { handleError } = useErrorHandler()

const { fetchLazyUser, addToLazyUserBuffer } = loadLazyUser()

const listLoading = ref(false)
const detailLoading = ref(false)
const saveButtonLoading = ref(false)
const saveAndCloseButtonLoading = ref(false)

export const useExtSystemListActions = () => {
  const listItems = ref<ExtSystem[]>([])

  const fetchList = async (pagination: Pagination, filterBag: FilterBag) => {
    listLoading.value = true
    try {
      listItems.value = await fetchExtSystemList(pagination, filterBag)
    } catch (error) {
      handleError(error)
    } finally {
      listLoading.value = false
    }
  }

  return {
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
      extSystem.adminUsers.forEach((id) => addToLazyUserBuffer(id))
      fetchLazyUser()
      extSystemOneStore.setExtSystem(extSystem)
    } catch (error) {
      handleError(error)
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

export const useExtSystemSelectActions = () => {
  const fetchItems = async (pagination: Pagination, filterBag: FilterBag) => {
    const extSystems = await fetchExtSystemList(pagination, filterBag)

    return <ValueObjectOption<number>[]>extSystems.map((extSystem: ExtSystem) => ({
      title: extSystem.slug,
      value: extSystem.id,
    }))
  }

  const fetchItemsByIds = async (ids: number[]) => {
    const extSystems = await fetchExtSystemListByIds(ids)

    return <ValueObjectOption<number>[]>extSystems.map((extSystem: ExtSystem) => ({
      title: extSystem.slug,
      value: extSystem.id,
    }))
  }

  return {
    fetchItems,
    fetchItemsByIds,
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
      extSystem.adminUsers.forEach((id) => addToLazyUserBuffer(id))
      fetchLazyUser()
      extSystemOneStore.setExtSystem(extSystem)
    } catch (error) {
      handleError(error)
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
      router.push({ name: ROUTE.DAM.EXT_SYSTEM.LIST })
    } catch (error) {
      handleError(error)
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
