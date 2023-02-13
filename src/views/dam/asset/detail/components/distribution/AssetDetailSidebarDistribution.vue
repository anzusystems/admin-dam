<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import type { AssetType } from '@/model/dam/valueObject/AssetType'
import { useDistributionListStore } from '@/stores/dam/distributionListStore'
import { fetchAssetDistributionList } from '@/services/api/dam/distributionApi'
import type { DocId } from '@anzusystems/common-admin'
import { usePagination, usePaginationAutoHide } from '@/composables/system/pagination'
import { useDistributionFilter } from '@/model/dam/filter/DistributionFilter'
import AssetDetailSidebarActionsWrapper from '@/views/dam/asset/detail/components/AssetDetailSidebarActionsWrapper.vue'
import DistributionListItem from '@/views/dam/asset/detail/components/distribution/DistributionListItem.vue'
import DistributionNewDialog from '@/views/dam/asset/detail/components/distribution/DistributionNewDialog.vue'
import ADatatablePagination from '@/components/common/ADatatablePagination.vue'
import { useI18n } from 'vue-i18n'
import { useAssetDetailDistributionDialog } from '@/views/dam/asset/detail/composables/assetDetailDistributionDialog'

const props = withDefaults(
  defineProps<{
    isActive: boolean
    assetType: AssetType
    assetId: DocId
  }>(),
  {}
)

const { t } = useI18n({ useScope: 'global' })

const distributionListStore = useDistributionListStore()
const pagination = usePagination()
const filter = useDistributionFilter()

const { showPagination } = usePaginationAutoHide(pagination)

const { dialogNew, openNew, dialogKey } = useAssetDetailDistributionDialog()

const getList = async () => {
  distributionListStore.showLoader()
  const items = await fetchAssetDistributionList(props.assetId, pagination, filter)
  distributionListStore.setList(items)
  distributionListStore.hideLoader()
}

const reloadList = () => {
  getList()
}

const addNew = () => {
  openNew()
}

onMounted(async () => {
  await getList()
})
</script>

<template>
  <div class="d-flex flex-column w-100">
    <AssetDetailSidebarActionsWrapper v-if="isActive">
      <VBtn color="secondary" variant="flat" @click.stop="addNew">
        {{ t('coreDam.distribution.common.addButton') }}
      </VBtn>
    </AssetDetailSidebarActionsWrapper>
    <div class="px-4 text-caption">{{ t('coreDam.distribution.common.list') }}:</div>
    <div v-if="distributionListStore.loader" class="d-flex w-100 h-100 justify-center align-center pa-2">
      <VProgressCircular indeterminate color="primary" />
    </div>
    <div v-else-if="distributionListStore.list.length === 0" class="pa-4 text-caption">
      {{ t('coreDam.distribution.common.noEntries') }}
    </div>
    <div v-else class="mx-4">
      <DistributionListItem
        v-for="item in distributionListStore.list"
        :key="item.id"
        :item="item"
        :asset-type="assetType"
      />
      <ADatatablePagination v-if="showPagination" v-model="pagination" hide-records-per-page @change="getList" />
    </div>
    <DistributionNewDialog
      :key="dialogKey"
      v-model="dialogNew"
      :asset-type="assetType"
      :asset-id="assetId"
      @reload-list="reloadList"
    />
  </div>
</template>
