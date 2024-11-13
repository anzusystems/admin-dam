<script lang="ts" setup>
import { useAssetFileFailReason } from '@/model/coreDam/valueObject/AssetFileFailReason'
import { AChipNoLink, type AssetFileFailReasonType } from '@anzusystems/common-admin'
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    reason: AssetFileFailReasonType
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
