import { useUiHelper } from '@/composables/system/uiHelper'
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

const { loaderOn, loaderOff, btnDisable, btnEnable, btnLoadingOn, btnReset } = useUiHelper()
const { showValidationError, showRecordWas } = useAlerts()
const { handleError } = useErrorHandler()

export const usePodcastEpisodeListActions = () => {
  const listItems = ref<PodcastEpisode[]>([])

  const fetchList = async (podcastId: DocId, pagination: Pagination, filterBag: FilterBag) => {
    loaderOn('list')
    try {
      listItems.value = await fetchPodcastEpisodeListByPodcast(podcastId, pagination, filterBag)
    } catch (error) {
      handleError(error)
    } finally {
      loaderOff('list')
    }
  }

  return {
    listItems,
    fetchList,
  }
}

export const usePodcastEpisodeDetailActions = () => {
  const podcastEpisodeOneStore = usePodcastEpisodeOneStore()
  const { podcastEpisode, loaded } = storeToRefs(podcastEpisodeOneStore)

  const fetchData = async (id: string) => {
    loaderOn('detail')
    try {
      const podcastEpisode = await fetchPodcastEpisode(id)
      podcastEpisodeOneStore.setPodcastEpisode(podcastEpisode)
      podcastEpisodeOneStore.setLoaded(true)
    } catch (error) {
      handleError(error)
    } finally {
      loaderOff('detail')
    }
  }

  return {
    podcastEpisode,
    loaded,
    fetchData,
    resetStore: podcastEpisodeOneStore.reset,
  }
}

export const usePodcastEpisodeEditActions = () => {
  const v$ = useVuelidate()
  const router = useRouter()
  const podcastEpisodeOneStore = usePodcastEpisodeOneStore()
  const { podcastEpisode, loaded } = storeToRefs(podcastEpisodeOneStore)

  const fetchData = async (id: string) => {
    loaderOn('edit')
    try {
      const podcastEpisode = await fetchPodcastEpisode(id)
      podcastEpisodeOneStore.setPodcastEpisode(podcastEpisode)
      podcastEpisodeOneStore.setLoaded(true)
    } catch (error) {
      handleError(error)
    } finally {
      loaderOff('edit')
    }
  }

  const onUpdate = async (close = false) => {
    try {
      btnDisable('save', 'saveAndClose', 'delete')
      v$.value.$touch()
      if (v$.value.$invalid) {
        showValidationError()
        btnEnable('save', 'saveAndClose', 'delete')
        return
      }
      btnDisable(close ? 'save' : 'saveAndClose', 'delete')
      btnLoadingOn(close ? 'saveAndClose' : 'save')
      await updatePodcastEpisode(podcastEpisodeOneStore.podcastEpisode.id, podcastEpisode.value)
      showRecordWas('updated')
      if (!close || !podcastEpisodeOneStore.podcastEpisode.podcast) return
      router.push({ name: ROUTE.DAM.PODCAST.DETAIL, params: { id: podcastEpisodeOneStore.podcastEpisode.podcast } })
    } catch (error) {
      handleError(error)
    } finally {
      btnReset('save', 'saveAndClose', 'delete')
    }
  }

  return {
    loaded,
    podcastEpisode,
    fetchData,
    onUpdate,
    resetStore: podcastEpisodeOneStore.reset,
  }
}
