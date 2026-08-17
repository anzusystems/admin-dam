<script lang="ts" setup>
import { useAssetFileFailReason } from '@/domains/coreDam/asset/valueObject/AssetFileFailReason'
import { AChipNoLink, type AssetFileFailReasonType } from '@anzusystems/common-admin'

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
