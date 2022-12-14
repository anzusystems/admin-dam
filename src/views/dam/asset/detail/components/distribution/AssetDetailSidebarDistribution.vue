<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import type { AssetType } from '@/model/dam/valueObject/AssetType'
import { useDistributionListStore } from '@/stores/dam/distributionListStore'
import { fetchAssetDistributionList } from '@/services/api/dam/distributionApi'
import type { DocId } from '@/types/common'
import { usePagination, usePaginationAutoHide } from '@/composables/system/pagination'
import { useDistributionListFilter } from '@/model/dam/filter/DistributionFilter'
import AssetDetailSidebarActionsWrapper from '@/views/dam/asset/detail/components/AssetDetailSidebarActionsWrapper.vue'
import DistributionListItem from '@/views/dam/asset/detail/components/distribution/DistributionListItem.vue'
import DistributionNewDialog from '@/views/dam/asset/detail/components/distribution/DistributionNewDialog.vue'
import ADatatablePagination from '@/components/common/ADatatablePagination.vue'

const props = withDefaults(
  defineProps<{
    isActive: boolean
    assetType: AssetType
    assetId: DocId
  }>(),
  {}
)

const distributionListStore = useDistributionListStore()
const pagination = usePagination()
const filter = useDistributionListFilter()

const { showPagination } = usePaginationAutoHide(pagination)

const dialogNew = ref(false)

const getList = async () => {
  distributionListStore.showLoader()
  const items = await fetchAssetDistributionList(props.assetId, pagination, filter)
  distributionListStore.setList(items)
  distributionListStore.hideLoader()
}

const reloadList = () => {
  getList()
}

const addNew = async () => {
  dialogNew.value = true
}

onMounted(async () => {
  await getList()
})
</script>

<template>
  <AssetDetailSidebarActionsWrapper v-if="isActive">
    <VBtn color="secondary" @click.stop="addNew" variant="flat">Add new</VBtn>
  </AssetDetailSidebarActionsWrapper>
  <div v-if="distributionListStore.loader" class="d-flex w-100 h-100 justify-center align-center pa-2">
    <VProgressCircular indeterminate color="primary"></VProgressCircular>
  </div>
  <div v-else-if="distributionListStore.list.length === 0" class="pa-4 text-caption">Nothing to show</div>
  <div v-else>
    <DistributionListItem
      v-for="item in distributionListStore.list"
      :key="item.id"
      :item="item"
      :asset-type="assetType"
    />
    <ADatatablePagination v-if="showPagination" hide-records-per-page v-model="pagination" @change="getList" />
  </div>
  <DistributionNewDialog v-model="dialogNew" :asset-type="assetType" :asset-id="assetId" @reload-list="reloadList" />
</template>
