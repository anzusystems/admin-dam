<script lang="ts" setup>
import { computed } from 'vue'
import { AChipNoLink } from '@anzusystems/common-admin'
import type { TtsRequestStatusType } from '@/types/coreDam/TtsNarrationRequest'
import { useTtsRequestStatus } from '@/model/coreDam/valueObject/TtsRequestStatus'

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
