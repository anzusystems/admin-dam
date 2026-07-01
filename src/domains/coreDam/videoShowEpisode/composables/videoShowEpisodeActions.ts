import type { Ref } from 'vue'
import type { FilterConfig, FilterData, Pagination } from '@anzusystems/common-admin/labs'
import {
  useFetchVideoShowEpisode,
  useFetchVideoShowEpisodeListByVideoShow,
  useUpdateVideoShowEpisode,
} from '@/domains/coreDam/videoShowEpisode/api/videoShowEpisodeApi'
import type { VideoShowEpisode } from '@/domains/coreDam/videoShowEpisode/types/VideoShowEpisode'
import { useVideoShowEpisodeOneStore } from '@/domains/coreDam/videoShowEpisode/store/videoShowEpisodeStore'

const { showValidationError, showRecordWas, showErrorsDefault } = useAlerts()

const datatableHiddenColumns = ref<Array<string>>(['id'])
const listLoading = ref(false)
const detailLoading = ref(false)
const saveButtonLoading = ref(false)
const saveAndCloseButtonLoading = ref(false)

export const useVideoShowEpisodeListActions = () => {
  const listItems = ref<VideoShowEpisode[]>([])
  const { executeFetch } = useFetchVideoShowEpisodeListByVideoShow()

  const fetchList = async (
    videoShowId: DocId,
    pagination: Ref<Pagination>,
    filterData: FilterData,
    filterConfig: FilterConfig
  ) => {
    listLoading.value = true
    try {
      listItems.value = await executeFetch(pagination, filterData, filterConfig, { urlParams: { videoShowId } })
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
      const { executeRequest: fetchVideoShowEpisode } = useFetchVideoShowEpisode()
      const videoShowEpisode = await fetchVideoShowEpisode({ urlParams: { id } })
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
      const { executeRequest: fetchVideoShowEpisode } = useFetchVideoShowEpisode()
      const videoShowEpisode = await fetchVideoShowEpisode({ urlParams: { id } })
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
      const { executeRequest: updateVideoShowEpisode } = useUpdateVideoShowEpisode()
      await updateVideoShowEpisode({
        urlParams: { id: videoShowEpisodeOneStore.videoShowEpisode.id },
        object: videoShowEpisode.value,
      })
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
