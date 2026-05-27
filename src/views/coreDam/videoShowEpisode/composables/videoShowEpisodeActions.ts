import type { FilterBag, Pagination } from '@anzusystems/common-admin'
import {
  fetchVideoShowEpisode,
  fetchVideoShowEpisodeListByVideoShow,
  updateVideoShowEpisode,
} from '@/services/api/coreDam/videoShowEpisodeApi'
import type { VideoShowEpisode } from '@/types/coreDam/VideoShowEpisode'
import { useVideoShowEpisodeOneStore } from '@/stores/coreDam/videoShowEpisodeStore'

const { showValidationError, showRecordWas, showErrorsDefault } = useAlerts()

const datatableHiddenColumns = ref<Array<string>>(['id'])
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

  const fetchData = async (id: string) => {
    detailLoading.value = true
    try {
      const videoShowEpisode = await fetchVideoShowEpisode(id)
      videoShowEpisodeOneStore.setVideoShowEpisode(videoShowEpisode)
    } catch (error) {
      showErrorsDefault(error)
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
      await updateVideoShowEpisode(videoShowEpisodeOneStore.videoShowEpisode.id, videoShowEpisode.value)
      showRecordWas('updated')
      if (!close || !videoShowEpisodeOneStore.videoShowEpisode.videoShow) return
      router.push({
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
