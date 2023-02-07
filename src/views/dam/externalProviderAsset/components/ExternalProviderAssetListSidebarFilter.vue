<script lang="ts" setup>
import AFilterString from '@/components/filter/AFilterString.vue'
import { useI18n } from 'vue-i18n'
import { useMainWrapper } from '@/composables/wrappers/useMainWrapper'
import { useExternalProviderAssetListActions } from '@/views/dam/externalProviderAsset/composables/externalProviderAssetListActions'

const { sidebarLeft } = useMainWrapper()

const { t } = useI18n({ useScope: 'global' })

const { filter, fetchAssetList, resetAssetList, filterTouch, filterUnTouch, filterIsTouched } =
  useExternalProviderAssetListActions()

const submitFilter = () => {
  filterUnTouch()
  fetchAssetList()
}

const resetFilter = () => {
  resetAssetList()
  filterUnTouch()
}

const onAnyFilterUpdate = () => {
  filterTouch()
}
</script>

<template>
  <VNavigationDrawer v-model="sidebarLeft" permanent :width="300">
    <div class="v-expansion-panel-title px-2">{{ t('coreDam.asset.filterTitle') }}</div>
    <div class="pa-2">
      <VForm name="search2" @submit.prevent="submitFilter">
        <VRow>
          <VCol>
            <AFilterString v-model="filter.term" @update:model-value="onAnyFilterUpdate" />
          </VCol>
        </VRow>
      </VForm>
    </div>
    <template #append>
      <div class="pa-2 d-flex align-center justify-center">
        <VBtn
          :color="filterIsTouched ? 'success' : 'secondary'"
          class="mr-2"
          variant="flat"
          size="small"
          @click.stop="submitFilter"
        >
          {{ t('common.button.submitFilter') }}
        </VBtn>
        <VBtn class="px-2" color="light" min-width="36px" variant="flat" size="small" @click.stop="resetFilter">
          <VIcon icon="mdi-filter-remove-outline" />
        </VBtn>
      </div>
    </template>
  </VNavigationDrawer>
</template>
