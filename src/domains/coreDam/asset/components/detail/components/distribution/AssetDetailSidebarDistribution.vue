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
import { onDistributionListChanged } from '@/domains/coreDam/asset/components/detail/composables/distributionListChanged'
import { useCurrentExtSystem } from '@/domains/coreDam/asset/composables/currentExtSystem'
import { useDistributionListPoll } from '@/domains/coreDam/asset/composables/distributionListPoll'
import { useDistributionFilter } from '@/domains/coreDam/asset/filter/DistributionFilter'
import { useAssetDetailStore } from '@/domains/coreDam/asset/store/assetDetailStore'
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
// Off for an asset being deleted.
const assetDetailStore = useAssetDetailStore()
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

// This tab's in-flight read. Aborted on close: the list and loader are shared with the next asset's tab.
// Also aborted on a new read: an older answer arriving later
// would overwrite the newer list and turn off the loader early.
let reading: AbortController | undefined = undefined
onBeforeUnmount(() => reading?.abort())

// A failed read left an empty list that says nothing about the asset, and nothing rereads it automatically.
// Per tab, because the store is shared with other assets' tabs.
const readFailed = ref(false)
// Until this tab reads the list, the list holds what an earlier tab left.
let opened = false

const readList = async () => {
  reading?.abort()
  const current = new AbortController()
  reading = current
  const raised = distributionListStore.showLoader()
  // The shared list is cleared on first read, so a failed first read does not show an earlier tab's list.
  // After that, what this tab read stays when a reload or page change fails.
  if (!opened) distributionListStore.setList([])
  opened = true
  distributionListStore.listOfAsset(props.assetId)
  try {
    const items = await fetchAssetDistributionList(props.assetId, pagination, filterData, filterConfig, current.signal)
    if (!current.signal.aborted) {
      distributionListStore.setList(items)
      readFailed.value = false
    }
  } catch (error) {
    if (!current.signal.aborted) {
      readFailed.value = distributionListStore.list.length === 0
      showErrorsDefault(error)
    }
  } finally {
    if (!current.signal.aborted) distributionListStore.hideLoader(raised)
  }
}

const { duringOwnRead } = useDistributionListPoll((signal, report) =>
  fetchAssetDistributionList(props.assetId, pagination, filterData, filterConfig, signal, report)
)
const getList = () => duringOwnRead(readList)

const reloadList = () => {
  getList()
}
// Reload after a distribution is saved, even if the dialog that saved it is already gone.
onDistributionListChanged(reloadList)

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
        :disabled="assetMainFileStatus === undefined || assetDetailStore.isDeleting"
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
