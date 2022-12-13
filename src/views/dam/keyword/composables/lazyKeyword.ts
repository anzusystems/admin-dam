import { ref } from 'vue'
import { useAddToLazyHelper, useAllHelper } from '@/composables/system/lazyFetchHelpers'
import type { Keyword } from '@/types/dam/Keyword'
import { fetchKeywordListByIds } from '@/services/api/dam/keywordApi'
import { useCurrentExtSystem } from '@/composables/system/currentExtSystem'
import { useKeywordSelectActions } from '@/views/dam/keyword/composables/keywordActions'
import type { ValueObjectOption } from '@/types/ValueObject'

const all = ref<Map<string, ValueObjectOption<string>>>(new Map())
const allIds = ref<Set<string>>(new Set([]))

export function loadLazyKeyword(forceRefresh = false) {
  const { fetchByIds, addToLazy, manualAdd } = useAddToLazyHelper<Keyword, ValueObjectOption<string>, string>()
  const { currentExtSystemId } = useCurrentExtSystem()
  const { mapToValueObject } = useKeywordSelectActions()

  const fetchLazyKeyword = () =>
    fetchByIds(
      all,
      forceRefresh,
      (keyword: Keyword) => mapToValueObject(keyword),
      (ids) => fetchKeywordListByIds(currentExtSystemId.value, ids)
    )

  const addToLazyKeywordBuffer = (id: string) => {
    allIds.value.add(id)
    return addToLazy(id)
  }

  const manualAddLazyKeyword = (data: Keyword) => {
    allIds.value.add(data.id)
    manualAdd(all, data, 'id', mapToValueObject)
  }

  return {
    addToLazyKeywordBuffer,
    fetchLazyKeyword,
    manualAddLazyKeyword,
  }
}

export function useLazyKeyword() {
  return useAllHelper<ValueObjectOption<string>, string>(all, allIds)
}
