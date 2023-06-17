<script lang="ts" setup>
import { computed } from 'vue'
import { useExternalProviderAssetType } from '@/model/coreDam/valueObject/ExternalProviderAssetType'

const props = defineProps<{
  providerName: string
}>()

const { getExternalProviderAssetTypeOption } = useExternalProviderAssetType()

const item = computed(() => {
  return getExternalProviderAssetTypeOption(props.providerName)
})
</script>

<template>
  <div class="d-inline-flex">
    <VChip
      v-if="item"
      label
      size="small"
      class="v-chip-custom-no-link"
    >
      {{ item.title }}
    </VChip>
  </div>
</template>
