<script lang="ts" setup>
import { onMounted } from 'vue'
import type { AssetType } from '@/model/dam/valueObject/AssetType'
import type { DocId } from '@/types/common'
import { usePagination, usePaginationAutoHide } from '@/composables/system/pagination'
import AssetDetailSidebarActionsWrapper from '@/views/dam/asset/detail/components/AssetDetailSidebarActionsWrapper.vue'
import ADatatablePagination from '@/components/common/ADatatablePagination.vue'
import { useAssetSlotsStore } from '@/stores/dam/assetSlotsStore'
import { fetchAssetSlotList } from '@/services/api/dam/assetSlotApi'
import { useAssetSlotListFilter } from '@/model/dam/filter/AssetSlotFilter'
import AssetSlotListItem from '@/views/dam/asset/detail/components/slots/AssetSlotListItem.vue'

const props = withDefaults(
  defineProps<{
    isActive: boolean
    assetType: AssetType
    assetId: DocId
  }>(),
  {}
)

const assetSlotsStore = useAssetSlotsStore()
const pagination = usePagination()
const filter = useAssetSlotListFilter()

const { showPagination } = usePaginationAutoHide(pagination)

const getList = async () => {
  assetSlotsStore.showLoader()
  const items = await fetchAssetSlotList(props.assetId, pagination, filter)
  assetSlotsStore.setList(items)
  assetSlotsStore.hideLoader()
}

onMounted(async () => {
  assetSlotsStore.setAssetSlotsNamesFromConfig(props.assetType)
  await getList()
})
</script>

<template>
  <AssetDetailSidebarActionsWrapper v-if="isActive"></AssetDetailSidebarActionsWrapper>
  <div v-if="assetSlotsStore.loader" class="d-flex w-100 h-100 justify-center align-center pa-2">
    <VProgressCircular indeterminate color="primary"></VProgressCircular>
  </div>
  <div v-else-if="assetSlotsStore.list.length === 0" class="pa-4 text-caption">Nothing to show</div>
  <div v-else>
    <AssetSlotListItem
      v-for="(slot, slotName) in assetSlotsStore.getPositionedSlots"
      :key="slotName"
      :item="slot"
      :slot-name="slotName"
      :asset-type="assetType"
      :total-slot-count="assetSlotsStore.assetSlotNames.length"
    />
    <ADatatablePagination v-if="showPagination" hide-records-per-page v-model="pagination" @change="getList" />
  </div>
</template>
