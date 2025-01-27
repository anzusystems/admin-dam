<script lang="ts" setup>
import { useDistributionFilter } from '@/model/coreDam/filter/DistributionFilter'
import { fetchAssetDistributionList } from '@/services/api/coreDam/distributionApi'
import { useDistributionListStore } from '@/stores/coreDam/distributionListStore'
import AssetDetailSidebarActionsWrapper from '@/views/coreDam/asset/detail/components/AssetDetailSidebarActionsWrapper.vue'
import DistributionCancelDialog from '@/views/coreDam/asset/detail/components/distribution/DistributionCancelDialog.vue'
import DistributionListItem from '@/views/coreDam/asset/detail/components/distribution/DistributionListItem.vue'
import DistributionNewDialog from '@/views/coreDam/asset/detail/components/distribution/DistributionNewDialog.vue'
import { useAssetDetailDistributionDialog } from '@/views/coreDam/asset/detail/composables/assetDetailDistributionDialog'
import type { AssetFileProcessStatusType, DamAssetTypeType, DocId } from '@anzusystems/common-admin'
import { ADatatablePagination, usePagination, usePaginationAutoHide } from '@anzusystems/common-admin'
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

const props = withDefaults(
  defineProps<{
    isActive: boolean
    assetType: DamAssetTypeType
    assetId: DocId
    assetMainFileStatus?: AssetFileProcessStatusType | undefined
    dataCy?: string
  }>(),
  {
    assetMainFileStatus: undefined,
    dataCy: undefined,
  }
)

const { t } = useI18n()

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
      <ABtnPrimary
        :disabled="assetMainFileStatus === undefined"
        data-cy="add-new-distribution"
        @click.stop="addNew"
      >
        {{ t('coreDam.distribution.common.addButton') }}
      </ABtnPrimary>
    </AssetDetailSidebarActionsWrapper>
    <div class="px-4 text-caption">{{ t('coreDam.distribution.common.list') }}:</div>
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
    <DistributionCancelDialog @reload-list="reloadList" />
  </div>
</template>
