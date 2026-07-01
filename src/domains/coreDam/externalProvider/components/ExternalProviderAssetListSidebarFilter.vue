<script lang="ts" setup>
import { useMainWrapper } from '@/domains/system/composables/useMainWrapper'
import { useExternalProviderAssetListActions } from '@/domains/coreDam/externalProvider/composables/externalProviderAssetListActions'
import { AFilterString, AFilterWrapperSidebar } from '@anzusystems/common-admin/labs'

const { sidebarLeft } = useMainWrapper()

const { t } = useI18n()

const { filterConfig, fetchAssetList, resetAssetList } = useExternalProviderAssetListActions()

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
        <VRow>
          <VCol>
            <AFilterString name="term" />
          </VCol>
        </VRow>
      </AFilterWrapperSidebar>
    </div>
    <template #append>
      <div class="pa-2 d-flex align-center justify-center">
        <VBtn
          :color="filterConfig.touched ? 'success' : 'secondary'"
          class="mr-2"
          variant="flat"
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
        </VBtn>
      </div>
    </template>
  </VNavigationDrawer>
</template>
