<script lang="ts" setup>
import { AChipNoLink } from '@anzusystems/common-admin'
import { computed } from 'vue'

import { usePodcastLastImportStatus } from '@/domains/coreDam/podcast/valueObject/PodcastLastImportStatus'
import type { PodcastLastImportStatusType } from '@/domains/coreDam/podcast/valueObject/PodcastLastImportStatus'

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
