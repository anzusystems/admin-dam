import { useAlerts } from '@/composables/system/alerts'
import { useErrorHandler } from '@/composables/system/error'
import { ref } from 'vue'
import type { Pagination } from '@/types/Pagination'
import type { FilterBag } from '@/types/Filter'
import {
  fetchPodcastEpisode,
  fetchPodcastEpisodeListByPodcast,
  updatePodcastEpisode,
} from '@/services/api/dam/podcastEpisodeApi'
import type { PodcastEpisode } from '@/types/dam/PodcastEpisode'
import { storeToRefs } from 'pinia'
import { usePodcastEpisodeOneStore } from '@/stores/dam/podcastEpisodeStore'
import useVuelidate from '@vuelidate/core'
import { useRouter } from 'vue-router'
import { ROUTE } from '@/router/routes'
import type { DocId } from '@anzusystems/common-admin'

const { showValidationError, showRecordWas } = useAlerts()
const { handleError } = useErrorHandler()

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
      handleError(error)
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

export const usePodcastEpisodeDetailActions = () => {
  const podcastEpisodeOneStore = usePodcastEpisodeOneStore()
  const { podcastEpisode } = storeToRefs(podcastEpisodeOneStore)

  const fetchData = async (id: string) => {
    detailLoading.value = true
    try {
      const podcastEpisode = await fetchPodcastEpisode(id)
      podcastEpisodeOneStore.setPodcastEpisode(podcastEpisode)
    } catch (error) {
      handleError(error)
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
      handleError(error)
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
      handleError(error)
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
