<script lang="ts" setup>
import { computed } from 'vue'
import { type PodcastMode, usePodcastMode } from '@/model/coreDam/valueObject/PodcastMode'

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
  <VChip v-if="modeOption" label size="small">
    {{ modeOption.title }}
  </VChip>
</template>
