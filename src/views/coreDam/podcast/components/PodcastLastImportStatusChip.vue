<script lang="ts" setup>
import { computed } from 'vue'
import {
  type PodcastLastImportStatusType,
  usePodcastLastImportStatus,
} from '@/model/coreDam/valueObject/PodcastLastImportStatus'
import { AChipNoLink } from '@anzusystems/common-admin'

const props = withDefaults(
  defineProps<{
    status: PodcastLastImportStatusType
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
