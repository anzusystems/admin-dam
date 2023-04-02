import { ref } from 'vue'
import type { DistributionCustomItem, DistributionJwItem, DistributionYoutubeItem } from '@/types/coreDam/Distribution'

const dialogCancel = ref(false)

export function useAssetDetailDistributionDialogCancel() {

  const openCancel = (item: DistributionJwItem | DistributionYoutubeItem | DistributionCustomItem) => {
    dialogCancel.value = true
  }

  return {
    openCancel,
    dialogCancel,
  }
}
