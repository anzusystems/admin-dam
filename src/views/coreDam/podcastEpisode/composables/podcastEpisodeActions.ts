import type { DocId, FilterBag, Pagination } from '@anzusystems/common-admin'
import { useAlerts } from '@anzusystems/common-admin'
import { ref } from 'vue'
import {
  deletePodcastEpisode,
  fetchPodcastEpisode,
  fetchPodcastEpisodeListByPodcast,
  updatePodcastEpisode,
} from '@/services/api/coreDam/podcastEpisodeApi'
import type { PodcastEpisode } from '@/types/coreDam/PodcastEpisode'
import { storeToRefs } from 'pinia'
import { usePodcastEpisodeOneStore } from '@/stores/coreDam/podcastEpisodeStore'
import useVuelidate from '@vuelidate/core'
import { useRouter } from 'vue-router'
import { ROUTE } from '@/router/routes'

const { showValidationError, showRecordWas, showErrorsDefault } = useAlerts()

const listLoading = ref(false)
const detailLoading = ref(false)
const saveButtonLoading = ref(false)
const saveAndCloseButtonLoading = ref(false)

export const usePodcastEpisodeListActions = () => {
  const listItems = ref<PodcastEpisode[]>([])

  const fetchList = async (podcastId: DocId, pagination: Pagination, filterBag: FilterBag) => {
    listLoading.value = true
    try {
      listItems.value = await fetchPodcastEpisodeListByPodcast(podcastId, pagination, filterBag)
    } catch (error) {
      showErrorsDefault(error)
    } finally {
      listLoading.value = false
    }
  }

  return {
    listLoading,
    listItems,
    fetchList,
  }
}

export const usePodcastEpisodeRemoveActions = () => {
  const deletePodcast = async (id: DocId, onSuccessfulCallback: () => void) => {
    try {
      await deletePodcastEpisode(id)
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

  const fetchData = async (id: DocId) => {
    detailLoading.value = true
    try {
      const podcastEpisode = await fetchPodcastEpisode(id)
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

  const fetchData = async (id: string) => {
    detailLoading.value = true
    try {
      const podcastEpisode = await fetchPodcastEpisode(id)
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
      await updatePodcastEpisode(podcastEpisodeOneStore.podcastEpisode.id, podcastEpisode.value)
      showRecordWas('updated')
      if (!close || !podcastEpisodeOneStore.podcastEpisode.podcast) return
      router.push({ name: ROUTE.DAM.PODCAST.DETAIL, params: { id: podcastEpisodeOneStore.podcastEpisode.podcast } })
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
