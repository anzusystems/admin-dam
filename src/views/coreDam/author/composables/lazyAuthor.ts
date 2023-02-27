import { ref } from 'vue'
import { useAddToLazyHelper, useAllHelper } from '@/composables/system/lazyFetchHelpers'
import type { Author } from '@/types/coreDam/Author'
import { fetchAuthorListByIds } from '@/services/api/coreDam/authorApi'
import { useCurrentExtSystem } from '@/composables/system/currentExtSystem'
import type { ValueObjectOption } from '@anzusystems/common-admin'
import { useAuthorSelectActions } from '@/views/coreDam/author/composables/authorActions'

const all = ref<Map<string, ValueObjectOption<string>>>(new Map())
const allIds = ref<Set<string>>(new Set([]))

export function loadLazyAuthor(forceRefresh = false) {
  const { fetchByIds, addToLazy, manualAdd } = useAddToLazyHelper<Author, ValueObjectOption<string>, string>()
  const { currentExtSystemId } = useCurrentExtSystem()
  const { mapToValueObject } = useAuthorSelectActions()

  const fetchLazyAuthor = async () => {
    await fetchByIds(
      all,
      forceRefresh,
      (author: Author) => mapToValueObject(author),
      (ids) => fetchAuthorListByIds(currentExtSystemId.value, ids)
    )
  }

  const addToLazyAuthorBuffer = (id: string) => {
    allIds.value.add(id)
    return addToLazy(id)
  }

  const manualAddLazyAuthor = (data: Author) => {
    allIds.value.add(data.id)
    manualAdd(all, data, 'id', mapToValueObject)
  }

  return {
    addToLazyAuthorBuffer,
    fetchLazyAuthor,
    manualAddLazyAuthor,
  }
}

export function useLazyAuthor() {
  return useAllHelper<ValueObjectOption<string>, string>(all, allIds)
}
