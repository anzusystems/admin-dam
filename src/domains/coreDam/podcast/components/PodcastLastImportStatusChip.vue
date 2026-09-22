<script lang="ts" setup>
import {
  type PodcastLastImportStatusType,
  usePodcastLastImportStatus,
} from '@/domains/coreDam/podcast/valueObject/PodcastLastImportStatus'
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
