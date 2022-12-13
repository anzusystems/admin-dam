import { useErrorHandler } from '@/composables/system/error'
import { useUiHelper } from '@/composables/system/uiHelper'
import { fetchLog, fetchLogList } from '@/services/api/common/logApi'
import { useLogOneStore } from '@/stores/common/log'
import type { Log } from '@/types/common/Log'
import type { FilterBag } from '@/types/Filter'
import type { Pagination } from '@/types/Pagination'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'

const { loaderOn, loaderOff } = useUiHelper()
const { handleError } = useErrorHandler()

export const useLogListActions = () => {
  const listItems = ref<Log[]>([])

  const fetchList = async (system: string, pagination: Pagination, filterBag: FilterBag) => {
    loaderOn('list')
    try {
      listItems.value = await fetchLogList(system, pagination, filterBag)
    } catch (error) {
      handleError(error)
    } finally {
      loaderOff('list')
    }
  }

  return {
    fetchList,
    listItems,
  }
}

export const useLogDetailActions = () => {
  const logOneStore = useLogOneStore()
  const { log, loaded } = storeToRefs(logOneStore)

  const fetchData = async (id: string, system: string, type: string) => {
    logOneStore.setLoaded(false)
    loaderOn('detail')
    try {
      const logRes = await fetchLog(id, system, type)
      logOneStore.setLog(logRes)
      logOneStore.setLoaded(true)
    } catch (error) {
      handleError(error)
    } finally {
      loaderOff('detail')
    }
  }

  return {
    log,
    loaded,
    fetchData,
    resetStore: logOneStore.reset,
  }
}
