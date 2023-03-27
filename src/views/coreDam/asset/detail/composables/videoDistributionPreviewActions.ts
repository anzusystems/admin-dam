import type { DocId, FilterBag, Pagination } from '@anzusystems/common-admin'
import { isNull, useAlerts } from '@anzusystems/common-admin'
import { ref } from 'vue'
import { fetchVideoFileDistributionPreviewList } from '@/services/api/coreDam/videoApi'
import type { DistributionImagePreviewDto } from '@/types/coreDam/DistributionImagePreviewDto'

const { showErrorsDefault } = useAlerts()

const listLoading = ref(false)

export const useVideoDistributionPreviewListActions = () => {
  const listItems = ref<DistributionImagePreviewDto[]>([])
  const lastSelectedItem = ref<DistributionImagePreviewDto | null>(null)

  const fetchList = async (fileId: DocId, pagination: Pagination, filterBag: FilterBag) => {
    listLoading.value = true
    try {
      listItems.value = await fetchVideoFileDistributionPreviewList(fileId, pagination, filterBag)
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
