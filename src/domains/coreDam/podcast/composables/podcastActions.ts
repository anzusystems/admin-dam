import type {
  FilterConfig,
  FilterData,
  IntegerId,
  IntegerIdNullable,
  Pagination,
  ValueObjectOption,
} from '@anzusystems/common-admin'
import {
  handleRecordLoadError,
  isUndefined,
  renumberPositions,
  useAlerts,
  usePageNavigation,
} from '@anzusystems/common-admin'
import { useVuelidate } from '@vuelidate/core'
import { storeToRefs } from 'pinia'
import type { Ref } from 'vue'
import { ref } from 'vue'

import { useCurrentExtSystem } from '@/domains/coreDam/asset/composables/currentExtSystem'
import {
  useFetchPodcast,
  useFetchPodcastListByExtSystem,
  useFetchPodcastListByIds,
  useUpdatePodcast,
} from '@/domains/coreDam/podcast/api/podcastApi'
import { usePodcastOneStore } from '@/domains/coreDam/podcast/store/podcastStore'
import type { Podcast } from '@/domains/coreDam/podcast/types/Podcast'

const { showValidationError, showRecordWas, showErrorsDefault } = useAlerts()

const datatableHiddenColumns = ref<Array<string>>(['id'])
const listLoading = ref(false)
const detailLoading = ref(false)
const saveButtonLoading = ref(false)
const saveAndCloseButtonLoading = ref(false)

export const usePodcastListActions = () => {
  const { currentExtSystemId } = useCurrentExtSystem()
  const { execute } = useFetchPodcastListByExtSystem()

  const listItems = ref<Podcast[]>([])

  const fetchList = async (pagination: Ref<Pagination>, filterData: FilterData, filterConfig: FilterConfig) => {
    listLoading.value = true
    try {
      listItems.value = await execute(pagination, filterData, filterConfig, {
        urlParams: { extSystemId: currentExtSystemId.value },
      })
    } catch (error) {
      showErrorsDefault(error)
    } finally {
      listLoading.value = false
    }
  }

  return {
    datatableHiddenColumns,
    listLoading,
    listItems,
    fetchList,
  }
}

export const usePodcastDetailActions = () => {
  const podcastOneStore = usePodcastOneStore()
  const { podcast } = storeToRefs(podcastOneStore)
  const { execute: fetchPodcast } = useFetchPodcast()

  const fetchData = async (id: string, options: { signal?: AbortSignal } = {}): Promise<boolean | undefined> => {
    detailLoading.value = true
    try {
      const podcast = await fetchPodcast({ urlParams: { id }, signal: options.signal })
      podcastOneStore.setPodcast(podcast)
      return true
    } catch (error) {
      return handleRecordLoadError(error) ? false : undefined
    } finally {
      // An aborted load belongs to a page that is gone; the flag is the next page's by now.
      if (!options.signal?.aborted) detailLoading.value = false
    }
  }

  return {
    detailLoading,
    podcast,
    fetchData,
    resetStore: podcastOneStore.reset,
  }
}

export const usePodcastEditActions = () => {
  const v$ = useVuelidate()
  const { push } = usePageNavigation()
  const podcastOneStore = usePodcastOneStore()
  const { podcast } = storeToRefs(podcastOneStore)
  const { execute: fetchPodcast } = useFetchPodcast()
  const { execute: updatePodcast } = useUpdatePodcast()

  const fetchData = async (id: string, options: { signal?: AbortSignal } = {}): Promise<boolean | undefined> => {
    detailLoading.value = true
    try {
      const podcast = await fetchPodcast({ urlParams: { id }, signal: options.signal })
      podcastOneStore.setPodcast(podcast)
      return true
    } catch (error) {
      return handleRecordLoadError(error) ? false : undefined
    } finally {
      if (!options.signal?.aborted) detailLoading.value = false
    }
  }

  const onUpdate = async (close = false, onSuccess: ((podcast: Podcast) => void) | undefined = undefined) => {
    try {
      close ? (saveAndCloseButtonLoading.value = true) : (saveButtonLoading.value = true)
      v$.value.$touch()
      if (v$.value.$invalid) {
        showValidationError()
        saveButtonLoading.value = false
        saveAndCloseButtonLoading.value = false
        return
      }
      // Renumber positions to match the editor's visual order; new rows carry a negative temp id
      // for the editor key, but the API expects id 0 to create a new export-data entity.
      const object: Podcast = {
        ...podcast.value,
        exportData: renumberPositions(podcast.value.exportData).map((item) =>
          item.id < 0 ? { ...item, id: 0 } : item
        ),
      }
      const updatedPodcast = await updatePodcast({
        urlParams: { id: podcastOneStore.podcast.id },
        body: object,
      })
      // Adopt the server response (real ids for new rows, sorted by `setPodcast`) so the
      // editor can re-baseline via `commit()` and saved rows lose their unsaved markers.
      podcastOneStore.setPodcast(updatedPodcast)
      showRecordWas('updated')
      if (!isUndefined(onSuccess)) onSuccess(updatedPodcast)
      if (!close) return
      push({ name: '/(coreDam)/podcasts' })
    } catch (error) {
      showErrorsDefault(error)
    } finally {
      saveButtonLoading.value = false
      saveAndCloseButtonLoading.value = false
    }
  }

  return {
    detailLoading,
    saveButtonLoading,
    saveAndCloseButtonLoading,
    podcast,
    fetchData,
    onUpdate,
    resetStore: podcastOneStore.reset,
  }
}

// `extSystemId` getter lets callers scope to a specific ext-system (e.g. the synthesize dialog where
// the user picks one); omitted or empty → falls back to the global current ext-system.
export const usePodcastSelectActions = (extSystemId?: () => IntegerIdNullable | undefined) => {
  const { currentExtSystemId } = useCurrentExtSystem()
  const { execute } = useFetchPodcastListByExtSystem()
  const resolveExtSystemId = (): IntegerId => extSystemId?.() || currentExtSystemId.value

  const fetchItems = async (pagination: Ref<Pagination>, filterData: FilterData, filterConfig: FilterConfig) => {
    const podcasts = await execute(pagination, filterData, filterConfig, {
      urlParams: { extSystemId: resolveExtSystemId() },
    })

    return <ValueObjectOption<string>[]>podcasts.map((podcast: Podcast) => ({
      title: podcast.texts.title,
      value: podcast.id,
    }))
  }

  const fetchItemsByIds = async (ids: string[]) => {
    const { execute: executeFetchByIds } = useFetchPodcastListByIds()
    const podcasts = await executeFetchByIds(ids, { urlParams: { extSystemId: resolveExtSystemId() } })

    return <ValueObjectOption<string>[]>podcasts.map((podcast: Podcast) => ({
      title: podcast.texts.title,
      value: podcast.id,
    }))
  }

  return {
    fetchItems,
    fetchItemsByIds,
  }
}
