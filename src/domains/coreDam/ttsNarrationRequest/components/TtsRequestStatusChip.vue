<script lang="ts" setup>
import { computed } from 'vue'
import { AChipNoLink } from '@anzusystems/common-admin'
import type { TtsRequestStatusType } from '@/domains/coreDam/ttsNarrationRequest/types/TtsNarrationRequest'
import { useTtsRequestStatus } from '@/domains/coreDam/ttsNarrationRequest/valueObject/TtsRequestStatus'

const props = withDefaults(
  defineProps<{
    status: TtsRequestStatusType
  }>(),
  {}
)

const { getTtsRequestStatusOption } = useTtsRequestStatus()

const statusOption = computed(() => getTtsRequestStatusOption(props.status))
</script>

<template>
  <AChipNoLink
    v-if="statusOption"
    :color="statusOption.color"
  >
    {{ statusOption.title }}
  </AChipNoLink>
</template>
