<script lang="ts" setup>
import { useExternalProviderAssetListActions } from '@/domains/coreDam/externalProvider/composables/externalProviderAssetListActions'
import AssetSearchInput from '@/domains/coreDam/asset/components/toolbar/AssetSearchInput.vue'

const { filterData, fetchAssetList } = useExternalProviderAssetListActions()

const term = computed<string | null>({
  get: () => (filterData.term as string | null) ?? null,
  set: (value) => {
    filterData.term = value
  },
})

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
      v-model="term"
      @submit="submitFilter"
    />
  </VForm>
</template>
