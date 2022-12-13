import { ref } from 'vue'
import type { Pagination } from '@/types/Pagination'
import type { FilterBag } from '@/types/Filter'
import type { ExtSystem } from '@/types/dam/ExtSystem'
import { useUiHelper } from '@/composables/system/uiHelper'
import { useAlerts } from '@/composables/system/alerts'
import { useErrorHandler } from '@/composables/system/error'
import {
  fetchExtSystem,
  fetchExtSystemList,
  fetchExtSystemListByIds,
  updateExtSystem,
} from '@/services/api/dam/extSystemApi'
import { storeToRefs } from 'pinia'
import { useExtSystemOneStore } from '@/stores/dam/extSystemStore'
import type { ValueObjectOption } from '@/types/ValueObject'
import useVuelidate from '@vuelidate/core'
import { useRouter } from 'vue-router'
import { ROUTE } from '@/router/routes'
import { loadLazyUser } from '@/views/dam/user/composables/lazyUser'

const { loaderOn, loaderOff, btnDisable, btnEnable, btnLoadingOn, btnReset } = useUiHelper()
const { showValidationError, showRecordWas } = useAlerts()
const { handleError } = useErrorHandler()

const { fetchLazyUser, addToLazyUserBuffer } = loadLazyUser()

export const useExtSystemListActions = () => {
  const listItems = ref<ExtSystem[]>([])

  const fetchList = async (pagination: Pagination, filterBag: FilterBag) => {
    loaderOn('list')
    try {
      listItems.value = await fetchExtSystemList(pagination, filterBag)
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

export const useExtSystemDetailActions = () => {
  const extSystemOneStore = useExtSystemOneStore()
  const { extSystem, loaded } = storeToRefs(extSystemOneStore)

  const fetchData = async (id: number) => {
    loaderOn('detail')
    try {
      const extSystem = await fetchExtSystem(id)
      extSystem.adminUsers.forEach((id) => addToLazyUserBuffer(id))
      fetchLazyUser()
      extSystemOneStore.setExtSystem(extSystem)
      extSystemOneStore.setLoaded(true)
    } catch (error) {
      handleError(error)
    } finally {
      loaderOff('detail')
    }
  }

  return {
    extSystem,
    loaded,
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
  const { extSystem, loaded } = storeToRefs(extSystemOneStore)

  const fetchData = async (id: number) => {
    loaderOn('edit')
    try {
      const extSystem = await fetchExtSystem(id)
      extSystem.adminUsers.forEach((id) => addToLazyUserBuffer(id))
      fetchLazyUser()
      extSystemOneStore.setExtSystem(extSystem)
      extSystemOneStore.setLoaded(true)
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
      await updateExtSystem(extSystemOneStore.extSystem.id, extSystem.value)
      showRecordWas('updated')
      if (!close) return
      router.push({ name: ROUTE.DAM.EXT_SYSTEM.LIST })
    } catch (error) {
      handleError(error)
    } finally {
      btnReset('save', 'saveAndClose', 'delete')
    }
  }

  return {
    loaded,
    extSystem,
    fetchData,
    onUpdate,
    resetStore: extSystemOneStore.reset,
  }
}
