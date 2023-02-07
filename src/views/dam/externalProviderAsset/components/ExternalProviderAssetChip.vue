<script lang="ts" setup>
import { computed } from 'vue'
import { useExternalProviderAssetType } from '@/model/dam/valueObject/ExternalProviderAssetType'

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
    <VChip v-if="item" rounded="lg" size="small" variant="tonal">
      {{ item.title }}
    </VChip>
  </div>
</template>
