import { useCurrentExtSystem } from '@/composables/system/currentExtSystem'
import type { FilterBag, Pagination, ValueObjectOption } from '@anzusystems/common-admin'
import { useAlerts, useErrorHandler } from '@anzusystems/common-admin'
import { ref } from 'vue'
import { fetchKeyword, fetchKeywordList, fetchKeywordListByIds, updateKeyword } from '@/services/api/coreDam/keywordApi'
import type { Keyword, KeywordMinimal } from '@/types/coreDam/Keyword'
import { storeToRefs } from 'pinia'
import { useKeywordOneStore } from '@/stores/coreDam/keywordStore'
import useVuelidate from '@vuelidate/core'
import { useRouter } from 'vue-router'
import { ROUTE } from '@/router/routes'

const { showValidationError, showRecordWas } = useAlerts()
const { handleError } = useErrorHandler()

const listLoading = ref(false)
const detailLoading = ref(false)
const saveButtonLoading = ref(false)
const saveAndCloseButtonLoading = ref(false)

export const useKeywordListActions = () => {
  const { currentExtSystemId } = useCurrentExtSystem()
  const listItems = ref<Keyword[]>([])

  const fetchList = async (pagination: Pagination, filterBag: FilterBag) => {
    listLoading.value = true
    try {
      listItems.value = await fetchKeywordList(currentExtSystemId.value, pagination, filterBag)
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

export const useKeywordDetailActions = () => {
  const keywordOneStore = useKeywordOneStore()
  const { keyword } = storeToRefs(keywordOneStore)

  const fetchData = async (id: string) => {
    detailLoading.value = true
    try {
      const keyword = await fetchKeyword(id)
      keywordOneStore.setKeyword(keyword)
    } catch (error) {
      handleError(error)
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
      await updateKeyword(keywordOneStore.keyword.id, keyword.value)
      showRecordWas('updated')
      if (!close) return
      router.push({ name: ROUTE.DAM.KEYWORD.LIST })
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
    keyword,
    fetchData,
    onUpdate,
    resetStore: keywordOneStore.reset,
  }
}

export const useKeywordSelectActions = () => {
  const { currentExtSystemId } = useCurrentExtSystem()

  const mapToValueObject = (keyword: Keyword): ValueObjectOption<string> => ({
    title: keyword.name,
    value: keyword.id,
  })

  const mapToMinimal = (keyword: Keyword): KeywordMinimal => ({
    id: keyword.id,
    name: keyword.name,
  })

  const mapToValueObjects = (keywords: Keyword[]): ValueObjectOption<string>[] => {
    return keywords.map((keyword: Keyword) => mapToValueObject(keyword))
  }

  const mapToMinimals = (keywords: Keyword[]): KeywordMinimal[] => {
    return keywords.map((keyword: Keyword) => mapToMinimal(keyword))
  }

  const fetchItems = async (pagination: Pagination, filterBag: FilterBag) => {
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
