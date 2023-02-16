import { useAlerts } from '@/composables/system/alerts'
import { useErrorHandler } from '@/composables/system/error'
import { ref } from 'vue'
import type { Pagination } from '@/types/Pagination'
import type { FilterBag } from '@/types/Filter'
import {
  fetchVideoShowEpisode,
  fetchVideoShowEpisodeListByVideoShow,
  updateVideoShowEpisode,
} from '@/services/api/dam/videoShowEpisodeApi'
import type { VideoShowEpisode } from '@/types/dam/VideoShowEpisode'
import { storeToRefs } from 'pinia'
import { useVideoShowEpisodeOneStore } from '@/stores/dam/videoShowEpisodeStore'
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

export const useVideoShowEpisodeListActions = () => {
  const listItems = ref<VideoShowEpisode[]>([])

  const fetchList = async (videoShowId: DocId, pagination: Pagination, filterBag: FilterBag) => {
    listLoading.value = true
    try {
      listItems.value = await fetchVideoShowEpisodeListByVideoShow(videoShowId, pagination, filterBag)
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

export const useVideoShowEpisodeDetailActions = () => {
  const videoShowEpisodeOneStore = useVideoShowEpisodeOneStore()
  const { videoShowEpisode } = storeToRefs(videoShowEpisodeOneStore)

  const fetchData = async (id: string) => {
    detailLoading.value = true
    try {
      const videoShowEpisode = await fetchVideoShowEpisode(id)
      videoShowEpisodeOneStore.setVideoShowEpisode(videoShowEpisode)
    } catch (error) {
      handleError(error)
    } finally {
      detailLoading.value = false
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
  const router = useRouter()
  const videoShowEpisodeOneStore = useVideoShowEpisodeOneStore()
  const { videoShowEpisode } = storeToRefs(videoShowEpisodeOneStore)

  const fetchData = async (id: string) => {
    detailLoading.value = true
    try {
      const videoShowEpisode = await fetchVideoShowEpisode(id)
      videoShowEpisodeOneStore.setVideoShowEpisode(videoShowEpisode)
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
      await updateVideoShowEpisode(videoShowEpisodeOneStore.videoShowEpisode.id, videoShowEpisode.value)
      showRecordWas('updated')
      if (!close || !videoShowEpisodeOneStore.videoShowEpisode.videoShow) return
      router.push({
        name: ROUTE.DAM.VIDEO_SHOW.DETAIL,
        params: { id: videoShowEpisodeOneStore.videoShowEpisode.videoShow },
      })
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
    videoShowEpisode,
    fetchData,
    onUpdate,
    resetStore: videoShowEpisodeOneStore.reset,
  }
}
