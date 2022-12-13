<script lang="ts" setup>
import { useAssetListActions } from '@/views/dam/asset/list/composables/assetListActions'
import { useI18n } from 'vue-i18n'

const { t } = useI18n({ useScope: 'global' })

const { filter, fetchAssetList } = useAssetListActions()

const submitFilter = () => {
  fetchAssetList()
}
</script>

<template>
  <VForm name="search" @submit.prevent="submitFilter">
    <VTextField
      variant="outlined"
      v-model="filter.text.model"
      :placeholder="t('system.mainBar.search')"
      hide-details
      prepend-inner-icon="mdi-magnify"
      class="mr-2 v-text-field--pill"
      style="min-width: 300px"
      density="compact"
      color="grey"
      clearable
    ></VTextField>
  </VForm>
</template>
