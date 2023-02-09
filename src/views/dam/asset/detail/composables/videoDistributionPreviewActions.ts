import { useErrorHandler } from '@/composables/system/error'
import { ref } from 'vue'
import type { Pagination } from '@/types/Pagination'
import type { FilterBag } from '@/types/Filter'
import { fetchVideoFileDistributionPreviewList } from '@/services/api/dam/videoApi'
import type { DocId } from '@anzusystems/common-admin'
import type { DistributionImagePreviewDto } from '@/types/dam/DistributionImagePreviewDto'

const { handleError } = useErrorHandler()

const listLoading = ref(false)

export const useVideoDistributionPreviewListActions = () => {
  const listItems = ref<DistributionImagePreviewDto[]>([])

  const fetchList = async (fileId: DocId, pagination: Pagination, filterBag: FilterBag) => {
    listLoading.value = true
    try {
      listItems.value = await fetchVideoFileDistributionPreviewList(fileId, pagination, filterBag)
      console.log(listItems.value)
    } catch (error) {
      handleError(error)
    } finally {
      listLoading.value = false
    }
  }

  return {
    listLoading,
    listItems,
    fetchList,
  }
}
