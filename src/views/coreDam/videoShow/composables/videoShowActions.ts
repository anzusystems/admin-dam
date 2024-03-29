import { useCurrentExtSystem } from '@/composables/system/currentExtSystem'
import type { FilterBag, Pagination, ValueObjectOption } from '@anzusystems/common-admin'
import { useAlerts } from '@anzusystems/common-admin'
import { ref } from 'vue'
import {
  fetchVideoShow,
  fetchVideoShowListByExtSystem,
  fetchVideoShowListByIds,
  updateVideoShow,
} from '@/services/api/coreDam/videoShowApi'
import type { VideoShow } from '@/types/coreDam/VideoShow'
import { storeToRefs } from 'pinia'
import { useVideoShowOneStore } from '@/stores/coreDam/videoShowStore'
import useVuelidate from '@vuelidate/core'
import { useRouter } from 'vue-router'
import { ROUTE } from '@/router/routes'

const { currentExtSystemId } = useCurrentExtSystem()

const { showValidationError, showRecordWas, showErrorsDefault } = useAlerts()

const datatableHiddenColumns = ref<Array<string>>(['id'])
const listLoading = ref(false)
const detailLoading = ref(false)
const saveButtonLoading = ref(false)
const saveAndCloseButtonLoading = ref(false)

export const useVideoShowListActions = () => {
  const listItems = ref<VideoShow[]>([])

  const fetchList = async (pagination: Pagination, filterBag: FilterBag) => {
    listLoading.value = true
    try {
      listItems.value = await fetchVideoShowListByExtSystem(currentExtSystemId.value, pagination, filterBag)
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

  const fetchData = async (id: string) => {
    detailLoading.value = true
    try {
      const videoShow = await fetchVideoShow(id)
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

  const fetchData = async (id: string) => {
    detailLoading.value = true
    try {
      const videoShow = await fetchVideoShow(id)
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
      await updateVideoShow(videoShowOneStore.videoShow.id, videoShow.value)
      showRecordWas('updated')
      if (!close) return
      router.push({ name: ROUTE.DAM.VIDEO_SHOW.LIST })
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

  const fetchItems = async (pagination: Pagination, filterBag: FilterBag) => {
    const videoShows = await fetchVideoShowListByExtSystem(currentExtSystemId.value, pagination, filterBag)

    return <ValueObjectOption<string>[]>videoShows.map((videoShow: VideoShow) => ({
      title: videoShow.texts.title,
      value: videoShow.id,
    }))
  }

  const fetchItemsByIds = async (ids: string[]) => {
    const videoShows = await fetchVideoShowListByIds(currentExtSystemId.value, ids)

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
