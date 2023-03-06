import type { Ref } from 'vue'
import type { DocId, IntegerId } from '@anzusystems/common-admin'
import { isArray, isNull, isUndefined } from '@anzusystems/common-admin'
import { useDebounceFn } from '@vueuse/core'

// TODO: WIP version
export type AddToCachedArgs<T extends DocId | IntegerId> =
  | Array<T | null | undefined>
  | Array<Array<T | null | undefined> | T | null | undefined>

export interface CachedItem {
  _loaded: boolean
}

/**
 * @template I Identifier type
 * @template M Minimal type
 */
export function useAllHelper<I extends DocId | IntegerId, M extends Record<string | '_loaded', any>>(
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
 * @template I Identifier type
 * @template T Source type
 * @template M Minimal type
 */
export function useAddToLazyHelper<
  I extends DocId | IntegerId,
  T extends Record<string, any>,
  M extends Record<string | '_loaded', any>
>(cache: Ref<Map<I, M>>, toFetch: Ref<Set<I>>) {
  const addToCache = (mapCallback: (id: I) => M, ...args: AddToCachedArgs<I>) => {
    for (let i = 0; i < args.length; i++) {
      const arg = args[i]
      if (isNull(arg) || isUndefined(arg)) continue
      if (isArray(arg)) {
        for (let j = 0; j < arg.length; j++) {
          const item = arg[j]
          if (isNull(item) || isUndefined(item)) continue
          if (!cache.value.has(item)) toFetch.value.add(item)
        }
        continue
      }
      if (!cache.value.has(arg)) toFetch.value.add(arg)
    }
    toFetch.value.forEach((item) => {
      cache.value.set(item, { ...mapCallback(item), ...{ _loaded: false } })
    })
  }

  const updateMap = (cache: Ref<Map<I, M>>, data: T[], propId = 'id', mapCallback: (source: T) => M) => {
    for (let i = 0; i < data.length; i += 1) {
      cache.value.set(data[i][propId], { ...mapCallback(data[i]), ...{ _loaded: true } })
    }
  }

  const updateToFetch = (ids: Array<I>, toFetch: Ref<Set<I>>) => {
    for (let i = 0; i < ids.length; i += 1) {
      toFetch.value.delete(ids[i])
    }
  }

  const manualAdd = (all: Ref<Map<I, M>>, data: T, propId = 'id', mapCallback: (source: T) => M) => {
    all.value.set(data[propId], { ...mapCallback(data), ...{ _loaded: true } })
  }

  async function fetch(
    cache: Ref<Map<I, M>>,
    toFetch: Ref<Set<I>>,
    propId = 'id',
    mapCallback: (source: T) => M,
    fetchCallback: (ids: I[]) => Promise<T[]>
  ) {
    if (toFetch.value.size > 0) {
      const ids = Array.from(toFetch.value)
      const res = await fetchCallback(ids)
      updateToFetch(ids, toFetch)
      updateMap(cache, res, propId, mapCallback)
    }
  }

  const fetchNotLoaded = async (
    cache: Ref<Map<I, M>>,
    toFetch: Ref<Set<I>>,
    propId = 'id',
    mapCallback: (source: T) => M,
    fetchCallback: (ids: I[]) => Promise<T[]>
  ) => {
    return useDebounceFn(
      async () => {
        await fetch(cache, toFetch, propId, mapCallback, fetchCallback)
      },
      1000,
      { maxWait: 3000 }
    )
  }

  return {
    fetchNotLoaded,
    addToCache,
    updateMap,
    manualAdd,
  }
}
