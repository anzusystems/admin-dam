import { useCurrentExtSystem } from '@/composables/system/currentExtSystem'
import type { FilterBag, Pagination, ValueObjectOption } from '@anzusystems/common-admin'
import { useAlerts } from '@anzusystems/common-admin'
import { ref } from 'vue'
import { fetchKeyword, fetchKeywordList, fetchKeywordListByIds, updateKeyword } from '@/services/api/coreDam/keywordApi'
import type { DamKeyword, DamKeywordMinimal } from '@anzusystems/common-admin'
import { storeToRefs } from 'pinia'
import { useKeywordOneStore } from '@/stores/coreDam/keywordStore'
import useVuelidate from '@vuelidate/core'
import { useRouter } from 'vue-router'
import { ROUTE } from '@/router/routes'

const { showValidationError, showRecordWas, showErrorsDefault } = useAlerts()

const datatableHiddenColumns = ref<Array<string>>(['id'])
const listLoading = ref(false)
const detailLoading = ref(false)
const saveButtonLoading = ref(false)
const saveAndCloseButtonLoading = ref(false)

export const useKeywordListActions = () => {
  const { currentExtSystemId } = useCurrentExtSystem()
  const listItems = ref<DamKeyword[]>([])

  const fetchList = async (pagination: Pagination, filterBag: FilterBag) => {
    listLoading.value = true
    pagination.sortBy = filterBag.text.model ? null : 'id'
    try {
      listItems.value = await fetchKeywordList(currentExtSystemId.value, pagination, filterBag)
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

  const fetchData = async (id: string) => {
    detailLoading.value = true
    try {
      const keyword = await fetchKeyword(id)
      keywordOneStore.setKeyword(keyword)
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
      const keyword = await fetchKeyword(id)
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
      await updateKeyword(keywordOneStore.keyword.id, keyword.value)
      showRecordWas('updated')
      if (!close) return
      router.push({ name: ROUTE.DAM.KEYWORD.LIST })
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

  const fetchItems = async (pagination: Pagination, filterBag: FilterBag) => {
    pagination.sortBy = filterBag.text.model ? null : 'id'

    return mapToValueObjects(await fetchKeywordList(currentExtSystemId.value, pagination, filterBag))
  }

  const fetchItemsMinimal = async (pagination: Pagination, filterBag: FilterBag) => {
    return mapToMinimals(await fetchKeywordList(currentExtSystemId.value, pagination, filterBag))
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
