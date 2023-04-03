<script lang="ts" setup>
import { computed } from 'vue'
import { type AssetFileFailReason, useAssetFileFailReason } from '@/model/coreDam/valueObject/AssetFileFailReason'

const props = withDefaults(
  defineProps<{
    reason: AssetFileFailReason
  }>(),
  {}
)

const { getAssetFileFailReasonOption } = useAssetFileFailReason()
const reasonOption = computed(() => {
  return getAssetFileFailReasonOption(props.reason)
})
</script>

<template>
  <VChip
    v-if="reasonOption"
    label
    size="small"
  >
    {{ reasonOption.title }}
  </VChip>
</template>
