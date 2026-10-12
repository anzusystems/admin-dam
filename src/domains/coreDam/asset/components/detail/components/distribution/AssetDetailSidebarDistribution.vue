<script lang="ts" setup>
import type { AssetFileProcessStatusType, DamAssetTypeType, DocId } from '@anzusystems/common-admin'
import {
  ADatatablePagination,
  DatatablePaginationKey,
  useAlerts,
  useDamConfigState,
  usePagination,
} from '@anzusystems/common-admin'
import { computed, onBeforeUnmount, onMounted, provide, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { fetchAssetDistributionList } from '@/domains/coreDam/asset/api/distributionApi'
import AssetDetailSidebarActionsWrapper from '@/domains/coreDam/asset/components/detail/components/AssetDetailSidebarActionsWrapper.vue'
import DistributionCancelDialog from '@/domains/coreDam/asset/components/detail/components/distribution/DistributionCancelDialog.vue'
import DistributionListItem from '@/domains/coreDam/asset/components/detail/components/distribution/DistributionListItem.vue'
import DistributionNewDialog from '@/domains/coreDam/asset/components/detail/components/distribution/DistributionNewDialog.vue'
import DistributionManage from '@/domains/coreDam/asset/components/detail/components/distribution/forms/DistributionManage.vue'
import {
  useAssetDetailDistributionDialog,
  useDistributionServiceAllowed,
} from '@/domains/coreDam/asset/components/detail/composables/assetDetailDistributionDialog'
import { useCurrentExtSystem } from '@/domains/coreDam/asset/composables/currentExtSystem'
import { useDistributionListPoll } from '@/domains/coreDam/asset/composables/distributionListPoll'
import { useDistributionFilter } from '@/domains/coreDam/asset/filter/DistributionFilter'
import { useDistributionListStore } from '@/domains/coreDam/asset/store/distributionListStore'
import { damClient } from '@/shared/apiClients/damClient'

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
const { showErrorsDefault } = useAlerts()

const distributionListStore = useDistributionListStore()
const { pagination } = usePagination(null)
provide(DatatablePaginationKey, pagination)
const { filterConfig, filterData } = useDistributionFilter()

const showPagination = computed(
  () => !(pagination.value.page === 1 && pagination.value.currentViewCount < pagination.value.rowsPerPage)
)

const { dialogNew, openNew, dialogKey } = useAssetDetailDistributionDialog()

const { getDamConfigExtSystem } = useDamConfigState(damClient)
const { currentExtSystemId } = useCurrentExtSystem()
const isDistributionServiceAllowed = useDistributionServiceAllowed()
const hasAllowedService = computed(() =>
  Object.keys(
    getDamConfigExtSystem(currentExtSystemId.value)?.[props.assetType]?.distribution?.distributionRequirements ?? {}
  ).some(isDistributionServiceAllowed)
)

// A read still on its way when the tab closes is given up. The list and its loader are shared with the tab of
// the next asset: the late answer would put this asset's distributions there and turn that tab's loader off.
const closed = new AbortController()
onBeforeUnmount(() => closed.abort())

// A read of this tab failed and left it an empty list: that says nothing of the asset, and nothing reads it again
// by itself. Of this tab only: the store is shared with the tabs of the other assets.
const readFailed = ref(false)
// The reads of the tab's own, counted: one that fails says so only while none was started after it, which may have
// read the list meanwhile.
let ownReads = 0

const readList = async () => {
  const read = ++ownReads
  distributionListStore.showLoader()
  // The list is shared with the tab of the asset before: left there, it would show under a read that failed here.
  // The list of this asset stays, for a reload or another page that fails.
  distributionListStore.listOfAsset(props.assetId)
  try {
    const items = await fetchAssetDistributionList(props.assetId, pagination, filterData, filterConfig, closed.signal)
    if (!closed.signal.aborted) {
      distributionListStore.setList(items)
      readFailed.value = false
    }
  } catch (error) {
    if (!closed.signal.aborted) {
      if (read === ownReads) readFailed.value = distributionListStore.list.length === 0
      showErrorsDefault(error)
    }
  } finally {
    if (!closed.signal.aborted) distributionListStore.hideLoader()
  }
}

const { duringOwnRead } = useDistributionListPoll((signal, report) =>
  fetchAssetDistributionList(props.assetId, pagination, filterData, filterConfig, signal, report)
)
const getList = () => duringOwnRead(readList)

const reloadList = () => {
  getList()
}

const addNew = () => {
  openNew()
}

onMounted(async () => {
  await getList()
})

const showAdvancedSettings = ref(false)
const toggleAdvancedSettings = () => (showAdvancedSettings.value = !showAdvancedSettings.value)
</script>

<template>
  <div class="d-flex flex-column w-100">
    <AssetDetailSidebarActionsWrapper v-if="isActive">
      <ABtnPrimary
        v-if="hasAllowedService"
        :disabled="assetMainFileStatus === undefined"
        data-cy="add-new-distribution"
        @click.stop="addNew"
      >
        {{ t('coreDam.distribution.common.addButton') }}
      </ABtnPrimary>
    </AssetDetailSidebarActionsWrapper>
    <div class="px-4 text-body-small">{{ t('coreDam.distribution.common.list') }}:</div>
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
      v-else-if="readFailed && distributionListStore.list.length === 0"
      class="pa-4 text-body-small"
    >
      <div class="text-error">{{ t('coreDam.distribution.common.loadFailed') }}</div>
      <ABtnTertiary
        density="compact"
        class="mt-2"
        data-cy="distribution-list-retry"
        @click.stop="reloadList"
      >
        {{ t('common.button.retry') }}
      </ABtnTertiary>
    </div>
    <div
      v-else-if="distributionListStore.list.length === 0"
      class="pa-4 text-body-small"
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
        hide-records-per-page
        @change="getList"
      />
    </div>

    <ABtnTertiary
      density="compact"
      class="mb-5 pl-0 pr-0 mt-5 mb-5"
      @click.stop="toggleAdvancedSettings"
    >
      <span v-if="showAdvancedSettings">{{ t('coreDam.distribution.meta.hideAdvanced') }}</span>
      <span v-else>{{ t('coreDam.distribution.meta.showAdvanced') }}</span>
    </ABtnTertiary>

    <DistributionManage
      v-if="showAdvancedSettings"
      :asset-type="assetType"
      :asset-id="assetId"
      :is-active="isActive"
      @on-distribution-upsert="reloadList"
      @on-distribution-delete="reloadList"
    />
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
