import { handleRecordLoadError, useAlerts, useJobApi } from '@anzusystems/common-admin'
import type { FilterConfig, FilterData, Pagination } from '@anzusystems/common-admin'
import { storeToRefs } from 'pinia'
import type { Ref } from 'vue'
import { ref } from 'vue'

import { useJobOneStore } from '@/domains/coreDam/job/store/jobStore'
import type { Job } from '@/domains/coreDam/job/types/Job'
import { damClient } from '@/shared/apiClients/damClient'
import { SYSTEM_CORE_DAM } from '@/shared/systems'

const { showErrorsDefault } = useAlerts()

const datatableHiddenColumns = ref<Array<string>>([])
const listLoading = ref(false)
const detailLoading = ref(false)

const { useFetchJobList, fetchJob } = useJobApi<Job>(damClient, SYSTEM_CORE_DAM)

export const useJobListActions = () => {
  const listItems = ref<Array<Job>>([])
  const { execute } = useFetchJobList()

  const fetchList = async (pagination: Ref<Pagination>, filterData: FilterData, filterConfig: FilterConfig) => {
    listLoading.value = true
    try {
      listItems.value = await execute(pagination, filterData, filterConfig)
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

  const fetchData = async (id: number, options: { signal?: AbortSignal } = {}): Promise<boolean | undefined> => {
    detailLoading.value = true
    try {
      // The library's job request takes no signal: a page left meanwhile ignores the answer instead.
      const job = await fetchJob(id)
      if (options.signal?.aborted) return undefined
      jobOneStore.setJob(job)
      return true
    } catch (error) {
      if (options.signal?.aborted) return undefined
      return handleRecordLoadError(error) ? false : undefined
    } finally {
      // An aborted load belongs to a page that is gone; the flag is the next page's by now.
      if (!options.signal?.aborted) detailLoading.value = false
    }
  }

  return {
    job,
    detailLoading,
    fetchData,
    resetStore: jobOneStore.reset,
  }
}
