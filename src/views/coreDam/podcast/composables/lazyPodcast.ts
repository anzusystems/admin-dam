import { ref } from 'vue'
import { useAddToLazyHelper, useAllHelper } from '@/composables/system/lazyFetchHelpers'
import type { Podcast } from '@/types/coreDam/Podcast'
import { fetchPodcastListByIds } from '@/services/api/coreDam/podcastApi'

import type { ValueObjectOption } from '@anzusystems/common-admin'
import { useCurrentExtSystem } from '@/composables/system/currentExtSystem'

const all = ref<Map<string, ValueObjectOption<string>>>(new Map())
const allIds = ref<Set<string>>(new Set([]))

const mapToValueObject = (podcast: Podcast): ValueObjectOption<string> => ({
  title: podcast.texts.title,
  value: podcast.id,
})

export function loadLazyPodcast(forceRefresh = false) {
  const { fetchByIds, addToLazy, manualAdd } = useAddToLazyHelper<Podcast, ValueObjectOption<string>, string>()

  const { currentExtSystemId } = useCurrentExtSystem()

  const fetchLazyPodcast = () =>
    fetchByIds(
      all,
      forceRefresh,
      (podcast: Podcast) => mapToValueObject(podcast),
      (ids) => fetchPodcastListByIds(currentExtSystemId.value, ids)
    )

  const addToLazyPodcastBuffer = (id: string) => {
    allIds.value.add(id)
    return addToLazy(id)
  }

  const manualAddLazyPodcast = (data: Podcast) => {
    allIds.value.add(data.id)
    manualAdd(all, data, 'id', mapToValueObject)
  }

  return {
    addToLazyPodcastBuffer,
    fetchLazyPodcast,
    manualAddLazyPodcast,
  }
}

export function useLazyPodcast() {
  return useAllHelper<ValueObjectOption<string>, string>(all, allIds)
}
