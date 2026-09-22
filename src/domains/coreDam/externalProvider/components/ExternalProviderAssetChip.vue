<script lang="ts" setup>
import { useExternalProviderAssetType } from '@/domains/coreDam/externalProvider/valueObject/ExternalProviderAssetType'

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
