<script lang="ts" setup>
import { computed } from 'vue'
import {
  type PodcastLastImportStatus,
  usePodcastLastImportStatus,
} from '@/model/coreDam/valueObject/PodcastLastImportStatus'
import { AChipNoLink } from '@anzusystems/common-admin'

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
  <AChipNoLink v-if="statusOption">
    {{ statusOption.title }}
  </AChipNoLink>
</template>
