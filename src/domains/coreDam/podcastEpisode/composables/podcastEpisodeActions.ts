import type { FilterConfig, FilterData, Pagination } from '@anzusystems/common-admin/labs'
import type { Ref } from 'vue'
import {
  useDeletePodcastEpisode,
  useFetchPodcastEpisode,
  useFetchPodcastEpisodeListByPodcast,
  useUpdatePodcastEpisode,
} from '@/domains/coreDam/podcastEpisode/api/podcastEpisodeApi'
import type { PodcastEpisode } from '@/domains/coreDam/podcastEpisode/types/PodcastEpisode'
import { usePodcastEpisodeOneStore } from '@/domains/coreDam/podcastEpisode/store/podcastEpisodeStore'

const { showValidationError, showRecordWas, showErrorsDefault } = useAlerts()

const datatableHiddenColumns = ref<Array<string>>(['id'])
const listLoading = ref(false)
const detailLoading = ref(false)
const saveButtonLoading = ref(false)
const saveAndCloseButtonLoading = ref(false)

export const usePodcastEpisodeListActions = () => {
  const listItems = ref<PodcastEpisode[]>([])
  const { executeFetch } = useFetchPodcastEpisodeListByPodcast()

  const fetchList = async (
    podcastId: DocId,
    pagination: Ref<Pagination>,
    filterData: FilterData,
    filterConfig: FilterConfig
  ) => {
    listLoading.value = true
    try {
      listItems.value = await executeFetch(pagination, filterData, filterConfig, { urlParams: { podcastId } })
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

export const usePodcastEpisodeRemoveActions = () => {
  const { executeRequest: deletePodcastEpisode } = useDeletePodcastEpisode()

  const deletePodcast = async (id: DocId, onSuccessfulCallback: () => void) => {
    detailLoading.value = true
    try {
      await deletePodcastEpisode({ urlParams: { id } })
      onSuccessfulCallback()
    } catch (error) {
      showErrorsDefault(error)
    } finally {
      detailLoading.value = false
    }
  }

  return {
    deletePodcast,
  }
}

export const usePodcastEpisodeDetailActions = () => {
  const podcastEpisodeOneStore = usePodcastEpisodeOneStore()
  const { podcastEpisode } = storeToRefs(podcastEpisodeOneStore)
  const { executeRequest: fetchPodcastEpisode } = useFetchPodcastEpisode()

  const fetchData = async (id: DocId) => {
    detailLoading.value = true
    try {
      const podcastEpisode = await fetchPodcastEpisode({ urlParams: { id } })
      podcastEpisodeOneStore.setPodcastEpisode(podcastEpisode)
    } catch (error) {
      showErrorsDefault(error)
    } finally {
      detailLoading.value = false
    }
  }

  return {
    podcastEpisode,
    detailLoading,
    fetchData,
    resetStore: podcastEpisodeOneStore.reset,
  }
}

export const usePodcastEpisodeEditActions = () => {
  const v$ = useVuelidate()
  const router = useRouter()
  const podcastEpisodeOneStore = usePodcastEpisodeOneStore()
  const { podcastEpisode } = storeToRefs(podcastEpisodeOneStore)
  const { executeRequest: fetchPodcastEpisode } = useFetchPodcastEpisode()
  const { executeRequest: updatePodcastEpisode } = useUpdatePodcastEpisode()

  const fetchData = async (id: string) => {
    detailLoading.value = true
    try {
      const podcastEpisode = await fetchPodcastEpisode({ urlParams: { id } })
      podcastEpisodeOneStore.setPodcastEpisode(podcastEpisode)
    } catch (error) {
      showErrorsDefault(error)
    } finally {
      detailLoading.value = false
    }
  }

  const onUpdate = async (close = false) => {
    try {
      close ? (saveAndCloseButtonLoading.value = true) : (saveButtonLoading.value = true)
      v$.value.$touch()
      if (v$.value.$invalid) {
        showValidationError()
        saveButtonLoading.value = false
        saveAndCloseButtonLoading.value = false
        return
      }
      await updatePodcastEpisode({
        urlParams: { id: podcastEpisodeOneStore.podcastEpisode.id },
        object: podcastEpisode.value,
      })
      showRecordWas('updated')
      if (!close || !podcastEpisodeOneStore.podcastEpisode.podcast) return
      router.push({ name: '/(coreDam)/podcasts/[id]', params: { id: podcastEpisodeOneStore.podcastEpisode.podcast } })
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
    podcastEpisode,
    fetchData,
    onUpdate,
    resetStore: podcastEpisodeOneStore.reset,
  }
}
