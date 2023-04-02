<script lang="ts" setup>
import { onMounted } from 'vue'
import type { AssetType } from '@/model/coreDam/valueObject/AssetType'
import { useDistributionListStore } from '@/stores/coreDam/distributionListStore'
import { fetchAssetDistributionList } from '@/services/api/coreDam/distributionApi'
import type { DocId } from '@anzusystems/common-admin'
import { ADatatablePagination, usePagination, usePaginationAutoHide } from '@anzusystems/common-admin'
import { useDistributionFilter } from '@/model/coreDam/filter/DistributionFilter'
import AssetDetailSidebarActionsWrapper from '@/views/coreDam/asset/detail/components/AssetDetailSidebarActionsWrapper.vue'
import DistributionListItem from '@/views/coreDam/asset/detail/components/distribution/DistributionListItem.vue'
import DistributionNewDialog from '@/views/coreDam/asset/detail/components/distribution/DistributionNewDialog.vue'
import { useI18n } from 'vue-i18n'
import { useAssetDetailDistributionDialog } from '@/views/coreDam/asset/detail/composables/assetDetailDistributionDialog'
import DistributionCancelDialog from '@/views/coreDam/asset/detail/components/distribution/DistributionCancelDialog.vue'
import {
  assetDetailDistributionDialogCancel, useAssetDetailDistributionDialogCancel
} from '@/views/coreDam/asset/detail/composables/assetDetailDistributionDialogCancel'

const props = withDefaults(
  defineProps<{
    isActive: boolean
    assetType: AssetType
    assetId: DocId
  }>(),
  {}
)

const { t } = useI18n()

const distributionListStore = useDistributionListStore()
const pagination = usePagination()
const filter = useDistributionFilter()

const { showPagination } = usePaginationAutoHide(pagination)

const { dialogNew, openNew, dialogKey } = useAssetDetailDistributionDialog()
const { dialogCancel } = useAssetDetailDistributionDialogCancel()

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
      <ABtnPrimary @click.stop="addNew">
        {{ t('coreDam.distribution.common.addButton') }}
      </ABtnPrimary>
    </AssetDetailSidebarActionsWrapper>
    <div class="px-4 text-caption">
      {{ t('coreDam.distribution.common.list') }}:
    </div>
    <div
      v-if="distributionListStore.loader"
      class="d-flex w-100 h-100 justify-center align-center pa-2"
    >
      <VProgressCircular
        indeterminate
        color="primary"
      />
    </div>
    <div
      v-else-if="distributionListStore.list.length === 0"
      class="pa-4 text-caption"
    >
      {{ t('coreDam.distribution.common.noEntries') }}
    </div>
    <div
      v-else
      class="mx-4"
    >
      <DistributionListItem
        v-for="item in distributionListStore.list"
        :key="item.id"
        :item="item"
        :asset-type="assetType"
      />
      <ADatatablePagination
        v-if="showPagination"
        v-model="pagination"
        hide-records-per-page
        @change="getList"
      />
    </div>
    <DistributionNewDialog
      :key="dialogKey"
      v-model="dialogNew"
      :asset-type="assetType"
      :asset-id="assetId"
      @reload-list="reloadList"
    />
    <DistributionCancelDialog v-model="dialogCancel" />
  </div>
</template>
