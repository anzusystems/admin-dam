<script lang="ts" setup>
import { useMainWrapper } from '@/domains/system/composables/useMainWrapper'
import { useAssetListActions } from '@/domains/coreDam/asset/components/list/composables/assetListActions'
import AssetListFilterForm from '@/domains/coreDam/asset/components/list/components/AssetListFilterForm.vue'
import { AFilterWrapperSidebar, FilterConfigKey, FilterDataKey } from '@anzusystems/common-admin/labs'

const { sidebarLeft } = useMainWrapper()

const { t } = useI18n()

const { filterData, filterConfig, fetchAssetList, resetAssetList } = useAssetListActions()

provide(FilterConfigKey, filterConfig)
provide(FilterDataKey, filterData)

const submitFilter = () => {
  filterConfig.touched = false
  fetchAssetList()
}

const resetFilter = () => {
  resetAssetList()
  filterConfig.touched = false
}
</script>

<template>
  <VNavigationDrawer
    v-model="sidebarLeft"
    permanent
    :width="300"
  >
    <div class="v-expansion-panel-title px-2">
      {{ t('coreDam.asset.filterTitle') }}
    </div>
    <div class="pa-2">
      <AFilterWrapperSidebar @submit="submitFilter">
        <AssetListFilterForm />
      </AFilterWrapperSidebar>
    </div>
    <template #append>
      <div class="pa-2 d-flex align-center justify-center">
        <VBtn
          color="primary"
          class="mr-2"
          :variant="filterConfig.touched ? 'flat' : 'text'"
          size="small"
          @click.stop="submitFilter"
        >
          {{ t('common.button.submitFilter') }}
        </VBtn>
        <VBtn
          class="px-2"
          color="light"
          min-width="36px"
          variant="flat"
          size="small"
          @click.stop="resetFilter"
        >
          <VIcon icon="mdi-filter-remove-outline" />
          <VTooltip
            activator="parent"
            location="bottom"
          >
            {{ t('common.button.resetFilter') }}
          </VTooltip>
        </VBtn>
      </div>
    </template>
  </VNavigationDrawer>
</template>
