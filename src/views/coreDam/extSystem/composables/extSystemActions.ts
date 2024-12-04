import { ref } from 'vue'
import type { DamExtSystem, FilterBag, Pagination } from '@anzusystems/common-admin'
import { fetchDamExtSystemList, useAlerts, useDamCachedUsers } from '@anzusystems/common-admin'
import { fetchExtSystem, updateExtSystem } from '@/services/api/coreDam/extSystemApi'
import { storeToRefs } from 'pinia'
import { useExtSystemOneStore } from '@/stores/coreDam/extSystemStore'
import useVuelidate from '@vuelidate/core'
import { useRouter } from 'vue-router'
import { ROUTE } from '@/router/routes'
import { damClient } from '@/services/api/clients/damClient'

const { showValidationError, showRecordWas, showErrorsDefault } = useAlerts()

const { fetchCachedUsers, addToCachedUsers } = useDamCachedUsers()

const datatableHiddenColumns = ref<Array<string>>(['id'])
const listLoading = ref(false)
const detailLoading = ref(false)
const saveButtonLoading = ref(false)
const saveAndCloseButtonLoading = ref(false)

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
      router.push({ name: ROUTE.DAM.EXT_SYSTEM.LIST })
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
