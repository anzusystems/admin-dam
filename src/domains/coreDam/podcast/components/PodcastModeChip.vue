<script lang="ts" setup>
import { AChipNoLink } from '@anzusystems/common-admin'

import { usePodcastMode } from '@/domains/coreDam/podcast/valueObject/PodcastMode'
import type { PodcastModeType } from '@/domains/coreDam/podcast/valueObject/PodcastMode'

const props = withDefaults(
  defineProps<{
    mode: PodcastModeType
  }>(),
  {}
)

const { getPodcastModeOption } = usePodcastMode()
const modeOption = computed(() => {
  return getPodcastModeOption(props.mode)
})
</script>

<template>
  <AChipNoLink v-if="modeOption">
    {{ modeOption.title }}
  </AChipNoLink>
</template>
