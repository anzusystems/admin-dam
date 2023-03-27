<script lang="ts" setup>
import { computed } from 'vue'
import {
  type PodcastLastImportStatus,
  usePodcastLastImportStatus,
} from '@/model/coreDam/valueObject/PodcastLastImportStatus'

const props = withDefaults(
  defineProps<{
    status: PodcastLastImportStatus
  }>(),
  {}
)

const { getPodcastLastImportStatusOption } = usePodcastLastImportStatus()
const statusOption = computed(() => {
  return getPodcastLastImportStatusOption(props.status)
})
</script>

<template>
  <VChip v-if="statusOption" label size="small" class="v-chip-custom-no-link">
    {{ statusOption.title }}
  </VChip>
</template>
