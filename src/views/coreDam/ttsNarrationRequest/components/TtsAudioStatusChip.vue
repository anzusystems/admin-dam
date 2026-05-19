<script lang="ts" setup>
import { computed } from 'vue'
import { AChipNoLink } from '@anzusystems/common-admin'
import type { TtsAudioStatus } from '@/types/coreDam/TtsNarrationRequest'
import { ttsAudioStatusColors, useTtsAudioStatus } from '@/model/coreDam/valueObject/TtsAudioStatus'

const props = withDefaults(
  defineProps<{
    status: TtsAudioStatus
  }>(),
  {}
)

const { getTtsAudioStatusOption } = useTtsAudioStatus()

const statusOption = computed(() => getTtsAudioStatusOption(props.status))
const color = computed(() => ttsAudioStatusColors[props.status])
</script>

<template>
  <AChipNoLink
    v-if="statusOption"
    :color="color"
  >
    {{ statusOption.title }}
  </AChipNoLink>
</template>
