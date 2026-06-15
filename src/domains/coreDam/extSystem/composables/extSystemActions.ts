import { type DamExtSystem, useDamCachedUsers } from '@anzusystems/common-admin'
import type { FilterConfig, FilterData, Pagination } from '@anzusystems/common-admin/labs'
import type { Ref } from 'vue'
import {
  useFetchExtSystem,
  useFetchExtSystemList,
  useFetchExtSystemListByIds,
  useUpdateExtSystem,
} from '@/domains/coreDam/extSystem/api/extSystemApi'
import { useExtSystemOneStore } from '@/domains/coreDam/extSystem/store/extSystemStore'
import { useCachedVoiceFamiliesById } from '@/domains/coreDam/voiceFamily/composables/cachedVoiceFamilies'
import { useCachedKeywords } from '@/domains/coreDam/keyword/composables/cachedKeywords'

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
  const { executeFetch } = useFetchExtSystemList()

  const fetchItems = async (pagination: Ref<Pagination>, filterData: FilterData, filterConfig: FilterConfig) => {
    const extSystems = await executeFetch(pagination, filterData, filterConfig)

    return <ValueObjectOption<IntegerId>[]>extSystems.map((extSystem: DamExtSystem) => ({
      title: extSystem.slug,
      value: extSystem.id,
    }))
  }

  const fetchItemsByIds = async (ids: IntegerId[]) => {
    const { executeFetch: executeFetchByIds } = useFetchExtSystemListByIds()
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
  const { executeFetch } = useFetchExtSystemList()

  const fetchList = async (pagination: Ref<Pagination>, filterData: FilterData, filterConfig: FilterConfig) => {
    listLoading.value = true
    try {
      listItems.value = await executeFetch(pagination, filterData, filterConfig)
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
  const { executeRequest: fetchExtSystem } = useFetchExtSystem()

  const fetchData = async (id: number) => {
    detailLoading.value = true
    try {
      const extSystem = await fetchExtSystem({ urlParams: { id } })
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
  const { executeRequest: fetchExtSystem } = useFetchExtSystem()
  const { executeRequest: updateExtSystem } = useUpdateExtSystem()

  const fetchData = async (id: number) => {
    detailLoading.value = true
    try {
      const extSystem = await fetchExtSystem({ urlParams: { id } })
      extSystem.adminUsers.forEach((id) => addToCachedUsers(id))
      fetchCachedUsers()
      extSystemOneStore.extSystem = extSystem
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
      await updateExtSystem({ urlParams: { id: extSystemOneStore.extSystem.id }, object: extSystem.value })
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
