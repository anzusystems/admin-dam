<script lang="ts" setup>
import { useExternalProviderAssetListActions } from '@/views/coreDam/externalProviderAsset/composables/externalProviderAssetListActions'
import AssetSearchInput from '@/views/coreDam/asset/components/toolbar/AssetSearchInput.vue'

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
    <AssetSearchInput
      v-model="filter.term.model"
      @submit="submitFilter"
    />
  </VForm>
</template>
