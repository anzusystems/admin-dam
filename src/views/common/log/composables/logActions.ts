import type { FilterBag, Log, Pagination } from '@anzusystems/common-admin'
import { useAlerts } from '@anzusystems/common-admin'
import { fetchLog, fetchLogList } from '@/services/api/common/logApi'
import { useLogOneStore } from '@/stores/common/logStore'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'

const { showErrorsDefault } = useAlerts()

const listLoading = ref(false)
const detailLoading = ref(false)

export const useLogListActions = () => {
  const listItems = ref<Log[]>([])

  const fetchList = async (system: string, pagination: Pagination, filterBag: FilterBag) => {
    listLoading.value = true
    try {
      listItems.value = await fetchLogList(system, pagination, filterBag)
    } catch (error) {
      showErrorsDefault(error)
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
      showErrorsDefault(error)
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
