import { useCurrentExtSystem } from '@/composables/system/currentExtSystem'
import { useUiHelper } from '@/composables/system/uiHelper'
import { useAlerts } from '@/composables/system/alerts'
import { useErrorHandler } from '@/composables/system/error'
import { ref } from 'vue'
import type { Pagination } from '@/types/Pagination'
import type { FilterBag } from '@/types/Filter'
import { fetchKeyword, fetchKeywordList, fetchKeywordListByIds, updateKeyword } from '@/services/api/dam/keywordApi'
import type { Keyword } from '@/types/dam/Keyword'
import { storeToRefs } from 'pinia'
import { useKeywordOneStore } from '@/stores/dam/keywordStore'
import useVuelidate from '@vuelidate/core'
import { useRouter } from 'vue-router'
import { ROUTE } from '@/router/routes'
import type { ValueObjectOption } from '@/types/ValueObject'

const { loaderOn, loaderOff, btnDisable, btnEnable, btnLoadingOn, btnReset } = useUiHelper()
const { showValidationError, showRecordWas } = useAlerts()
const { handleError } = useErrorHandler()

export const useKeywordListActions = () => {
  const { currentExtSystemId } = useCurrentExtSystem()
  const listItems = ref<Keyword[]>([])

  const fetchList = async (pagination: Pagination, filterBag: FilterBag) => {
    loaderOn('list')
    try {
      listItems.value = await fetchKeywordList(currentExtSystemId.value, pagination, filterBag)
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

export const useKeywordDetailActions = () => {
  const keywordOneStore = useKeywordOneStore()
  const { keyword, loaded } = storeToRefs(keywordOneStore)

  const fetchData = async (id: string) => {
    loaderOn('detail')
    try {
      const keyword = await fetchKeyword(id)
      keywordOneStore.setKeyword(keyword)
      keywordOneStore.setLoaded(true)
    } catch (error) {
      handleError(error)
    } finally {
      loaderOff('detail')
    }
  }

  return {
    keyword,
    loaded,
    fetchData,
    resetStore: keywordOneStore.reset,
  }
}

export const useKeywordEditActions = () => {
  const v$ = useVuelidate()
  const router = useRouter()
  const keywordOneStore = useKeywordOneStore()
  const { keyword, loaded } = storeToRefs(keywordOneStore)

  const fetchData = async (id: string) => {
    loaderOn('edit')
    try {
      const keyword = await fetchKeyword(id)
      keywordOneStore.setKeyword(keyword)
      keywordOneStore.setLoaded(true)
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
      await updateKeyword(keywordOneStore.keyword.id, keyword.value)
      showRecordWas('updated')
      if (!close) return
      router.push({ name: ROUTE.DAM.KEYWORD.LIST })
    } catch (error) {
      handleError(error)
    } finally {
      btnReset('save', 'saveAndClose', 'delete')
    }
  }

  return {
    loaded,
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

  const mapToValueObjects = (keywords: Keyword[]): ValueObjectOption<string>[] => {
    return keywords.map((keyword: Keyword) => mapToValueObject(keyword))
  }

  const fetchItems = async (pagination: Pagination, filterBag: FilterBag) => {
    return mapToValueObjects(await fetchKeywordList(currentExtSystemId.value, pagination, filterBag))
  }

  const fetchItemsByIds = async (ids: string[]) => {
    return mapToValueObjects(await fetchKeywordListByIds(currentExtSystemId.value, ids))
  }

  return {
    mapToValueObject,
    fetchItems,
    fetchItemsByIds,
  }
}
