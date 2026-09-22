import type { Log } from '@anzusystems/common-admin'
import type { FilterConfig, FilterData, Pagination } from '@anzusystems/common-admin/labs'
import type { Ref } from 'vue'
import { useFetchLog, useFetchLogList } from '@/domains/common/log/api/logApi'
import { useLogOneStore } from '@/domains/common/log/store/logStore'

const { showErrorsDefault } = useAlerts()

const datatableHiddenColumns = ref<Array<string>>([])
const listLoading = ref(false)
const detailLoading = ref(false)

export const useLogListActions = () => {
  const listItems = ref<Log[]>([])

  const fetchList = async (
    system: string,
    pagination: Ref<Pagination>,
    filterData: FilterData,
    filterConfig: FilterConfig
  ) => {
    listLoading.value = true
    try {
      const { executeFetch } = useFetchLogList(system)
      listItems.value = await executeFetch(pagination, filterData, filterConfig, {
        urlParams: { type: filterData.type as string },
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
      const { executeRequest: fetchLog } = useFetchLog(system)
      const logRes = await fetchLog({ urlParams: { id, type } })
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
