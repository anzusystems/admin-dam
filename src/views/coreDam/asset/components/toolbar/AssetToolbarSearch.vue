<script lang="ts" setup>
import { useAssetListActions } from '@/views/coreDam/asset/list/composables/assetListActions'
import AssetSearchInput from '@/views/coreDam/asset/components/toolbar/AssetSearchInput.vue'

const { filter, fetchAssetList } = useAssetListActions()

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
      v-model="filter.text.model"
      @submit="submitFilter"
    />
  </VForm>
</template>
