<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { useExternalProviderAssetListActions } from '@/views/coreDam/externalProviderAsset/composables/externalProviderAssetListActions'

const { t } = useI18n()

const { filter, fetchAssetList } = useExternalProviderAssetListActions()

const submitFilter = () => {
  fetchAssetList()
}
</script>

<template>
  <VForm
    name="search"
    @submit.prevent="submitFilter"
  >
    <VTextField
      v-model="filter.term.model"
      variant="outlined"
      :placeholder="t('system.mainBar.search')"
      hide-details
      prepend-inner-icon="mdi-magnify"
      class="mr-2 v-text-field--pill"
      style="min-width: 300px"
      density="compact"
      color="grey"
      clearable
    />
  </VForm>
</template>
