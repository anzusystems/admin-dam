import type { Ref } from 'vue'
import { computed, ref } from 'vue'
import { isArray, isNull } from '@/utils/common'

export function useAllHelper<T, I extends string | number = number>(all: Ref<Map<I, T>>, ids: Ref<Set<I>>) {
  const get = (id: I | null): T | undefined => {
    if (isNull(id)) return undefined
    return all.value.get(id)
  }

  const has = (id: I | null): boolean => {
    if (isNull(id)) return false
    return all.value.has(id)
  }

  const hasId = (id: I | null): boolean => {
    if (isNull(id)) return false
    return ids.value.has(id)
  }

  const allIds = computed(() => Array.from(ids.value.values()))
  const allValues = computed(() => Array.from(all.value.values()))
  const loadedAll = computed(() => all.value.size === ids.value.size)

  return {
    get,
    has,
    allValues,
    allIds,
    hasId,
    loadedAll,
  }
}

/**
 * @template T Source type
 * @template M Minimal type
 */
export function useAddToLazyHelper<T, M, I extends string | number = number>() {
  const addBuffer = ref([])

  const filterNumberIds = (addBuffer: Ref<Array<I | null>>, all: Ref<Map<I, M>>, forceRefresh = false) => {
    const uniqueIds = [...new Set(addBuffer.value)].filter((id) => !isNull(id) && id !== 0)
    addBuffer.value = []
    return (forceRefresh ? uniqueIds : uniqueIds.filter((id) => !all.value.has(id as I))) as Array<I>
  }

  const addToLazy = (...args: Array<I | I[] | null | null[] | undefined | undefined[]>) => {
    for (let i = 0; i < args.length; i++) {
      if (isArray(args[i])) {
        // @ts-ignore
        for (let j = 0; j < args[i].length; j++) {
          // @ts-ignore
          addBuffer.value.push(args[i][j])
        }
      } else {
        // @ts-ignore
        addBuffer.value.push(args[i])
      }
    }
  }

  const updateMap = (all: Ref<Map<I, M>>, data: T[], propId = 'id', mapCallback: (source: T) => M) => {
    for (let i = 0; i < data.length; i += 1) {
      // @ts-ignore
      all.value.set(data[i][propId], mapCallback(data[i]))
    }
  }

  const manualAdd = (all: Ref<Map<I, M>>, data: T, propId = 'id', mapCallback: (source: T) => M) => {
    // @ts-ignore
    all.value.set(data[propId], mapCallback(data))
  }

  const fetchByIds = async (
    all: Ref<Map<I, M>>,
    forceRefresh = false,
    mapCallback: (source: T) => M,
    fetchCallback: (ids: I[]) => Promise<T[]>
  ) => {
    const idsToFetch = filterNumberIds(addBuffer, all, forceRefresh)
    if (idsToFetch.length > 0) {
      const res = await fetchCallback(idsToFetch as I[])
      updateMap(all, res, 'id', mapCallback)
    }
  }

  return {
    fetchByIds,
    addBuffer,
    addToLazy,
    filterNumberIds,
    updateMap,
    manualAdd,
  }
}
