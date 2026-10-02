import type { FilterConfig, FilterData, Pagination, ValueObjectOption } from '@anzusystems/common-admin'
import { syncUserAndTimeTracking, useAlerts } from '@anzusystems/common-admin'
import { useVuelidate } from '@vuelidate/core'
import { storeToRefs } from 'pinia'
import type { Ref } from 'vue'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { useCurrentExtSystem } from '@/domains/coreDam/asset/composables/currentExtSystem'
import {
  useFetchVideoShow,
  useFetchVideoShowListByExtSystem,
  useFetchVideoShowListByIds,
  useUpdateVideoShow,
} from '@/domains/coreDam/videoShow/api/videoShowApi'
import { useVideoShowOneStore } from '@/domains/coreDam/videoShow/store/videoShowStore'
import type { VideoShow } from '@/domains/coreDam/videoShow/types/VideoShow'

const { showValidationError, showRecordWas, showErrorsDefault } = useAlerts()

const datatableHiddenColumns = ref<Array<string>>(['id'])
const listLoading = ref(false)
const detailLoading = ref(false)
const saveButtonLoading = ref(false)
const saveAndCloseButtonLoading = ref(false)

export const useVideoShowListActions = () => {
  const { currentExtSystemId } = useCurrentExtSystem()
  const { execute } = useFetchVideoShowListByExtSystem()

  const listItems = ref<VideoShow[]>([])

  const fetchList = async (pagination: Ref<Pagination>, filterData: FilterData, filterConfig: FilterConfig) => {
    listLoading.value = true
    try {
      listItems.value = await execute(pagination, filterData, filterConfig, {
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
  const { execute: fetchVideoShow } = useFetchVideoShow()

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
  const { execute: fetchVideoShow } = useFetchVideoShow()
  const { execute: updateVideoShow } = useUpdateVideoShow()

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
      const res = await updateVideoShow({ urlParams: { id: videoShowOneStore.videoShow.id }, body: videoShow.value })
      syncUserAndTimeTracking(videoShowOneStore.videoShow, res)
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
  const { execute } = useFetchVideoShowListByExtSystem()

  const fetchItems = async (pagination: Ref<Pagination>, filterData: FilterData, filterConfig: FilterConfig) => {
    const videoShows = await execute(pagination, filterData, filterConfig, {
      urlParams: { extSystemId: currentExtSystemId.value },
    })

    return <ValueObjectOption<string>[]>videoShows.map((videoShow: VideoShow) => ({
      title: videoShow.texts.title,
      value: videoShow.id,
    }))
  }

  const fetchItemsByIds = async (ids: string[]) => {
    const { execute: executeFetchByIds } = useFetchVideoShowListByIds()
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
