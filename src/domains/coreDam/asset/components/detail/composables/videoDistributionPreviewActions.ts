import type { FilterConfig, FilterData, Pagination } from '@anzusystems/common-admin/labs'
import type { Ref } from 'vue'
import { fetchVideoFileDistributionPreviewList } from '@/domains/coreDam/asset/api/videoApi'
import type { DistributionImagePreviewDto } from '@/domains/coreDam/asset/types/DistributionImagePreviewDto'

const { showErrorsDefault } = useAlerts()

const listLoading = ref(false)

export const useVideoDistributionPreviewListActions = () => {
  const listItems = ref<DistributionImagePreviewDto[]>([])
  const lastSelectedItem = ref<DistributionImagePreviewDto | null>(null)

  const fetchList = async (
    fileId: DocId,
    pagination: Ref<Pagination>,
    filterData: FilterData,
    filterConfig: FilterConfig
  ) => {
    listLoading.value = true
    try {
      listItems.value = await fetchVideoFileDistributionPreviewList(fileId, pagination, filterData, filterConfig)
    } catch (error) {
      showErrorsDefault(error)
    } finally {
      listLoading.value = false
    }
  }

  const toggleSelectedItem = (index: number) => {
    if (listItems.value[index] && listItems.value[index].selected) {
      listItems.value[index].selected = false
      lastSelectedItem.value = null
      return
    }
    if (!isNull(lastSelectedItem.value)) {
      for (let i = 0; i < listItems.value.length; i++) {
        listItems.value[i].selected = false
      }
    }
    listItems.value[index].selected = true
    lastSelectedItem.value = listItems.value[index]
  }

  const itemImageIsInvalid = (index: number) => {
    listItems.value[index].invalidImage = true
  }

  return {
    lastSelectedItem,
    toggleSelectedItem,
    itemImageIsInvalid,
    listLoading,
    listItems,
    fetchList,
  }
}
