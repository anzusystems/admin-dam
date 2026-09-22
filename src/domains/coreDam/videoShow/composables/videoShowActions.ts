import { useCurrentExtSystem } from '@/domains/coreDam/asset/composables/currentExtSystem'
import type { FilterConfig, FilterData, Pagination } from '@anzusystems/common-admin/labs'
import type { Ref } from 'vue'
import {
  useFetchVideoShow,
  useFetchVideoShowListByExtSystem,
  useFetchVideoShowListByIds,
  useUpdateVideoShow,
} from '@/domains/coreDam/videoShow/api/videoShowApi'
import type { VideoShow } from '@/domains/coreDam/videoShow/types/VideoShow'
import { useVideoShowOneStore } from '@/domains/coreDam/videoShow/store/videoShowStore'

const { showValidationError, showRecordWas, showErrorsDefault } = useAlerts()

const datatableHiddenColumns = ref<Array<string>>(['id'])
const listLoading = ref(false)
const detailLoading = ref(false)
const saveButtonLoading = ref(false)
const saveAndCloseButtonLoading = ref(false)

export const useVideoShowListActions = () => {
  const { currentExtSystemId } = useCurrentExtSystem()
  const { executeFetch } = useFetchVideoShowListByExtSystem()

  const listItems = ref<VideoShow[]>([])

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

export const useVideoShowDetailActions = () => {
  const videoShowOneStore = useVideoShowOneStore()
  const { videoShow } = storeToRefs(videoShowOneStore)
  const { executeRequest: fetchVideoShow } = useFetchVideoShow()

  const fetchData = async (id: string) => {
    detailLoading.value = true
    try {
      const videoShow = await fetchVideoShow({ urlParams: { id } })
      videoShowOneStore.setVideoShow(videoShow)
    } catch (error) {
      showErrorsDefault(error)
    } finally {
      detailLoading.value = false
    }
  }

  return {
    detailLoading,
    videoShow,
    fetchData,
    resetStore: videoShowOneStore.reset,
  }
}

export const useVideoShowEditActions = () => {
  const v$ = useVuelidate()
  const router = useRouter()
  const videoShowOneStore = useVideoShowOneStore()
  const { videoShow } = storeToRefs(videoShowOneStore)
  const { executeRequest: fetchVideoShow } = useFetchVideoShow()
  const { executeRequest: updateVideoShow } = useUpdateVideoShow()

  const fetchData = async (id: string) => {
    detailLoading.value = true
    try {
      const videoShow = await fetchVideoShow({ urlParams: { id } })
      videoShowOneStore.setVideoShow(videoShow)
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
      await updateVideoShow({ urlParams: { id: videoShowOneStore.videoShow.id }, object: videoShow.value })
      showRecordWas('updated')
      if (!close) return
      router.push({ name: '/(coreDam)/video-shows' })
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
    videoShow,
    fetchData,
    onUpdate,
    resetStore: videoShowOneStore.reset,
  }
}

export const useVideoShowSelectActions = () => {
  const { currentExtSystemId } = useCurrentExtSystem()
  const { executeFetch } = useFetchVideoShowListByExtSystem()

  const fetchItems = async (pagination: Ref<Pagination>, filterData: FilterData, filterConfig: FilterConfig) => {
    const videoShows = await executeFetch(pagination, filterData, filterConfig, {
      urlParams: { extSystemId: currentExtSystemId.value },
    })

    return <ValueObjectOption<string>[]>videoShows.map((videoShow: VideoShow) => ({
      title: videoShow.texts.title,
      value: videoShow.id,
    }))
  }

  const fetchItemsByIds = async (ids: string[]) => {
    const { executeFetch: executeFetchByIds } = useFetchVideoShowListByIds()
    const videoShows = await executeFetchByIds(ids, { urlParams: { extSystemId: currentExtSystemId.value } })

    return <ValueObjectOption<string>[]>videoShows.map((videoShow: VideoShow) => ({
      title: videoShow.texts.title,
      value: videoShow.id,
    }))
  }

  return {
    fetchItems,
    fetchItemsByIds,
  }
}
