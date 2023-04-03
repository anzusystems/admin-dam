<script lang="ts" setup>
import { computed } from 'vue'
import { type PodcastMode, usePodcastMode } from '@/model/coreDam/valueObject/PodcastMode'
import { AChipNoLink } from '@anzusystems/common-admin'

const props = withDefaults(
  defineProps<{
    mode: PodcastMode
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
