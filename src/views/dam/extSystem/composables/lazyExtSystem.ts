import { ref } from 'vue'
import { useAddToLazyHelper, useAllHelper } from '@/composables/system/lazyFetchHelpers'
import { fetchExtSystemListByIds } from '@/services/api/dam/extSystemApi'
import type { ExtSystem, ExtSystemMinimal } from '@/types/dam/ExtSystem'

const all = ref<Map<number, ExtSystemMinimal>>(new Map())
const allIds = ref<Set<number>>(new Set([]))

const mapToMinimal = (source: ExtSystem): ExtSystemMinimal => {
  return { id: source.id, name: source.name }
}

export function loadLazyExtSystem(forceRefresh = false) {
  const { fetchByIds, addToLazy } = useAddToLazyHelper<ExtSystem, ExtSystemMinimal>()

  const fetchLazyExtSystem = () => fetchByIds(all, forceRefresh, mapToMinimal, fetchExtSystemListByIds)

  const addToLazyExtSystemBuffer = (id: number) => {
    allIds.value.add(id)
    return addToLazy(id)
  }

  return {
    addToLazyExtSystemBuffer,
    fetchLazyExtSystem,
  }
}

export function useLazyExtSystem() {
  return useAllHelper<ExtSystemMinimal>(all, allIds)
}
