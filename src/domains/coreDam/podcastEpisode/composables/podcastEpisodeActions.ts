import type { DocId, FilterConfig, FilterData, Pagination } from '@anzusystems/common-admin'
import { defineRecordLoader, syncUserAndTimeTracking, useAlerts, usePageNavigation } from '@anzusystems/common-admin'
import { useVuelidate } from '@vuelidate/core'
import { storeToRefs } from 'pinia'
import type { Ref } from 'vue'
import { ref } from 'vue'

import {
  useDeletePodcastEpisode,
  useFetchPodcastEpisode,
  useFetchPodcastEpisodeListByPodcast,
  useUpdatePodcastEpisode,
} from '@/domains/coreDam/podcastEpisode/api/podcastEpisodeApi'
import { usePodcastEpisodeOneStore } from '@/domains/coreDam/podcastEpisode/store/podcastEpisodeStore'
import type { PodcastEpisode } from '@/domains/coreDam/podcastEpisode/types/PodcastEpisode'

const { showValidationError, showRecordWas, showErrorsDefault } = useAlerts()

const datatableHiddenColumns = ref<Array<string>>(['id'])
const listLoading = ref(false)
const detailLoading = ref(false)
const saveButtonLoading = ref(false)
const saveAndCloseButtonLoading = ref(false)

export const usePodcastEpisodeListActions = () => {
  const listItems = ref<PodcastEpisode[]>([])
  const { execute } = useFetchPodcastEpisodeListByPodcast()

  const fetchList = async (
    podcastId: DocId,
    pagination: Ref<Pagination>,
    filterData: FilterData,
    filterConfig: FilterConfig
  ) => {
    listLoading.value = true
    try {
      listItems.value = await execute(pagination, filterData, filterConfig, { urlParams: { podcastId } })
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
  const { execute: deletePodcastEpisode } = useDeletePodcastEpisode()

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
  const { execute: fetchPodcastEpisode } = useFetchPodcastEpisode()

  const fetchData = defineRecordLoader(detailLoading, async (id: DocId, signal) => {
    const podcastEpisode = await fetchPodcastEpisode({ urlParams: { id }, signal })
    podcastEpisodeOneStore.setPodcastEpisode(podcastEpisode)
  })

  return {
    podcastEpisode,
    detailLoading,
    fetchData,
    resetStore: podcastEpisodeOneStore.reset,
  }
}

export const usePodcastEpisodeEditActions = () => {
  const v$ = useVuelidate()
  const { push } = usePageNavigation()
  const podcastEpisodeOneStore = usePodcastEpisodeOneStore()
  const { podcastEpisode } = storeToRefs(podcastEpisodeOneStore)
  const { execute: fetchPodcastEpisode } = useFetchPodcastEpisode()
  const { execute: updatePodcastEpisode } = useUpdatePodcastEpisode()

  const fetchData = defineRecordLoader(detailLoading, async (id: string, signal) => {
    const podcastEpisode = await fetchPodcastEpisode({ urlParams: { id }, signal })
    podcastEpisodeOneStore.setPodcastEpisode(podcastEpisode)
  })

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
      const res = await updatePodcastEpisode({
        urlParams: { id: podcastEpisodeOneStore.podcastEpisode.id },
        body: podcastEpisode.value,
      })
      syncUserAndTimeTracking(podcastEpisodeOneStore.podcastEpisode, res)
      showRecordWas('updated')
      if (!close || !podcastEpisodeOneStore.podcastEpisode.podcast) return
      push({ name: '/(coreDam)/podcasts/[id]', params: { id: podcastEpisodeOneStore.podcastEpisode.podcast } })
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
