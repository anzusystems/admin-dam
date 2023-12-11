<script lang="ts" setup>
import { computed } from 'vue'
import { useAssetFileFailReason } from '@/model/coreDam/valueObject/AssetFileFailReason'
import { AChipNoLink, type AssetFileFailReason } from '@anzusystems/common-admin'

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
