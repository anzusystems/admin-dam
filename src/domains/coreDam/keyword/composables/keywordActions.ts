import { useCurrentExtSystem } from '@/domains/coreDam/asset/composables/currentExtSystem'
import type { DamKeyword, DamKeywordMinimal } from '@anzusystems/common-admin'
import { SortOrder, useDamCachedUsers } from '@anzusystems/common-admin'
import type { FilterConfig, FilterData, Pagination } from '@anzusystems/common-admin/labs'
import type { Ref } from 'vue'
import {
  fetchKeywordListByIds,
  useFetchKeyword,
  useFetchKeywordList,
  useUpdateKeyword,
} from '@/domains/coreDam/keyword/api/keywordApi'
import { useKeywordOneStore } from '@/domains/coreDam/keyword/store/keywordStore'

const { showValidationError, showRecordWas, showErrorsDefault } = useAlerts()

const datatableHiddenColumns = ref<Array<string>>(['id'])
const listLoading = ref(false)
const detailLoading = ref(false)
const saveButtonLoading = ref(false)
const saveAndCloseButtonLoading = ref(false)

export const useKeywordListActions = () => {
  const { currentExtSystemId } = useCurrentExtSystem()
  const listItems = ref<DamKeyword[]>([])
  const { executeFetch } = useFetchKeywordList()

  const fetchList = async (pagination: Ref<Pagination>, filterData: FilterData, filterConfig: FilterConfig) => {
    listLoading.value = true
    pagination.value.sortBy = filterData.text ? null : { key: 'createdAt', order: SortOrder.Asc }
    try {
      listItems.value = await executeFetch(pagination, filterData, filterConfig, {
        urlParams: { extSystemId: currentExtSystemId.value },
      })
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

export const useKeywordDetailActions = () => {
  const keywordOneStore = useKeywordOneStore()
  const { keyword } = storeToRefs(keywordOneStore)
  const { fetchCachedUsers, addToCachedUsers } = useDamCachedUsers()

  const fetchData = async (id: string) => {
    detailLoading.value = true
    try {
      const { executeRequest: fetchKeyword } = useFetchKeyword()
      const keyword = await fetchKeyword({ urlParams: { id } })
      keywordOneStore.setKeyword(keyword)
      addToCachedUsers(keyword.createdBy, keyword.modifiedBy)
      fetchCachedUsers()
    } catch (error) {
      showErrorsDefault(error)
    } finally {
      detailLoading.value = false
    }
  }

  return {
    detailLoading,
    keyword,
    fetchData,
    resetStore: keywordOneStore.reset,
  }
}

export const useKeywordEditActions = () => {
  const v$ = useVuelidate()
  const router = useRouter()
  const keywordOneStore = useKeywordOneStore()
  const { keyword } = storeToRefs(keywordOneStore)

  const fetchData = async (id: string) => {
    detailLoading.value = true
    try {
      const { executeRequest: fetchKeyword } = useFetchKeyword()
      const keyword = await fetchKeyword({ urlParams: { id } })
      keywordOneStore.setKeyword(keyword)
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
      const { executeRequest: updateKeyword } = useUpdateKeyword()
      await updateKeyword({ urlParams: { id: keywordOneStore.keyword.id }, object: keyword.value })
      showRecordWas('updated')
      if (!close) return
      router.push({ name: '/(coreDam)/keywords' })
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
    keyword,
    fetchData,
    onUpdate,
    resetStore: keywordOneStore.reset,
  }
}

export const useKeywordSelectActions = () => {
  const { currentExtSystemId } = useCurrentExtSystem()
  const { executeFetch } = useFetchKeywordList()

  const mapToValueObject = (keyword: DamKeyword): ValueObjectOption<string> => ({
    title: keyword.name,
    value: keyword.id,
  })

  const mapToMinimal = (keyword: DamKeyword): DamKeywordMinimal => ({
    id: keyword.id,
    name: keyword.name,
  })

  const mapToValueObjects = (keywords: DamKeyword[]): ValueObjectOption<string>[] => {
    return keywords.map((keyword: DamKeyword) => mapToValueObject(keyword))
  }

  const mapToMinimals = (keywords: DamKeyword[]): DamKeywordMinimal[] => {
    return keywords.map((keyword: DamKeyword) => mapToMinimal(keyword))
  }

  const fetchItems = async (pagination: Ref<Pagination>, filterData: FilterData, filterConfig: FilterConfig) => {
    return mapToValueObjects(
      await executeFetch(pagination, filterData, filterConfig, {
        urlParams: { extSystemId: currentExtSystemId.value },
      })
    )
  }

  const fetchItemsMinimal = async (pagination: Ref<Pagination>, filterData: FilterData, filterConfig: FilterConfig) => {
    return mapToMinimals(
      await executeFetch(pagination, filterData, filterConfig, {
        urlParams: { extSystemId: currentExtSystemId.value },
      })
    )
  }

  const fetchItemsByIds = async (ids: string[]) => {
    return mapToValueObjects(await fetchKeywordListByIds(currentExtSystemId.value, ids))
  }

  return {
    mapToValueObject,
    fetchItems,
    fetchItemsByIds,
    fetchItemsMinimal,
  }
}
