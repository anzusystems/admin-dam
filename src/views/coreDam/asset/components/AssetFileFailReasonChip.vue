<script lang="ts" setup>
import { computed } from 'vue'
import { type AssetFileFailReason, useAssetFileFailReason } from '@/model/coreDam/valueObject/AssetFileFailReason'
import { AChipNoLink } from '@anzusystems/common-admin'

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
  <AChipNoLink v-if="reasonOption">
    {{ reasonOption.title }}
  </AChipNoLink>
</template>
