<script lang="ts" setup>
import { AChipNoLink } from '@anzusystems/common-admin'
import type { AssetFileFailReasonType } from '@anzusystems/common-admin'
import { computed } from 'vue'

import { useAssetFileFailReason } from '@/domains/coreDam/asset/valueObject/AssetFileFailReason'

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
