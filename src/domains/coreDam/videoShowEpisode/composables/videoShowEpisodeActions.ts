import type { DocId, FilterConfig, FilterData, Pagination } from '@anzusystems/common-admin'
import { handleRecordLoadError, syncUserAndTimeTracking, useAlerts, usePageNavigation } from '@anzusystems/common-admin'
import { useVuelidate } from '@vuelidate/core'
import { storeToRefs } from 'pinia'
import type { Ref } from 'vue'
import { ref } from 'vue'

import {
  useFetchVideoShowEpisode,
  useFetchVideoShowEpisodeListByVideoShow,
  useUpdateVideoShowEpisode,
} from '@/domains/coreDam/videoShowEpisode/api/videoShowEpisodeApi'
import { useVideoShowEpisodeOneStore } from '@/domains/coreDam/videoShowEpisode/store/videoShowEpisodeStore'
import type { VideoShowEpisode } from '@/domains/coreDam/videoShowEpisode/types/VideoShowEpisode'

const { showValidationError, showRecordWas, showErrorsDefault } = useAlerts()

const datatableHiddenColumns = ref<Array<string>>(['id'])
const listLoading = ref(false)
const detailLoading = ref(false)
const saveButtonLoading = ref(false)
const saveAndCloseButtonLoading = ref(false)

export const useVideoShowEpisodeListActions = () => {
  const listItems = ref<VideoShowEpisode[]>([])
  const { execute } = useFetchVideoShowEpisodeListByVideoShow()

  const fetchList = async (
    videoShowId: DocId,
    pagination: Ref<Pagination>,
    filterData: FilterData,
    filterConfig: FilterConfig
  ) => {
    listLoading.value = true
    try {
      listItems.value = await execute(pagination, filterData, filterConfig, { urlParams: { videoShowId } })
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

export const useVideoShowEpisodeDetailActions = () => {
  const videoShowEpisodeOneStore = useVideoShowEpisodeOneStore()
  const { videoShowEpisode } = storeToRefs(videoShowEpisodeOneStore)

  const fetchData = async (id: string, options: { signal?: AbortSignal } = {}): Promise<boolean | undefined> => {
    detailLoading.value = true
    try {
      const { execute: fetchVideoShowEpisode } = useFetchVideoShowEpisode()
      const videoShowEpisode = await fetchVideoShowEpisode({ urlParams: { id }, signal: options.signal })
      videoShowEpisodeOneStore.setVideoShowEpisode(videoShowEpisode)
      return true
    } catch (error) {
      return handleRecordLoadError(error) ? false : undefined
    } finally {
      // An aborted load belongs to a page that is gone; the flag is the next page's by now.
      if (!options.signal?.aborted) detailLoading.value = false
    }
  }

  return {
    videoShowEpisode,
    detailLoading,
    fetchData,
    resetStore: videoShowEpisodeOneStore.reset,
  }
}

export const useVideoShowEpisodeEditActions = () => {
  const v$ = useVuelidate()
  const { push } = usePageNavigation()
  const videoShowEpisodeOneStore = useVideoShowEpisodeOneStore()
  const { videoShowEpisode } = storeToRefs(videoShowEpisodeOneStore)

  const fetchData = async (id: string, options: { signal?: AbortSignal } = {}): Promise<boolean | undefined> => {
    detailLoading.value = true
    try {
      const { execute: fetchVideoShowEpisode } = useFetchVideoShowEpisode()
      const videoShowEpisode = await fetchVideoShowEpisode({ urlParams: { id }, signal: options.signal })
      videoShowEpisodeOneStore.setVideoShowEpisode(videoShowEpisode)
      return true
    } catch (error) {
      return handleRecordLoadError(error) ? false : undefined
    } finally {
      if (!options.signal?.aborted) detailLoading.value = false
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
      const { execute: updateVideoShowEpisode } = useUpdateVideoShowEpisode()
      const res = await updateVideoShowEpisode({
        urlParams: { id: videoShowEpisodeOneStore.videoShowEpisode.id },
        body: videoShowEpisode.value,
      })
      syncUserAndTimeTracking(videoShowEpisodeOneStore.videoShowEpisode, res)
      showRecordWas('updated')
      if (!close || !videoShowEpisodeOneStore.videoShowEpisode.videoShow) return
      push({
        name: '/(coreDam)/video-shows/[id]',
        params: { id: videoShowEpisodeOneStore.videoShowEpisode.videoShow },
      })
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
    videoShowEpisode,
    fetchData,
    onUpdate,
    resetStore: videoShowEpisodeOneStore.reset,
  }
}
