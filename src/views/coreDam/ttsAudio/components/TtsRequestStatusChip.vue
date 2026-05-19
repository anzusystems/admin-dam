<script lang="ts" setup>
import { computed } from 'vue'
import { AChipNoLink } from '@anzusystems/common-admin'
import { TtsRequestStatus } from '@/types/coreDam/TtsAudio'
import { ttsRequestStatusColors, useTtsRequestStatus } from '@/model/coreDam/valueObject/TtsRequestStatus'

const props = withDefaults(
  defineProps<{
    status: TtsRequestStatus
  }>(),
  {}
)

const { getTtsRequestStatusOption } = useTtsRequestStatus()

const statusOption = computed(() => getTtsRequestStatusOption(props.status))
const color = computed(() => ttsRequestStatusColors[props.status])
</script>

<template>
  <AChipNoLink
    v-if="statusOption"
    :color="color"
  >
    {{ statusOption.title }}
  </AChipNoLink>
</template>
