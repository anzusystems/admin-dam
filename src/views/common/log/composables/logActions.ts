import type { FilterBag, Pagination } from '@anzusystems/common-admin'
import { useErrorHandler } from '@anzusystems/common-admin'
import { fetchLog, fetchLogList } from '@/services/api/common/logApi'
import { useLogOneStore } from '@/stores/common/logStore'
import type { Log } from '@anzusystems/common-admin'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'

const { handleError } = useErrorHandler()

const listLoading = ref(false)
const detailLoading = ref(false)

export const useLogListActions = () => {
  const listItems = ref<Log[]>([])

  const fetchList = async (system: string, pagination: Pagination, filterBag: FilterBag) => {
    listLoading.value = true
    try {
      listItems.value = await fetchLogList(system, pagination, filterBag)
    } catch (error) {
      handleError(error)
    } finally {
      listLoading.value = false
    }
  }

  return {
    listLoading,
    fetchList,
    listItems,
  }
}

export const useLogDetailActions = () => {
  const logOneStore = useLogOneStore()
  const { log } = storeToRefs(logOneStore)

  const fetchData = async (id: string, system: string, type: string) => {
    detailLoading.value = true
    try {
      const logRes = await fetchLog(id, system, type)
      logOneStore.setLog(logRes)
    } catch (error) {
      handleError(error)
    } finally {
      detailLoading.value = false
    }
  }

  return {
    detailLoading,
    log,
    fetchData,
    resetStore: logOneStore.reset,
  }
}
