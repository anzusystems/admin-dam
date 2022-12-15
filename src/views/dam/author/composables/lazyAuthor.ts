import { ref } from 'vue'
import { useAddToLazyHelper, useAllHelper } from '@/composables/system/lazyFetchHelpers'
import type { Author } from '@/types/dam/Author'
import { fetchAuthorListByIds } from '@/services/api/dam/authorApi'
import { useCurrentExtSystem } from '@/composables/system/currentExtSystem'
import type { ValueObjectOption } from '@/types/ValueObject'
import { useAuthorSelectActions } from '@/views/dam/author/composables/authorActions'

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

type ArrayScalarType<T> = T | Array<T>

function someFunction<T extends ArrayScalarType<string | number | null | undefined>>(type: T): T {
  return type
}

someFunction('1')

someFunction(1)

someFunction([1])

someFunction(['1'])

someFunction(['1', 1, 0, undefined])

someFunction({}) // invalid
