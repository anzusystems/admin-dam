import type { Ref } from 'vue'
import type { DocId, IntegerId } from '@/types/common'

// TODO: WIP version

/**
 * @template M Minimal type
 * @template I Identifier type
 */
export function useAllHelper<M extends Record<string | '_loaded', any>, I extends DocId | IntegerId = IntegerId>(
  cache: Ref<Map<I, M>>
) {
  const get = (id: I | null | undefined): M | undefined => {
    if (!id) return undefined
    return cache.value.get(id)
  }

  const has = (id: I | null | undefined): boolean => {
    if (!id) return false
    return cache.value.has(id)
  }

  const isLoaded = (id: I | null | undefined): boolean => {
    if (!id) return false
    const item = cache.value.get(id)
    if (!item) return false
    return item._loaded
  }

  return {
    get,
    has,
    isLoaded,
  }
}

/**
 * @template T Source type
 * @template M Minimal type
 * @template I Identifier type
 */
export function useAddToLazyHelper<
  T extends Record<string, any>,
  M extends Record<string | '_loaded', any>,
  I extends DocId | IntegerId = IntegerId
>(cache: Ref<Map<I, M>>) {
  const addToCache = (id: I, mapCallback: (id: I) => M) => {
    if (cache.value.has(id)) return
    cache.value.set(id, { ...mapCallback(id), ...{ _loaded: false } })
  }

  const updateMap = (cache: Ref<Map<I, M>>, data: T[], propId = 'id', mapCallback: (source: T) => M) => {
    for (let i = 0; i < data.length; i += 1) {
      cache.value.set(data[i][propId], { ...mapCallback(data[i]), ...{ _loaded: true } })
    }
  }

  const manualAdd = (all: Ref<Map<I, M>>, data: T, propId = 'id', mapCallback: (source: T) => M) => {
    all.value.set(data[propId], { ...mapCallback(data), ...{ _loaded: true } })
  }

  // todo: block quick api calls
  const fetchNotLoaded = async (
    cache: Ref<Map<I, M>>,
    propId = 'id',
    mapCallback: (source: T) => M,
    fetchCallback: (ids: I[]) => Promise<T[]>
  ) => {
    const idsToFetch: Array<I> = []
    cache.value.forEach((item) => {
      if (item._loaded === false && !idsToFetch.includes(item[propId])) idsToFetch.push(item[propId])
    })
    if (idsToFetch.length > 0) {
      const res = await fetchCallback(idsToFetch)
      updateMap(cache, res, 'id', mapCallback)
      return res
    }
    return [] as T[]
  }

  return {
    fetchNotLoaded,
    addToCache,
    updateMap,
    manualAdd,
  }
}
