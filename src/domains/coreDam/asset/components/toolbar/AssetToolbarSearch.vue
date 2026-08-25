<script lang="ts" setup>
import { useAssetListActions } from '@/domains/coreDam/asset/components/list/composables/assetListActions'
import AssetSearchInput from '@/domains/coreDam/asset/components/toolbar/AssetSearchInput.vue'

const { filterData, fetchAssetList } = useAssetListActions()

const term = computed<string | null>({
  get: () => (filterData.text as string | null) ?? null,
  set: (value) => {
    filterData.text = value
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
