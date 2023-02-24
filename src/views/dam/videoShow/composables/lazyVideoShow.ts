import { ref } from 'vue'
import { useAddToLazyHelper, useAllHelper } from '@/composables/system/lazyFetchHelpers'
import type { VideoShow } from '@/types/dam/VideoShow'
import { fetchVideoShowListByIds } from '@/services/api/dam/videoShowApi'

import type { ValueObjectOption } from '@anzusystems/common-admin'
import { useCurrentExtSystem } from '@/composables/system/currentExtSystem'

const all = ref<Map<string, ValueObjectOption<string>>>(new Map())
const allIds = ref<Set<string>>(new Set([]))

const mapToValueObject = (videoShow: VideoShow): ValueObjectOption<string> => ({
  title: videoShow.texts.title,
  value: videoShow.id,
})

export function loadLazyVideoShow(forceRefresh = false) {
  const { fetchByIds, addToLazy, manualAdd } = useAddToLazyHelper<VideoShow, ValueObjectOption<string>, string>()

  const { currentExtSystemId } = useCurrentExtSystem()

  const fetchLazyVideoShow = () =>
    fetchByIds(
      all,
      forceRefresh,
      (videoShow: VideoShow) => mapToValueObject(videoShow),
      (ids) => fetchVideoShowListByIds(currentExtSystemId.value, ids)
    )

  const addToLazyVideoShowBuffer = (id: string) => {
    allIds.value.add(id)
    return addToLazy(id)
  }

  const manualAddLazyVideoShow = (data: VideoShow) => {
    allIds.value.add(data.id)
    manualAdd(all, data, 'id', mapToValueObject)
  }

  return {
    addToLazyVideoShowBuffer,
    fetchLazyVideoShow,
    manualAddLazyVideoShow,
  }
}

export function useLazyVideoShow() {
  return useAllHelper<ValueObjectOption<string>, string>(all, allIds)
}
