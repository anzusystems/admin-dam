import {
  defineRecordLoader,
  syncUserAndTimeTracking,
  useAlerts,
  useDamCachedUsers,
  usePageNavigation,
} from '@anzusystems/common-admin'
import type {
  DamExtSystem,
  FilterConfig,
  FilterData,
  IntegerId,
  Pagination,
  ValueObjectOption,
} from '@anzusystems/common-admin'
import { useVuelidate } from '@vuelidate/core'
import { storeToRefs } from 'pinia'
import type { Ref } from 'vue'
import { ref } from 'vue'

import {
  useFetchExtSystem,
  useFetchExtSystemList,
  useFetchExtSystemListByIds,
  useUpdateExtSystem,
} from '@/domains/coreDam/extSystem/api/extSystemApi'
import { useExtSystemOneStore } from '@/domains/coreDam/extSystem/store/extSystemStore'
import { useCachedKeywords } from '@/domains/coreDam/keyword/composables/cachedKeywords'
import { useCachedVoiceFamiliesById } from '@/domains/coreDam/voiceFamily/composables/cachedVoiceFamilies'

const { showValidationError, showRecordWas, showErrorsDefault } = useAlerts()

const { fetchCachedUsers, addToCachedUsers } = useDamCachedUsers()
const { addToCachedVoiceFamilies, fetchCachedVoiceFamilies } = useCachedVoiceFamiliesById()
const { addToCachedKeywords, fetchCachedKeywords } = useCachedKeywords()

const datatableHiddenColumns = ref<Array<string>>(['id'])
const listLoading = ref(false)
const detailLoading = ref(false)
const saveButtonLoading = ref(false)
const saveAndCloseButtonLoading = ref(false)

export const useExtSystemSelectActions = () => {
  const { execute } = useFetchExtSystemList()

  const fetchItems = async (pagination: Ref<Pagination>, filterData: FilterData, filterConfig: FilterConfig) => {
    const extSystems = await execute(pagination, filterData, filterConfig)

    return <ValueObjectOption<IntegerId>[]>extSystems.map((extSystem: DamExtSystem) => ({
      title: extSystem.slug,
      value: extSystem.id,
    }))
  }

  const fetchItemsByIds = async (ids: IntegerId[]) => {
    const { execute: executeFetchByIds } = useFetchExtSystemListByIds()
    const extSystems = await executeFetchByIds(ids)

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
  const { execute } = useFetchExtSystemList()

  const fetchList = async (pagination: Ref<Pagination>, filterData: FilterData, filterConfig: FilterConfig) => {
    listLoading.value = true
    try {
      listItems.value = await execute(pagination, filterData, filterConfig)
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
  const { execute: fetchExtSystem } = useFetchExtSystem()

  const fetchData = defineRecordLoader(detailLoading, async (id: number, signal) => {
    const extSystem = await fetchExtSystem({ urlParams: { id }, signal })
    extSystem.adminUsers.forEach((id) => addToCachedUsers(id))
    fetchCachedUsers()
    if (extSystem.ttsSettings.defaultVoiceFamilyId) {
      addToCachedVoiceFamilies([extSystem.ttsSettings.defaultVoiceFamilyId])
      fetchCachedVoiceFamilies()
    }
    if (extSystem.ttsSettings.autoKeywordId) {
      addToCachedKeywords([extSystem.ttsSettings.autoKeywordId])
      fetchCachedKeywords()
    }
    extSystemOneStore.extSystem = extSystem
  })

  return {
    extSystem,
    detailLoading,
    fetchData,
    resetStore: extSystemOneStore.reset,
  }
}

export const useExtSystemEditActions = () => {
  const v$ = useVuelidate()
  const { push } = usePageNavigation()
  const extSystemOneStore = useExtSystemOneStore()
  const { extSystem } = storeToRefs(extSystemOneStore)
  const { execute: fetchExtSystem } = useFetchExtSystem()
  const { execute: updateExtSystem } = useUpdateExtSystem()

  const fetchData = defineRecordLoader(detailLoading, async (id: number, signal) => {
    const extSystem = await fetchExtSystem({ urlParams: { id }, signal })
    extSystem.adminUsers.forEach((id) => addToCachedUsers(id))
    fetchCachedUsers()
    extSystemOneStore.extSystem = extSystem
  })

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
      const res = await updateExtSystem({ urlParams: { id: extSystemOneStore.extSystem.id }, body: extSystem.value })
      syncUserAndTimeTracking(extSystemOneStore.extSystem, res)
      showRecordWas('updated')
      if (!close) return
      push({ name: '/(coreDam)/ext-systems' })
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
