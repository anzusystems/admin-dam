import { type FilterConfig, type FilterData, type Pagination, useJobApi } from '@anzusystems/common-admin/labs'
import type { Ref } from 'vue'
import { damClient } from '@/shared/apiClients/damClient'
import { SYSTEM_CORE_DAM } from '@/shared/systems'
import { useJobOneStore } from '@/domains/coreDam/job/store/jobStore'
import type { Job } from '@/domains/coreDam/job/types/Job'

const { showErrorsDefault } = useAlerts()

const datatableHiddenColumns = ref<Array<string>>([])
const listLoading = ref(false)
const detailLoading = ref(false)

const { useFetchJobList, fetchJob } = useJobApi<Job>(damClient, SYSTEM_CORE_DAM)

export const useJobListActions = () => {
  const listItems = ref<Array<Job>>([])
  const { executeFetch } = useFetchJobList()

  const fetchList = async (pagination: Ref<Pagination>, filterData: FilterData, filterConfig: FilterConfig) => {
    listLoading.value = true
    try {
      listItems.value = await executeFetch(pagination, filterData, filterConfig)
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

export const useJobDetailActions = () => {
  const jobOneStore = useJobOneStore()
  const { job } = storeToRefs(jobOneStore)

  const fetchData = async (id: number) => {
    detailLoading.value = true
    try {
      const job = await fetchJob(id)
      jobOneStore.setJob(job)
    } catch (error) {
      showErrorsDefault(error)
    } finally {
      detailLoading.value = false
    }
  }

  return {
    job,
    detailLoading,
    fetchData,
    resetStore: jobOneStore.reset,
  }
}
