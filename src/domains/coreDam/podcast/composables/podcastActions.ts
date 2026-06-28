import { useCurrentExtSystem } from '@/domains/coreDam/asset/composables/currentExtSystem'
import type { FilterConfig, FilterData, Pagination } from '@anzusystems/common-admin/labs'
import { renumberPositions } from '@anzusystems/common-admin/labs'
import type { Ref } from 'vue'
import {
  useFetchPodcast,
  useFetchPodcastListByExtSystem,
  useFetchPodcastListByIds,
  useUpdatePodcast,
} from '@/domains/coreDam/podcast/api/podcastApi'
import type { Podcast } from '@/domains/coreDam/podcast/types/Podcast'
import { usePodcastOneStore } from '@/domains/coreDam/podcast/store/podcastStore'

const { showValidationError, showRecordWas, showErrorsDefault } = useAlerts()

const datatableHiddenColumns = ref<Array<string>>(['id'])
const listLoading = ref(false)
const detailLoading = ref(false)
const saveButtonLoading = ref(false)
const saveAndCloseButtonLoading = ref(false)

export const usePodcastListActions = () => {
  const { currentExtSystemId } = useCurrentExtSystem()
  const { executeFetch } = useFetchPodcastListByExtSystem()

  const listItems = ref<Podcast[]>([])

  const fetchList = async (pagination: Ref<Pagination>, filterData: FilterData, filterConfig: FilterConfig) => {
    listLoading.value = true
    try {
      listItems.value = await executeFetch(pagination, filterData, filterConfig, {
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
  const { executeRequest: fetchPodcast } = useFetchPodcast()

  const fetchData = async (id: string) => {
    detailLoading.value = true
    try {
      const podcast = await fetchPodcast({ urlParams: { id } })
      podcastOneStore.setPodcast(podcast)
    } catch (error) {
      showErrorsDefault(error)
    } finally {
      detailLoading.value = false
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
  const router = useRouter()
  const podcastOneStore = usePodcastOneStore()
  const { podcast } = storeToRefs(podcastOneStore)
  const { executeRequest: fetchPodcast } = useFetchPodcast()
  const { executeRequest: updatePodcast } = useUpdatePodcast()

  const fetchData = async (id: string) => {
    detailLoading.value = true
    try {
      const podcast = await fetchPodcast({ urlParams: { id } })
      podcastOneStore.setPodcast(podcast)
    } catch (error) {
      showErrorsDefault(error)
    } finally {
      detailLoading.value = false
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
      // Persist sequential positions matching the editor's visual order before saving.
      podcast.value.exportData = renumberPositions(podcast.value.exportData)
      const updatedPodcast = await updatePodcast({
        urlParams: { id: podcastOneStore.podcast.id },
        object: podcast.value,
      })
      // Adopt the server response (real ids for new rows, sorted by `setPodcast`) so the
      // editor can re-baseline via `commit()` and saved rows lose their unsaved markers.
      podcastOneStore.setPodcast(updatedPodcast)
      showRecordWas('updated')
      if (!isUndefined(onSuccess)) onSuccess(updatedPodcast)
      if (!close) return
      router.push({ name: '/(coreDam)/podcasts' })
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
  const { executeFetch } = useFetchPodcastListByExtSystem()
  const resolveExtSystemId = (): IntegerId => extSystemId?.() || currentExtSystemId.value

  const fetchItems = async (pagination: Ref<Pagination>, filterData: FilterData, filterConfig: FilterConfig) => {
    const podcasts = await executeFetch(pagination, filterData, filterConfig, {
      urlParams: { extSystemId: resolveExtSystemId() },
    })

    return <ValueObjectOption<string>[]>podcasts.map((podcast: Podcast) => ({
      title: podcast.texts.title,
      value: podcast.id,
    }))
  }

  const fetchItemsByIds = async (ids: string[]) => {
    const { executeFetch: executeFetchByIds } = useFetchPodcastListByIds()
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
