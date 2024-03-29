import { ref } from 'vue'
import { type FilterBag, type Pagination, useAlerts, useJobApi } from '@anzusystems/common-admin'
import { damClient } from '@/services/api/clients/damClient'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { useJobOneStore } from '@/stores/coreDam/jobStore'
import { storeToRefs } from 'pinia'
import type { Job } from '@/types/coreDam/Job'

const { showErrorsDefault } = useAlerts()

const datatableHiddenColumns = ref<Array<string>>([])
const listLoading = ref(false)
const detailLoading = ref(false)

const { fetchJobList, fetchJob } = useJobApi<Job>(damClient, SYSTEM_CORE_DAM)

export const useJobListActions = () => {
  const listItems = ref<Array<Job>>([])

  const fetchList = async (pagination: Pagination, filterBag: FilterBag) => {
    listLoading.value = true
    try {
      listItems.value = await fetchJobList(pagination, filterBag)
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
